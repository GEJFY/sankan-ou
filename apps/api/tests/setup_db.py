"""テスト用DBセットアップ — Alembicマイグレーション実行"""

import subprocess
import sys


def main():
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
    )
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)
    print("Database migration completed successfully.")


if __name__ == "__main__":
    main()
