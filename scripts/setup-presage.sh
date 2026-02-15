#!/usr/bin/env bash
#
# Setup Presage SmartSpectra C++ SDK on Ubuntu 22.04 (Vultr)
#
# Prerequisites:
#   - Ubuntu 22.04 server
#   - Presage API key (sign up at https://presage.com)
#
# Run: bash scripts/setup-presage.sh
#
# Environment:
#   PRESAGE_API_KEY - Required. Set in /opt/cupid/.env or export before running.
#

set -euo pipefail

echo "=== Cupid: Presage SmartSpectra Setup ==="
echo ""

# Check Ubuntu version
if ! grep -q "22.04" /etc/os-release 2>/dev/null; then
    echo "WARNING: SmartSpectra SDK is tested on Ubuntu 22.04"
    cat /etc/os-release | head -3
    echo ""
fi

# 1. Install system dependencies
echo "[1/6] Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq \
    libcurl4-openssl-dev \
    libssl-dev \
    libv4l-dev \
    libegl-dev \
    libgles-dev \
    libgles2-mesa-dev \
    libegl1-mesa-dev \
    libgl-dev \
    libunwind-dev \
    cmake \
    build-essential \
    ffmpeg

# 2. Install SmartSpectra SDK via PPA
echo "[2/6] Adding Presage PPA and installing SDK..."
curl -fsSL "https://presage-security.github.io/PPA/KEY.gpg" | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/presage-technologies.gpg >/dev/null
sudo curl -fsSL --compressed -o /etc/apt/sources.list.d/presage-technologies.list "https://presage-security.github.io/PPA/presage-technologies.list"
sudo apt-get update -qq
sudo apt-get install -y -qq libsmartspectra-dev

# 3. Upgrade CMake (need 3.27+ for GLES3 support in FindOpenGL)
echo "[3/6] Checking CMake version..."
CMAKE_VERSION=$(cmake --version | head -1 | awk '{print $3}')
CMAKE_MAJOR=$(echo "$CMAKE_VERSION" | cut -d. -f1)
CMAKE_MINOR=$(echo "$CMAKE_VERSION" | cut -d. -f2)
if [ "$CMAKE_MAJOR" -lt 3 ] || ([ "$CMAKE_MAJOR" -eq 3 ] && [ "$CMAKE_MINOR" -lt 27 ]); then
    echo "CMake $CMAKE_VERSION too old, upgrading via Kitware APT..."
    wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null | gpg --dearmor - | sudo tee /usr/share/keyrings/kitware-archive-keyring.gpg >/dev/null
    echo "deb [signed-by=/usr/share/keyrings/kitware-archive-keyring.gpg] https://apt.kitware.com/ubuntu/ jammy main" | sudo tee /etc/apt/sources.list.d/kitware.list >/dev/null
    sudo apt-get update -qq
    sudo apt-get install -y -qq cmake
    echo "CMake upgraded to: $(cmake --version | head -1)"
else
    echo "CMake $CMAKE_VERSION OK"
fi

# 4. Create data directories
echo "[4/6] Creating data directories..."
sudo mkdir -p /opt/cupid/data/frames
sudo chown -R "$USER":"$USER" /opt/cupid

# 5. Build the C++ processor
echo "[5/6] Building presage-processor..."
PROCESSOR_DIR="/opt/cupid/services/presage-processor"
mkdir -p "$PROCESSOR_DIR/build"
cd "$PROCESSOR_DIR/build"
cmake ..
make -j"$(nproc 2>/dev/null || echo 2)"

echo "[6/6] Build complete!"
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Binary:     $PROCESSOR_DIR/build/presage-processor"
echo "Frames dir: /opt/cupid/data/frames/"
echo ""
echo "IMPORTANT: SmartSpectra requires a Presage API key."
echo "Set PRESAGE_API_KEY in /opt/cupid/.env or your environment."
echo "Get a key at: https://presage.com"
echo ""
echo "The processor is spawned per-session by the Node.js backend."
echo "No PM2 setup needed - it manages processor lifecycle automatically."
