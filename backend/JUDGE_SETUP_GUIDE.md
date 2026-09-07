# CareerForge Judge Setup Guide

## Overview

The **CareerForge Judge** is a containerized code execution system that safely runs your submitted code in isolated Docker environments. When you submit code, it gets executed inside a Docker container, which provides:

- **Security**: Your code runs in a sandboxed environment isolated from the main system
- **Consistency**: Every submission runs in the same environment, ensuring fair evaluation
- **Reliability**: Docker containers are reproducible and prevent system interference

---

## Common Issues & Solutions

### Issue 1: "Judge Docker image not found"

**Error Message:**
```
System Error: Judge Docker image 'careerforge-judge-python' not found. 
Please run 'backend/setup_judge.bat'.
```

**What This Means:**
The system tried to create a container from the Docker image `careerforge-judge-python`, but the image doesn't exist on your machine yet. This is like trying to use a recipe when you haven't written it down.

**How to Fix:**

1. **Open a Command Prompt or PowerShell**
   - Windows: Press `Win + R`, type `cmd` or `powershell`, press Enter
   - Mac/Linux: Open Terminal

2. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

3. **Run the setup script:**
   - **Windows:**
     ```bash
     setup_judge.bat
     ```
   - **Mac/Linux:**
     ```bash
     bash setup_judge.sh
     ```

4. **Wait for it to complete** (this may take 2-5 minutes the first time)

5. **You should see:**
   ```
   [OK] Python judge image built successfully
   [OK] Node judge image built successfully
   SUCCESS!
   ```

---

### Issue 2: "Docker is not running"

**Error Message:**
```
System Error: Docker is not running or not installed.
```

**What This Means:**
Docker isn't currently running on your machine. The judge system depends on Docker to execute code safely.

**How to Fix:**

1. **Check if Docker Desktop is installed:**
   - Windows: Look for "Docker Desktop" in your Start Menu
   - Mac: Look in Applications for "Docker.app"
   - Linux: Check if docker is installed via terminal

2. **If Docker is NOT installed:**
   - Download Docker Desktop: https://www.docker.com/products/docker-desktop
   - Install it following the official instructions
   - Restart your computer

3. **If Docker IS installed but not running:**
   - **Windows**: Click the Docker Desktop application in the Start Menu
   - **Mac**: Click Docker.app in Applications
   - **Linux**: The Docker daemon should auto-start, or run `sudo systemctl start docker`
   - Wait for Docker to fully start (watch for the Docker icon in your system tray)

4. **Verify Docker is running:**
   ```bash
   docker info
   ```
   You should see information about your Docker installation.

5. **Then run the judge setup:**
   ```bash
   cd backend
   setup_judge.bat  # Windows
   bash setup_judge.sh  # Mac/Linux
   ```

---

### Issue 3: "Permission denied" during setup

**Error Message:**
```
ERROR: permission denied while trying to connect to Docker daemon
```

**What This Means:**
Your user account doesn't have permission to run Docker commands.

**How to Fix (Windows):**
- Make sure Docker Desktop is running with Administrator privileges
- Restart Docker Desktop

**How to Fix (Mac/Linux):**
```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply the group changes
newgrp docker

# Verify it works
docker ps
```

---

### Issue 4: "Disk space" or "Build failed"

**Error Message:**
```
ERROR: Failed to build Python judge image
```

**What This Means:**
Docker doesn't have enough disk space, or there's a network issue downloading the base images.

**How to Fix:**

1. **Free up disk space:**
   - The judge setup needs ~2GB free space
   - Delete unnecessary files or applications
   - Clear Docker's cache: `docker system prune`

2. **Check your internet connection:**
   - The setup script downloads base Docker images
   - Ensure you have a stable internet connection
   - If behind a proxy, configure Docker: https://docs.docker.com/desktop/networking/proxy/

