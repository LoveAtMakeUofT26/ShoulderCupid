cmake_minimum_required(VERSION 3.16)
project(presage-processor LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# SmartSpectra SDK (installed via apt: libsmartspectra-dev)
# Transitively brings in PhysiologyEdge, OpenCV, mediapipe, abseil, protobuf
find_package(SmartSpectra REQUIRED)

add_executable(presage-processor main.cpp)

# SmartSpectra::Container includes BackgroundContainer + all video sources
target_link_libraries(presage-processor PRIVATE SmartSpectra::Container)

install(TARGETS presage-processor DESTINATION bin)
