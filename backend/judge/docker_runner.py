
import subprocess
import os
import tempfile
import shutil

def run_judge(submission_id: str, code: str, execution_profile: str = 'python_basic', filename: str = 'main.py') -> dict:
    """
    Executes user code inside Docker based on execution profile.
    Returns:
      {
        "status": "PASSED" | "FAILED" | "ERROR",
        "stderr": "...",
        "stdout": "..."
      }
    """
    
    
    if execution_profile == 'conceptual':
        return {
            "status": "PASSED",
            "stderr": "",
            "stdout": "Conceptual Task - Execution Skipped (Correctness assumed or verified by Coach)"
        }

    # Create a temporary directory for this submission
    # using a known base path to avoid permission issues if possible, 
    # but tempfile.mkdtemp is usually fine.
    
    # NOTE: In Windows Docker Desktop, volume mounting a temp folder can be tricky 
    # if it's not in a shared drive. For now we assume standard temp is accessible 
    # or we use a relative path in the project.
    
    # Let's use a local temp dir inside current workspace to be safe with volume mounting
    # as described in conversation "d:/CareerForge.ai-main/backend/temp_submissions"
    
    base_temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "temp_submissions"))
    os.makedirs(base_temp_dir, exist_ok=True)
    
    submission_dir = os.path.join(base_temp_dir, str(submission_id))
    os.makedirs(submission_dir, exist_ok=True)
    
    try:
        # Write user code to file
        file_path = os.path.join(submission_dir, filename)
        with open(file_path, "w") as f:
            f.write(code)
            
        # Run Docker container
        # docker run --rm -v {submission_dir}:/workspace careerforge-judge-python
        
        # NOTE: On Windows, paths might need converting, but python's os.path.abspath should help.
        # Docker for Windows handles C:\ paths usually.
        
        # Fix path for Windows Docker
        # Convert D:\path\to\dir -> /d/path/to/dir OR just ensure it is cleaned
        # Actually, let's try just standard path first but normalized.
        
        # NOTE: Docker for Windows usually accepts D:\path
        # BUT if we are in a weird shell environment it might be failing.
        
        # Let's try replacing backslashes with forward slashes which is safer
        host_path = submission_dir.replace("\\", "/")
        
        # Check if Docker is available
        try:
             subprocess.run(["docker", "info"], check=True, capture_output=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
             docker_error = (
                "System Error: Docker is not running or not installed.\n\n"
                "The judge system requires Docker to safely execute your code in an isolated container.\n\n"
                "To fix this:\n"
                "  1. If Docker Desktop is installed, make sure it's running\n"
                "  2. If Docker is not installed, download it from: https://www.docker.com/products/docker-desktop\n"
                "  3. Install Docker Desktop and start it\n"
                "  4. Wait for Docker to fully start (check the system tray)\n"
                "  5. Resubmit your code\n\n"
                "To verify Docker is running, open a terminal and type: docker info"
            )
             return {
                "status": "ERROR",
                "stderr": docker_error,
                "stdout": ""
            }

        # Check if image exists
        try:
             subprocess.run(["docker", "image", "inspect", "careerforge-judge-python"], check=True, capture_output=True)
        except subprocess.CalledProcessError:
             setup_instructions = (
                "System Error: Judge Docker image 'careerforge-judge-python' not found.\n\n"
                "The judge needs to run your code in a Docker container, but the required image is missing.\n\n"
                "To fix this, run the setup script from the backend directory:\n\n"
                "  Windows:  backend\\setup_judge.bat\n"
                "  Mac/Linux: bash backend/setup_judge.sh\n\n"
                "This will build the Docker images needed to execute your code.\n\n"
                "If you don't have Docker installed:\n"
                "  1. Download Docker Desktop from https://www.docker.com/products/docker-desktop\n"
                "  2. Install and start Docker\n"
                "  3. Run the setup script\n\n"
                "If the setup fails, check:\n"
                "  - Docker is running: docker info\n"
                "  - Docker has enough disk space (at least 2GB)\n"
                "  - You have permission to build images"
            )
             return {
                "status": "ERROR",
                "stderr": setup_instructions,
                "stdout": ""
            }

        image_name = "careerforge-judge-python"
        if execution_profile == 'node_basic':
            image_name = "careerforge-judge-node"
        
        command = [
            "docker", "run", "--rm",
            "-v", f"{host_path}:/workspace",
            image_name
        ]
        print(f"DEBUG: Host Path: {host_path}")
        print(f"DEBUG: Running command: {command}")
        
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=30 # Safety timeout
        )
        
        stdout = result.stdout.strip()
        stderr = result.stderr.strip()
        
        # Parse output from the container's ENTRYPOINT (run_tests.py)
        # run_tests.py prints PASS or FAIL handling exit codes.
        
        # If run_tests.py exited with 0 => PASS
        # If run_tests.py exited with 1 => FAIL
        # If run_tests.py exited with 2 => ERROR (Infra/execution error)
        
        # However, subprocess.run returns the exit code of 'docker run'.
        # If the container crashes, it might be non-zero.
        # run_tests.py inside the container intentionally exits with 0, 1, or 2.
        
        if "PASS" in stdout:
             return {
                "status": "PASSED",
                "stderr": stderr,
                "stdout": stdout
            }
        elif "FAIL" in stdout:
             return {
                "status": "FAILED",
                "stderr": stdout.replace("FAIL\n", "") + "\n" + stderr,
                "stdout": stdout
            }
        else:
             return {
                "status": "ERROR",
                "stderr": f"Unexpected output or runtime error: {stderr} | {stdout}",
                "stdout": stdout
            }

    except subprocess.TimeoutExpired:
        return {
            "status": "ERROR",
            "stderr": "Execution timed out.",
            "stdout": ""
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "stderr": str(e),
            "stdout": ""
        }
    finally:
        # Cleanup
        try:
            shutil.rmtree(submission_dir)
        except:
            pass
