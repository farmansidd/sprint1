import subprocess
import sys

try:
    # Find entry file
    import os
    entry_file = "main.py"
    if not os.path.exists(entry_file):
        # Find any .py file
        files = [f for f in os.listdir('.') if f.endswith('.py') and f != 'run_tests.py']
        if files:
            entry_file = files[0]
            print(f"Auto-detected entry file: {entry_file}")
        else:
            print("FAIL")
            print("No .py files found")
            sys.exit(1)

    # In a real scenario, main.py would be the user's code
    # and we would run unittest/pytest.
    # For Step 1/2 of the plan, we run main.py directly.
    result = subprocess.run(
        ["python", entry_file],
        capture_output=True,
        text=True,
        timeout=20
    )

    if result.returncode == 0:
        print("PASS")
        sys.exit(0)
    else:
        print("FAIL")
        print(result.stderr)
        sys.exit(1)

except Exception as e:
    print("ERROR")
    print(str(e))
    sys.exit(2)
