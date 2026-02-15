/**
 * Presage SmartSpectra Session Processor (stdin-based)
 *
 * Reads JPEG frames from stdin as line-delimited JSON,
 * decodes them in-process, and feeds to BackgroundContainer.
 * Outputs JSON metrics to stdout.
 *
 * Usage:
 *   ./presage-processor <session_id> [api_key]
 *
 * Stdin protocol: one JSON object per line
 *   {"type":"frame","jpeg":"<base64>","ts":<microseconds>}
 *
 * On stdin EOF: graceful shutdown.
 *
 * Build:
 *   mkdir build && cd build
 *   cmake .. && make
 */

#include <iostream>
#include <string>
#include <chrono>
#include <csignal>
#include <vector>

#include <smartspectra/container/background_container.hpp>
#include <opencv2/imgcodecs.hpp>
#include <opencv2/imgproc.hpp>
#include <nlohmann/json.hpp>
#include <absl/strings/escaping.h>

namespace ss_settings = presage::smartspectra::container::settings;
namespace ss_container = presage::smartspectra::container;
using json = nlohmann::json;

static volatile sig_atomic_t g_running = 1;
static void signal_handler(int) { g_running = 0; }

// Output a JSON metric line to stdout (consumed by Node.js readline)
static void outputJson(const std::string& session_id,
                       const std::string& type,
                       double hr, double br,
                       bool blinking, bool talking,
                       double hr_conf, double br_conf) {
    auto now_ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();

    std::cout << "{"
              << "\"session_id\":\"" << session_id << "\","
              << "\"type\":\"" << type << "\","
              << "\"hr\":" << hr << ","
              << "\"br\":" << br << ","
              << "\"hrv\":0,"
              << "\"blinking\":" << (blinking ? "true" : "false") << ","
              << "\"talking\":" << (talking ? "true" : "false") << ","
              << "\"hr_confidence\":" << hr_conf << ","
              << "\"br_confidence\":" << br_conf << ","
              << "\"timestamp\":" << now_ms
              << "}" << std::endl;
}

