#!/usr/bin/env bash
#
# Setup Presage SmartSpectra C++ SDK on Ubuntu 22.04 (Vultr)
#
# Run: bash scripts/setup-presage.sh
#

set -euo pipefail

echo "=== Cupid: Presage SmartSpectra Setup ==="
echo ""

# Check Ubuntu version
if ! grep -q "22.04" /etc/os-release 2>/dev/null; then
    echo "WARNING: SmartSpectra SDK is tested on Ubuntu 22.04"
    echo "Current OS:"
    cat /etc/os-release | head -3
    echo ""
fi

# 1. Install SmartSpectra SDK via PPA
echo "[1/5] Adding Presage PPA..."
curl -fsSL "https://presage-security.github.io/PPA/KEY.gpg" | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/presage-technologies.gpg >/dev/null
sudo curl -fsSL --compressed -o /etc/apt/sources.list.d/presage-technologies.list "https://presage-security.github.io/PPA/presage-technologies.list"

echo "[2/5] Installing SmartSpectra SDK and dependencies..."
sudo apt update
sudo apt install -y libsmartspectra-dev ffmpeg cmake build-essential

# 2. Create data directories
echo "[3/5] Creating data directories..."
sudo mkdir -p /opt/cupid/data/frames
sudo mkdir -p /opt/cupid/data/segments
sudo chown -R "$USER":"$USER" /opt/cupid

# 3. Build the C++ processor
echo "[4/5] Building presage-processor..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROCESSOR_DIR="$PROJECT_ROOT/services/presage-processor"

mkdir -p "$PROCESSOR_DIR/build"
cd "$PROCESSOR_DIR/build"
cmake ..
make -j"$(nproc)"

echo "[5/5] Setting up PM2 process..."
# Check if PM2 is available
if command -v pm2 &>/dev/null; then
    pm2 start "$PROCESSOR_DIR/build/presage-processor" \
        --name "presage-processor" \
        -- /opt/cupid/data/segments
    pm2 save
    echo "presage-processor started via PM2"
else
    echo "PM2 not found. Start manually:"
    echo "  $PROCESSOR_DIR/build/presage-processor /opt/cupid/data/segments"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Processor binary: $PROCESSOR_DIR/build/presage-processor"
echo "Frames dir:       /opt/cupid/data/frames/"
echo "Segments dir:     /opt/cupid/data/segments/"
echo ""
echo "The processor watches /opt/cupid/data/segments/ for .mp4 files"
echo "and outputs JSON metrics to stdout (captured by PM2 logs)."
