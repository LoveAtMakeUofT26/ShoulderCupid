/**
 * Presage SmartSpectra Session Processor
 *
 * Processes camera frames for a single session using SmartSpectra SDK.
 * Reads JPEG frames from a directory and feeds them to BackgroundContainer
 * via AddFrameWithTimestamp(). Outputs JSON metrics to stdout.
 *
 * Usage:
 *   ./presage-processor <session_id> <frames_dir> [api_key]
 *
 * Frames should be named: frame{timestamp_us}.jpg (16-digit microsecond timestamp)
 * Write "end_of_stream" file to signal session end.
 *
 * Build:
 *   mkdir build && cd build
 *   cmake .. && make
 */

#include <iostream>
#include <string>
#include <chrono>
#include <thread>
#include <csignal>
#include <set>
#include <filesystem>
#include <regex>

#include <smartspectra/container/background_container.hpp>
#include <mediapipe/framework/port/opencv_imgcodecs_inc.h>
#include <opencv2/imgproc.hpp>

namespace ss_settings = presage::smartspectra::container::settings;
namespace ss_container = presage::smartspectra::container;
namespace fs = std::filesystem;

// Signal handling for graceful shutdown
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
              << "}" << std::endl;  // flush immediately
}

// Parse microsecond timestamp from frame filename (e.g., frame1771128393802681.jpg)
static int64_t parseTimestamp(const std::string& filename) {
    static const std::regex re("frame(\\d+)\\.jpg");
    std::smatch match;
    if (std::regex_match(filename, match, re) && match.size() == 2) {
        return std::stoll(match[1].str());
    }
    return -1;
}

int main(int argc, char* argv[]) {
    if (argc < 3) {
        std::cerr << "Usage: presage-processor <session_id> <frames_dir> [api_key]" << std::endl;
        std::cerr << std::endl;
        std::cerr << "  session_id  - Session identifier (used in JSON output)" << std::endl;
        std::cerr << "  frames_dir  - Directory containing JPEG frames" << std::endl;
        std::cerr << "  api_key     - Presage REST API key (optional, enables HR)" << std::endl;
        return 1;
    }

    const std::string session_id = argv[1];
    const std::string frames_dir = argv[2];
    const std::string api_key = (argc > 3) ? argv[3] : "";

    std::signal(SIGTERM, signal_handler);
    std::signal(SIGINT, signal_handler);

    std::cerr << "[presage] Session: " << session_id << std::endl;
    std::cerr << "[presage] Frames dir: " << frames_dir << std::endl;
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

    // We feed frames manually via AddFrameWithTimestamp, so no video source needed
    // Leave video_source paths empty (device_index=0 won't be used since we feed manually)

    // Continuous mode: buffer preprocessed data every 0.5s
    settings.continuous.preprocessed_data_buffer_duration_s = 0.5;

    // REST integration (API key enables cloud-based heart rate analysis)
    if (!api_key.empty()) {
        settings.integration.api_key = api_key;
    }

    // Enable edge metrics for local processing (breathing, face detection)
    settings.enable_edge_metrics = true;
    settings.scale_input = true;

    // Create container
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

    // Start the processing graph
    auto start_status = processor.StartGraph();
    if (!start_status.ok()) {
        std::cerr << "[presage] Start failed: " << start_status.message() << std::endl;
        return 1;
    }

    std::cerr << "[presage] Graph running, polling for frames in " << frames_dir << std::endl;

    // --- Main loop: poll directory for new JPEG frames and feed them ---
    std::set<std::string> processed_files;
    const auto end_of_stream_path = fs::path(frames_dir) / "end_of_stream";
    int frames_fed = 0;

    while (g_running) {
        // Check for end of stream signal
        if (fs::exists(end_of_stream_path)) {
            std::cerr << "[presage] End of stream detected after " << frames_fed << " frames" << std::endl;
            break;
        }

        // Scan directory for new frame files
        bool found_new = false;
        try {
            // Collect and sort new frames by timestamp
            std::map<int64_t, fs::path> new_frames;
            for (const auto& entry : fs::directory_iterator(frames_dir)) {
                if (!entry.is_regular_file()) continue;
                const auto filename = entry.path().filename().string();
                if (filename.find(".jpg") == std::string::npos) continue;
                if (processed_files.count(filename)) continue;

                int64_t ts = parseTimestamp(filename);
                if (ts > 0) {
                    new_frames[ts] = entry.path();
                }
            }

            // Feed frames in timestamp order
            for (const auto& [ts, path] : new_frames) {
                cv::Mat frame = cv::imread(path.string(), cv::IMREAD_COLOR);
                if (frame.empty()) {
                    std::cerr << "[presage] Failed to read: " << path.filename() << std::endl;
                    processed_files.insert(path.filename().string());
                    continue;
                }

                // Convert BGR to RGB (OpenCV loads as BGR, SmartSpectra expects RGB)
                cv::Mat frame_rgb;
                cv::cvtColor(frame, frame_rgb, cv::COLOR_BGR2RGB);

                auto add_status = processor.AddFrameWithTimestamp(frame_rgb, ts);
                if (!add_status.ok()) {
                    std::cerr << "[presage] AddFrame error: " << add_status.message() << std::endl;
                }

                processed_files.insert(path.filename().string());
                frames_fed++;
                found_new = true;

                // Delete processed frame to save disk space
                try { fs::remove(path); } catch (...) {}
            }
        } catch (const std::exception& e) {
            std::cerr << "[presage] Scan error: " << e.what() << std::endl;
        }

        // If no new frames, wait before rescanning
        if (!found_new) {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }

    // Wait for any remaining frames to be processed
    std::cerr << "[presage] Waiting for graph to finish..." << std::endl;
    auto idle_status = processor.WaitUntilGraphIsIdle();
    if (!idle_status.ok()) {
        std::cerr << "[presage] Wait error: " << idle_status.message() << std::endl;
    }

    // Stop and clean up
    auto stop_status = processor.StopGraph();
    if (!stop_status.ok()) {
        std::cerr << "[presage] Stop error: " << stop_status.message() << std::endl;
    }

    std::cerr << "[presage] Session " << session_id << " complete. Processed " << frames_fed << " frames." << std::endl;
    return 0;
}
