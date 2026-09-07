#!/bin/bash
# Setup script to build Docker judge images for CareerForge AI
# This builds the judge environments needed to run code submissions

echo ""
echo "========================================"
echo "CareerForge Judge Setup"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    echo "Please install Docker from: https://www.docker.com/get-started"
    echo ""
    exit 1
fi

echo "[OK] Docker is installed"
docker --version
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Build Python Judge Image
echo "Building Python Judge Image..."
echo "Command: docker build -t careerforge-judge-python -f grader/Dockerfile ."
echo ""

cd "$SCRIPT_DIR"
docker build -t careerforge-judge-python -f grader/Dockerfile .

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build Python judge image"
    echo ""
    exit 1
fi

echo "[OK] Python judge image built successfully"
echo ""

# Build Node Judge Image
echo "Building Node Judge Image..."
echo "Command: docker build -t careerforge-judge-node -f grader/Dockerfile.node ."
echo ""

docker build -t careerforge-judge-node -f grader/Dockerfile.node .

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build Node judge image"
    echo ""
    exit 1
fi

echo "[OK] Node judge image built successfully"
echo ""

# Verify images were created
echo "Verifying images..."
echo ""

docker images | grep careerforge-judge-python > /dev/null
if [ $? -ne 0 ]; then
    echo "ERROR: Python judge image not found after build"
    exit 1
fi

docker images | grep careerforge-judge-node > /dev/null
if [ $? -ne 0 ]; then
    echo "ERROR: Node judge image not found after build"
    exit 1
fi

echo ""
echo "========================================"
echo "SUCCESS!"
echo "========================================"
echo ""
echo "The following judge images are ready:"
docker images | grep careerforge-judge
echo ""
echo "You can now submit code and the judge will execute submissions in Docker containers."
echo ""
