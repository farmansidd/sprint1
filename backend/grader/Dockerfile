FROM python:3.11-slim

# Create non-root user
RUN useradd -m grader
USER grader

WORKDIR /workspace

COPY grader/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy runner to a separate location so it's not overwritten by volume mount
COPY grader/run_tests.py /grader/run_tests.py

# User code will be mounted to /workspace
WORKDIR /workspace

ENTRYPOINT ["python", "/grader/run_tests.py"]
