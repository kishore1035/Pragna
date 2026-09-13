import sys
import subprocess
import tempfile
from pathlib import Path
from typing import Any


def execute_python_code(code: str, timeout_seconds: int = 10) -> dict[str, Any]:
    """Execute Python code in a isolated subprocess and return stdout, stderr, and execution status."""
    if not code.strip():
        return {"success": False, "error": "No Python code provided."}

    # Write code to a temporary python file
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as temp_file:
        temp_file.write(code)
        temp_path = Path(temp_file.name)

    try:
        process = subprocess.run(
            [sys.executable, str(temp_path)],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )

        stdout = process.stdout.strip()
        stderr = process.stderr.strip()
        return {
            "success": process.returncode == 0,
            "returncode": process.returncode,
            "stdout": stdout or "(no output)",
            "stderr": stderr or None,
            "summary": f"Executed code (exit code {process.returncode}). Output: {stdout[:200] if stdout else 'Success'}",
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": f"Execution timed out after {timeout_seconds} seconds.",
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }
    finally:
        try:
            temp_path.unlink(missing_ok=True)
        except Exception:
            pass