3. **Retry the setup:**
   ```bash
   cd backend
   setup_judge.bat  # Windows
   bash setup_judge.sh  # Mac/Linux
   ```

---

## Step-by-Step Setup Instructions

### For Windows Users:

1. Download and install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Start Docker Desktop (it will take a moment to fully initialize)
3. Open PowerShell or Command Prompt
4. Navigate to your CareerForge project:
   ```
   cd path\to\CareerForge.ai\backend
   ```
5. Run:
   ```
   setup_judge.bat
   ```
6. Wait for the "SUCCESS!" message

### For Mac Users:

1. Download and install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Start Docker Desktop (from Applications > Docker.app)
3. Open Terminal
4. Navigate to your CareerForge project:
   ```
   cd path/to/CareerForge.ai/backend
   ```
5. Run:
   ```
   bash setup_judge.sh
   ```
6. Wait for the "SUCCESS!" message

### For Linux Users:

1. Install Docker:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install docker.io docker-compose
   
   # Fedora
   sudo dnf install docker docker-compose
   
   # Other distros: https://docs.docker.com/engine/install/
   ```

2. Start the Docker daemon:
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker  # Start on boot
   ```

3. Add your user to the docker group:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

4. Navigate to your CareerForge project:
   ```bash
   cd path/to/CareerForge.ai/backend
   ```

5. Run:
   ```bash
   bash setup_judge.sh
   ```

6. Wait for the "SUCCESS!" message

---

## Verifying the Setup

After running the setup script, verify that the images were created:

```bash
docker images | grep careerforge-judge
```

You should see output like:
```
careerforge-judge-python   latest   abc123def456   2 minutes ago   156MB
careerforge-judge-node     latest   xyz789uvw012   1 minute ago    342MB
```

---

## What the Setup Script Does

The setup script (`setup_judge.bat` or `setup_judge.sh`) performs these steps:

1. **Checks Docker is installed and running**
2. **Builds the Python judge image:**
   - Based on Python 3.11
   - Installs pytest for test execution
   - Creates a non-root user for security
3. **Builds the Node.js judge image:**
   - Based on Node.js 18
   - Includes JavaScript/Node test runners
4. **Verifies both images were created successfully**

---

## How the Judge Works (Technical Overview)

When you submit code:

1. Your code is saved to a temporary directory
2. Docker creates a container from one of the judge images
3. Your code is mounted into the container at `/workspace`
4. The test runner (`run_tests.py` or `run_tests.js`) executes your code
5. Test results are returned to the platform
6. The container is deleted (no trace of your code remains)

---

## Troubleshooting Commands

If you encounter issues, try these diagnostic commands:

```bash
# Check Docker version and status
docker --version
docker info

# List all Docker images
docker images

# List judge images only
docker images | grep careerforge-judge

# Test the Python judge image
docker run --rm careerforge-judge-python

# View Docker disk usage
docker system df

# Clean up unused Docker resources
docker system prune -a
```

---

## Still Having Issues?

If the setup continues to fail:

1. **Restart Docker Desktop:**
   - Windows/Mac: Close and reopen Docker Desktop
   - Linux: `sudo systemctl restart docker`

2. **Clear Docker cache:**
   ```bash
   docker system prune -a --volumes
   ```

3. **Manually build the images:**
   ```bash
   cd backend
   docker build -t careerforge-judge-python -f grader/Dockerfile .
   docker build -t careerforge-judge-node -f grader/Dockerfile.node .
   ```

4. **Check system resources:**
   - Make sure you have at least 2GB free disk space
   - Close other applications if Docker build seems slow
   - Ensure stable internet connection

---

## Security Notes

- The judge runs code in **isolated containers** with **no network access**
- Each submission runs in its own container that's automatically cleaned up
- No code is persisted or accessible after evaluation
- The judge runs as a non-root user to prevent system access

---

For more information about Docker, visit: https://docs.docker.com/

**Questions?** Reach out to the CareerForge support team!
