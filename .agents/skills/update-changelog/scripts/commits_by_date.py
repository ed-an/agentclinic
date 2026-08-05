#!/usr/bin/env python3
"""Print non-merge Git commit subjects grouped by author date."""

from __future__ import annotations

import subprocess


def main() -> None:
    result = subprocess.run(
        [
            "git",
            "log",
            "--no-merges",
            "--date=short",
            "--pretty=format:%ad%x09%s",
        ],
        check=True,
        capture_output=True,
        text=True,
    )

    current_date: str | None = None
    for line in result.stdout.splitlines():
        commit_date, subject = line.split("\t", 1)
        if commit_date != current_date:
            if current_date is not None:
                print()
            print(f"## {commit_date}")
            current_date = commit_date
        print(f"- {subject}")


if __name__ == "__main__":
    main()
