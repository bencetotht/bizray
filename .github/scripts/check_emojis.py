#!/usr/bin/env python3
import os
import sys
import re

EMOJI_RE = re.compile(
    "["
    "\U0001f300-\U0001f5ff"  # symbols & pictographs
    "\U0001f600-\U0001f64f"  # emoticons
    "\U0001f680-\U0001f6ff"  # transport & map
    "\U0001f700-\U0001f77f"  # alchemical
    "\U0001f780-\U0001f7ff"  # geometric extended
    "\U0001f800-\U0001f8ff"  # supplemental arrows
    "\U0001f900-\U0001f9ff"  # supplemental symbols & pictographs
    "\U0001fa00-\U0001fa6f"  # chess, etc.
    "\U0001fa70-\U0001faff"  # symbols
    "\u2702-\u27b0"  # dingbats
    "\u24c2-\U0001f251"  # enclosed characters
    "]+"
)

IGNORE_DIRS = {
    ".git",
    ".github",
    ".vscode",
    ".venv",
    "__pycache__",
    "node_modules",
    "docs",
    "dist",
    "build",
}

SKIP_EXTENSIONS = (
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".pdf",
    ".svg",
)

ALLOW_EXTENSIONS = ()


def has_emoji(text: str) -> bool:
    return bool(EMOJI_RE.search(text))

def main() -> int:
    offending = []

    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for fname in files:
            path = os.path.join(root, fname)
            print(f"Checking {path}")

            if path.endswith(SKIP_EXTENSIONS):
                continue

            if ALLOW_EXTENSIONS and any(path.endswith(ext) for ext in ALLOW_EXTENSIONS):
                continue

            try:
                with open(path, "r", encoding="utf-8") as f:
                    for i, line in enumerate(f, start=1):
                        if has_emoji(line):
                            offending.append((path, i, line.rstrip("\n")))
            except UnicodeDecodeError:
                # non-text file, skip
                continue

    if offending:
        print("ERROR: no emojis bruh.\n")
        for path, line_no, line in offending:
            print(f"{path}:{line_no}: {line}")
        print("\nRemove them pls.")
        return 1

    print("OK: no emojis found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())