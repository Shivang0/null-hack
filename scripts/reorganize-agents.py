#!/usr/bin/env python3
"""Reorganize agent files from category-based folders to hierarchy-based folders.

Old: library/agents/{category}/{agent-id}.md
New: library/agents/{division}/{department}/{team}/{agent-id}.md

Reads YAML frontmatter from each agent file to determine division/department/team.
If any of those fields are null, the file stays in place.
"""

import argparse
import os
import re
import shutil
import sys
import yaml
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
AGENTS_DIR = BASE_DIR / "library" / "agents"


def parse_frontmatter(filepath: Path) -> dict | None:
    """Extract YAML frontmatter from a markdown file."""
    text = filepath.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?\n)---", text, re.DOTALL)
    if not match:
        return None
    try:
        return yaml.safe_load(match.group(1))
    except yaml.YAMLError as e:
        print(f"  WARN: Failed to parse YAML in {filepath}: {e}", file=sys.stderr)
        return None


def find_agent_files(agents_dir: Path) -> list[Path]:
    """Recursively find all .md files under agents_dir."""
    return sorted(agents_dir.rglob("*.md"))


def compute_target(filepath: Path, agents_dir: Path, frontmatter: dict) -> Path | None:
    """Compute target path based on frontmatter. Returns None if file should stay."""
    division = frontmatter.get("division")
    department = frontmatter.get("department")
    team = frontmatter.get("team")

    if not division or not department or not team:
        return None  # Keep in place

    target = agents_dir / division / department / team / filepath.name
    return target


def remove_empty_dirs(root: Path, verbose: bool = False):
    """Remove empty directories recursively under root."""
    for dirpath, dirnames, filenames in os.walk(str(root), topdown=False):
        dirpath = Path(dirpath)
        if dirpath == root:
            continue
        if not any(dirpath.iterdir()):
            if verbose:
                print(f"  RMDIR {dirpath.relative_to(root.parent.parent.parent)}")
            dirpath.rmdir()


def main():
    parser = argparse.ArgumentParser(description="Reorganize agent files to hierarchy-based folders")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    args = parser.parse_args()

    if not AGENTS_DIR.is_dir():
        print(f"ERROR: Agents directory not found: {AGENTS_DIR}", file=sys.stderr)
        sys.exit(1)

    files = find_agent_files(AGENTS_DIR)
    print(f"Found {len(files)} agent files")

    moved = 0
    skipped = 0
    errors = 0

    for filepath in files:
        fm = parse_frontmatter(filepath)
        if fm is None:
            if args.verbose:
                print(f"  SKIP (no frontmatter): {filepath.relative_to(AGENTS_DIR)}")
            skipped += 1
            continue

        target = compute_target(filepath, AGENTS_DIR, fm)
        if target is None:
            if args.verbose:
                print(f"  KEEP (null hierarchy): {filepath.relative_to(AGENTS_DIR)}")
            skipped += 1
            continue

        if target == filepath:
            if args.verbose:
                print(f"  SAME (already correct): {filepath.relative_to(AGENTS_DIR)}")
            skipped += 1
            continue

        rel_src = filepath.relative_to(AGENTS_DIR)
        rel_dst = target.relative_to(AGENTS_DIR)

        if args.dry_run:
            print(f"  MOVE {rel_src} -> {rel_dst}")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            try:
                shutil.move(str(filepath), str(target))
                if args.verbose:
                    print(f"  MOVE {rel_src} -> {rel_dst}")
            except Exception as e:
                print(f"  ERROR moving {rel_src}: {e}", file=sys.stderr)
                errors += 1
                continue

        moved += 1

    # Clean up empty directories
    if not args.dry_run:
        print("Removing empty directories...")
        remove_empty_dirs(AGENTS_DIR, verbose=args.verbose)

    action = "Would move" if args.dry_run else "Moved"
    print(f"\nDone: {action} {moved}, skipped {skipped}, errors {errors}")

    # Verify count
    if not args.dry_run:
        final_count = len(find_agent_files(AGENTS_DIR))
        print(f"Total .md files after reorganization: {final_count}")
        if final_count != 169:
            print(f"WARNING: Expected 169 files, found {final_count}", file=sys.stderr)


if __name__ == "__main__":
    main()
