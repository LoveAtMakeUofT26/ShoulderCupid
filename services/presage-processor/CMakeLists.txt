cmake_minimum_required(VERSION 3.16)
project(presage-processor LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# SmartSpectra SDK (installed via apt: libsmartspectra-dev)
# Transitively brings in PhysiologyEdge, OpenCV, mediapipe, abseil, protobuf
find_package(SmartSpectra REQUIRED)

# nlohmann/json for stdin JSON parsing
include(FetchContent)
FetchContent_Declare(json
    URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
)
FetchContent_MakeAvailable(json)

add_executable(presage-processor main.cpp)

# SmartSpectra::Container includes BackgroundContainer + all video sources
# nlohmann_json for JSON parsing, absl (from SmartSpectra) for base64
target_link_libraries(presage-processor PRIVATE
    SmartSpectra::Container
    nlohmann_json::nlohmann_json
)

install(TARGETS presage-processor DESTINATION bin)
