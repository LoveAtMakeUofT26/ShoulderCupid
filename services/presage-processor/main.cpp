/**
 * Presage SmartSpectra Headless Processor
 *
 * Watches a directory for video segments and processes them through
 * SmartSpectra's BackgroundContainer for contactless vital sign analysis.
 *
 * Output: JSON lines to stdout with metrics per segment.
 *
 * Build:
 *   mkdir build && cd build
 *   cmake .. && make
 *
 * Run:
 *   ./presage-processor /opt/cupid/data/segments
 */

#include <iostream>
#include <filesystem>
#include <thread>
#include <chrono>
#include <string>
#include <set>
#include <SmartSpectra/BackgroundContainer.h>

namespace fs = std::filesystem;

// JSON helper - output a single metric result
void outputMetrics(const std::string& segmentFile,
                   double hr, double br, double hrv,
                   bool blinking, bool talking) {
    std::cout << "{"
              << "\"segment\":\"" << segmentFile << "\","
              << "\"hr\":" << hr << ","
              << "\"br\":" << br << ","
              << "\"hrv\":" << hrv << ","
              << "\"blinking\":" << (blinking ? "true" : "false") << ","
              << "\"talking\":" << (talking ? "true" : "false") << ","
              << "\"timestamp\":" << std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count()
              << "}" << std::endl;
}

class CupidMetricsCallback : public SmartSpectra::MetricsCallback {
public:
    double lastHR = 0;
    double lastBR = 0;
    double lastHRV = 0;
    bool lastBlinking = false;
    bool lastTalking = false;
    bool hasResults = false;

    void onPulseRate(double value) override {
        lastHR = value;
        hasResults = true;
    }

    void onBreathingRate(double value) override {
        lastBR = value;
    }

    void onHRV(double value) override {
        lastHRV = value;
    }

    void onBlinking(bool value) override {
        lastBlinking = value;
    }

    void onTalking(bool value) override {
        lastTalking = value;
    }

    void onError(const std::string& error) override {
        std::cerr << "[presage-error] " << error << std::endl;
    }
};

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: presage-processor <segments_dir>" << std::endl;
        std::cerr << "  Watches <segments_dir> for .mp4 files and processes them." << std::endl;
        return 1;
    }

    const std::string segmentsDir = argv[1];

    // Ensure directory exists
    if (!fs::exists(segmentsDir)) {
        fs::create_directories(segmentsDir);
    }

    std::cerr << "[presage] Starting SmartSpectra processor" << std::endl;
    std::cerr << "[presage] Watching: " << segmentsDir << std::endl;

    // Track processed files to avoid reprocessing
    std::set<std::string> processedFiles;

    // Main watch loop
    while (true) {
        try {
            for (const auto& entry : fs::directory_iterator(segmentsDir)) {
                if (!entry.is_regular_file()) continue;

                const auto& path = entry.path();
                if (path.extension() != ".mp4") continue;

                const std::string filename = path.filename().string();

                // Skip already processed
                if (processedFiles.count(filename)) continue;

                std::cerr << "[presage] Processing: " << filename << std::endl;

                // Configure SmartSpectra for headless video processing
                SmartSpectra::Settings settings;
                settings.headless = true;
                settings.video_source.input_video_path = path.string();

                // Create callback
                CupidMetricsCallback callback;

                // Create and run BackgroundContainer
                SmartSpectra::BackgroundContainer container(settings, &callback);
                container.start();

                // Wait for processing to complete (video file, not live stream)
                // BackgroundContainer processes the video and calls callbacks
                container.waitForCompletion();
                container.stop();

                if (callback.hasResults) {
                    outputMetrics(filename,
                                  callback.lastHR,
                                  callback.lastBR,
                                  callback.lastHRV,
                                  callback.lastBlinking,
                                  callback.lastTalking);
                } else {
                    std::cerr << "[presage] No results for: " << filename << std::endl;
                }

                processedFiles.insert(filename);

                // Delete processed segment to save disk space
                fs::remove(path);
            }
        } catch (const std::exception& e) {
            std::cerr << "[presage-error] " << e.what() << std::endl;
        }

        // Poll every 2 seconds
        std::this_thread::sleep_for(std::chrono::seconds(2));
    }

    return 0;
}
