cmake_minimum_required(VERSION 3.16)
project(presage-processor LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find SmartSpectra SDK (installed via apt on Ubuntu 22.04)
find_package(SmartSpectra REQUIRED)

add_executable(presage-processor main.cpp)

target_link_libraries(presage-processor PRIVATE SmartSpectra::SmartSpectra)

install(TARGETS presage-processor DESTINATION bin)
