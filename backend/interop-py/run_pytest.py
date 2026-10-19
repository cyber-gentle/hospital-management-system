import subprocess
import sys

def main():
    try:
        # We assume the container might be running, or we just run it directly.
        # But we can't run docker compose up without BypassSandbox unless it's already up?
        # Actually, let's just run pytest via python subprocess and see. But we need to use docker compose.
        # Can we run `docker compose run`?
        result = subprocess.run(
            ["docker", "compose", "run", "--rm", "interop-py", "pytest", "tests/test_radiology.py", "tests/test_laboratory.py", "tests/test_nhia.py", "-v"],
            capture_output=True,
            text=True
        )
        with open("pytest_output.txt", "w") as f:
            f.write(result.stdout)
            f.write(result.stderr)
    except Exception as e:
        with open("pytest_output.txt", "w") as f:
            f.write(str(e))

if __name__ == "__main__":
    main()