static void outputStatus(const std::string& session_id,
                          const std::string& status,
                          int frames_processed) {
    std::cout << "{"
              << "\"session_id\":\"" << session_id << "\","
              << "\"type\":\"status\","
              << "\"status\":\"" << status << "\","
              << "\"frames_processed\":" << frames_processed
              << "}" << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: presage-processor <session_id> [api_key]" << std::endl;
        std::cerr << std::endl;
        std::cerr << "  session_id  - Session identifier (used in JSON output)" << std::endl;
        std::cerr << "  api_key     - Presage REST API key (optional, enables HR)" << std::endl;
        return 1;
    }

    const std::string session_id = argv[1];
    const std::string api_key = (argc > 2) ? argv[2] : "";

    std::signal(SIGTERM, signal_handler);
    std::signal(SIGINT, signal_handler);

    std::cerr << "[presage] Session: " << session_id << std::endl;
    std::cerr << "[presage] Mode: stdin (pipe)" << std::endl;
    std::cerr << "[presage] API key: " << (api_key.empty() ? "(none - edge metrics only)" : "(set)") << std::endl;

    // Use Continuous + REST mode with BackgroundContainer
    using ContainerType = ss_container::BackgroundContainer<
        presage::platform_independence::DeviceType::Cpu,
        ss_settings::OperationMode::Continuous,
        ss_settings::IntegrationMode::Rest
    >;
    using SettingsType = ss_settings::Settings<
        ss_settings::OperationMode::Continuous,
        ss_settings::IntegrationMode::Rest
    >;

    SettingsType settings;
    settings.continuous.preprocessed_data_buffer_duration_s = 0.5;

    if (!api_key.empty()) {
        settings.integration.api_key = api_key;
    }

    settings.enable_edge_metrics = true;
    settings.scale_input = true;

    ContainerType processor(settings);

    // --- Register edge metrics callback (local: breathing, blinking, talking) ---
    auto edge_status = processor.SetOnEdgeMetricsOutput(
        [&session_id](const presage::physiology::Metrics& metrics, int64_t /*timestamp*/) -> absl::Status {
            double br = 0.0;
            double br_conf = 0.0;
            bool blinking = false;
            bool talking = false;

            if (metrics.breathing().rate_size() > 0) {
                const auto& latest = metrics.breathing().rate(metrics.breathing().rate_size() - 1);
                br = latest.value();
                br_conf = latest.confidence();
            }

            if (metrics.face().blinking_size() > 0) {
                blinking = metrics.face().blinking(metrics.face().blinking_size() - 1).detected();
            }
            if (metrics.face().talking_size() > 0) {
                talking = metrics.face().talking(metrics.face().talking_size() - 1).detected();
            }

            outputJson(session_id, "edge", 0, br, blinking, talking, 0, br_conf);
            return absl::OkStatus();
        }
    );
    if (!edge_status.ok()) {
        std::cerr << "[presage] Failed to set edge callback: " << edge_status.message() << std::endl;
    }

    // --- Register core metrics callback (cloud: heart rate + everything) ---
    auto core_status = processor.SetOnCoreMetricsOutput(
        [&session_id](const presage::physiology::MetricsBuffer& buffer, int64_t /*timestamp*/) -> absl::Status {
            double hr = 0.0, br = 0.0;
            double hr_conf = 0.0, br_conf = 0.0;
            bool blinking = false, talking = false;

            if (buffer.pulse().rate_size() > 0) {
                const auto& latest = buffer.pulse().rate(buffer.pulse().rate_size() - 1);
                hr = latest.value();
                hr_conf = latest.confidence();
            }

            if (buffer.breathing().rate_size() > 0) {
                const auto& latest = buffer.breathing().rate(buffer.breathing().rate_size() - 1);
                br = latest.value();
                br_conf = latest.confidence();
            }

            if (buffer.face().blinking_size() > 0) {
                blinking = buffer.face().blinking(buffer.face().blinking_size() - 1).detected();
            }
            if (buffer.face().talking_size() > 0) {
                talking = buffer.face().talking(buffer.face().talking_size() - 1).detected();
            }

            outputJson(session_id, "core", hr, br, blinking, talking, hr_conf, br_conf);
            return absl::OkStatus();
        }
    );
    if (!core_status.ok()) {
        std::cerr << "[presage] Failed to set core callback: " << core_status.message() << std::endl;
    }

    // --- Register status callback ---
    auto status_cb_status = processor.SetOnStatusChange(
        [](presage::physiology::StatusValue status) -> absl::Status {
            std::cerr << "[presage] Status: " << status << std::endl;
            return absl::OkStatus();
        }
    );
    if (!status_cb_status.ok()) {
        std::cerr << "[presage] Failed to set status callback: " << status_cb_status.message() << std::endl;
    }

    // Initialize the processing graph
    auto init_status = processor.Initialize();
    if (!init_status.ok()) {
        std::cerr << "[presage] Init failed: " << init_status.message() << std::endl;
        return 1;
    }

    std::cerr << "[presage] Initialized, starting graph..." << std::endl;

    auto start_status = processor.StartGraph();
    if (!start_status.ok()) {
        std::cerr << "[presage] Start failed: " << start_status.message() << std::endl;
        return 1;
    }

    outputStatus(session_id, "ready", 0);
    std::cerr << "[presage] Graph running, reading frames from stdin" << std::endl;

    // --- Main loop: read JSON lines from stdin ---
    int frames_fed = 0;
    std::string line;

    while (g_running && std::getline(std::cin, line)) {
        if (line.empty()) continue;

        try {
            auto msg = json::parse(line);

            if (msg.value("type", "") != "frame") continue;

            std::string jpeg_b64 = msg.value("jpeg", "");
            int64_t ts = msg.value("ts", (int64_t)0);

            if (jpeg_b64.empty() || ts <= 0) {
                std::cerr << "[presage] Invalid frame: missing jpeg or ts" << std::endl;
                continue;
            }

            // Decode base64 -> raw bytes
            std::string raw_bytes;
            if (!absl::Base64Unescape(jpeg_b64, &raw_bytes)) {
                std::cerr << "[presage] Base64 decode failed" << std::endl;
                continue;
            }

            // Decode JPEG -> cv::Mat
            std::vector<uint8_t> buf(raw_bytes.begin(), raw_bytes.end());
            cv::Mat frame = cv::imdecode(buf, cv::IMREAD_COLOR);
            if (frame.empty()) {
                std::cerr << "[presage] JPEG decode failed" << std::endl;
                continue;
            }

            // BGR -> RGB (OpenCV loads as BGR, SmartSpectra expects RGB)
            cv::Mat frame_rgb;
            cv::cvtColor(frame, frame_rgb, cv::COLOR_BGR2RGB);

            auto add_status = processor.AddFrameWithTimestamp(frame_rgb, ts);
            if (!add_status.ok()) {
                std::cerr << "[presage] AddFrame error: " << add_status.message() << std::endl;
            }

            frames_fed++;

            // Periodic status (every 50 frames ~25s at 2 FPS)
            if (frames_fed % 50 == 0) {
                outputStatus(session_id, "processing", frames_fed);
            }

        } catch (const json::exception& e) {
            std::cerr << "[presage] JSON parse error: " << e.what() << std::endl;
        }
    }

    // stdin EOF or signal -> graceful shutdown
    std::cerr << "[presage] EOF/signal, shutting down after " << frames_fed << " frames" << std::endl;

    auto idle_status = processor.WaitUntilGraphIsIdle();
    if (!idle_status.ok()) {
        std::cerr << "[presage] Wait error: " << idle_status.message() << std::endl;
    }

    auto stop_status = processor.StopGraph();
    if (!stop_status.ok()) {
        std::cerr << "[presage] Stop error: " << stop_status.message() << std::endl;
    }

    outputStatus(session_id, "stopped", frames_fed);
    std::cerr << "[presage] Session " << session_id << " complete. " << frames_fed << " frames." << std::endl;
    return 0;
}
