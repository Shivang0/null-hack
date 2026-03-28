#!/usr/bin/env python3
"""
Bulk-update Canopy library agents with Signal Theory awareness.

Three schema variants detected:
  standard: # Identity & Memory / # Communication Style (h1, no emoji)
  emoji:    ## 🧠 Your Identity & Memory / ## 💬 Your Communication Style (h2, emoji)
  alternate: ## Role Definition / ## Core Capabilities (no Identity & Memory)
"""

import os
import re
import sys
import yaml
from pathlib import Path

AGENTS_DIR = Path("/Users/rhl/Desktop/MIOSA/code/canopy/library/agents")

# ── Tool → Transcoding Mapping ──────────────────────────────────────────────

TOOL_TRANSCODINGS = {
    "read": "file → linguistic (reads documents, code, configs into processable text)",
    "write": "linguistic → persistent artifact (encodes output as stored files)",
    "edit": "linguistic → persistent artifact (modifies existing stored signals)",
    "bash": "intent → system action (executes commands, runs builds, queries APIs)",
    "search": "query → information (retrieves relevant signals from codebase)",
    "web-search": "query → external information (scans signals beyond the workspace)",
    "web-fetch": "URL → linguistic (retrieves and converts web content)",
    "webfetch": "URL → linguistic (retrieves and converts web content)",
    "websearch": "query → external information (scans signals beyond the workspace)",
    "grep": "pattern → matched signals (filters content by pattern matching)",
}

# ── Category → Receive Pattern Mapping ──────────────────────────────────────

CATEGORY_RECEIVES = {
    "engineering": "code signals (source code, diffs, PRs, architecture docs), technical specs, bug reports",
    "sales": "prospect data, deal signals (CRM updates, meeting notes), market intelligence, revenue targets",
    "marketing": "brand signals (campaigns, analytics, audience data), content briefs, performance metrics",
    "product": "user signals (feedback, analytics, behavior data), feature requests, market research, roadmap inputs",
    "design": "visual signals (mockups, brand assets, style guides), design briefs, user research, accessibility reports",
    "testing": "code signals (source, diffs), test results, bug reports, coverage metrics, quality gates",
    "project-management": "status signals (progress reports, blockers), timeline data, resource allocation, stakeholder requests",
    "support": "user signals (tickets, complaints, feedback), product docs, escalation triggers, resolution patterns",
    "paid-media": "campaign data (ad metrics, spend, ROAS), audience signals, creative assets, platform analytics",
    "academic": "research signals (papers, datasets, citations), methodology specs, peer review feedback",
    "game-development": "game design signals (GDDs, prototypes, playtests), art assets, technical constraints, player feedback",
    "spatial-computing": "spatial signals (3D assets, scene graphs, interaction data), platform specs, user testing data",
    "specialized": "domain-specific signals varying by specialization — see role definition for specific input types",
}

# ── Signal Field Parsing ────────────────────────────────────────────────────

def parse_signal(signal_str):
    match = re.search(r'S=\(([^)]+)\)', signal_str or "")
    if not match:
        return None
    parts = [p.strip() for p in match.group(1).split(",")]
    if len(parts) != 5:
        return None
    return {"mode": parts[0], "genre": parts[1], "type": parts[2], "format": parts[3], "structure": parts[4]}


def describe_transmit(sig):
    if not sig:
        return "linguistic signals in markdown format"
    mode_desc = {"linguistic": "text-based", "code": "code-based", "data": "data-structured", "visual": "visual", "mixed": "multimodal"}
    type_desc = {"inform": "informational", "direct": "directive (action-compelling)", "commit": "commitment (delivery promises)", "decide": "decision-oriented", "express": "perspective-sharing"}
    m = mode_desc.get(sig["mode"], sig["mode"])
    t = type_desc.get(sig["type"], sig["type"])
    return f"{m} {sig['genre']} signals ({t}) in {sig['format']} format using {sig['structure']} structure"


def generate_transcodings(tools):
    if not tools:
        return ["No external transcoders — processes signals natively"]
    transcodings = []
    seen = set()
    for tool in tools:
        key = str(tool).strip().lower()
        if key in seen:
            continue
        seen.add(key)
        if key in TOOL_TRANSCODINGS:
            transcodings.append(f"`{key}`: {TOOL_TRANSCODINGS[key]}")
    return transcodings or ["Domain-specific tool transcoders — see tools field"]


def generate_snf(name, role, sig, category):
    receives = CATEGORY_RECEIVES.get(category, "domain-specific signals")
    if not sig:
        return f"Receives {receives} and transmits processed outputs. Functions as a signal processing node in the {category} subnet."
    transmits = describe_transmit(sig)
    return f"Receives {receives} and transmits {transmits}. Primary transcoding: domain input → {sig['genre']} output."


# ── Schema Detection ────────────────────────────────────────────────────────

def detect_schema(body):
    """Detect schema: standard (h1 no emoji), emoji (h2 with emoji), alternate (Role Definition)."""
    # Check for standard first (# Identity & Memory without emoji)
    if re.search(r'^# Identity & Memory\s*$', body, re.MULTILINE):
        return "standard"
    # Check for emoji/variant (## with optional emoji + "Identity & Memory" or "Your Identity & Memory")
    if re.search(r'^#{1,2}\s+[^\n]*Identity & Memory', body, re.MULTILINE):
        return "emoji"
    # Check for alternate (## Role Definition)
    if re.search(r'^#{1,2}\s+Role Definition', body, re.MULTILINE):
        return "alternate"
    return "unknown"


def already_updated(body):
    return "Signal Network Function" in body or "## Signal Network" in body or "### Signal Network" in body


# ── Find section boundaries ─────────────────────────────────────────────────

def find_section_end(body, header_pattern, next_header_patterns):
    """Find text of a section (header line through end before next section)."""
    m = re.search(header_pattern, body, re.MULTILINE)
    if not m:
        return None, None, None

    start = m.start()
    # Find next section header
    remaining = body[m.end():]
    earliest = len(remaining)
    for pat in next_header_patterns:
        nm = re.search(pat, remaining, re.MULTILINE)
        if nm and nm.start() < earliest:
            earliest = nm.start()

    section_text = body[start:m.end() + earliest]
    return start, m.end() + earliest, section_text


# ── Update Functions ────────────────────────────────────────────────────────

def update_agent(body, fm, category, schema):
    sig = parse_signal(fm.get("signal", ""))
    name = fm.get("name", "Agent")
    role = fm.get("role", "")
    tools = fm.get("tools", [])

    snf = generate_snf(name, role, sig, category)
    transcodings = generate_transcodings(tools)
    transmit_desc = describe_transmit(sig)
    receives = CATEGORY_RECEIVES.get(category, "domain-specific signals")
    trans_lines = "\n".join(f"  - {t}" for t in transcodings)

    if schema == "standard":
        # Add SNF to # Identity & Memory (before # Core Mission)
        body = add_snf_to_section(
            body,
            header_re=r'^# Identity & Memory\s*$',
            next_re=[r'^# Core Mission', r'^# Critical Rules'],
            snf_line=f"- **Signal Network Function**: {snf}",
            bullet_prefix="- "
        )
        # Add Signal Network to # Communication Style (before # Success Metrics or # Skills)
        body = add_signal_network_section(
            body,
            header_re=r'^# Communication Style',
            next_re=[r'^# Success Metrics', r'^# Skills'],
            level="###",
            receives=receives, transmit_desc=transmit_desc, trans_lines=trans_lines
        )

    elif schema == "emoji":
        # Add SNF to identity section (## 🧠 Your Identity & Memory or variants)
        body = add_snf_to_section(
            body,
            header_re=r'^#{1,2}\s+[^\n]*Identity & Memory',
            next_re=[r'^#{1,2}\s+[^\n]*(?:Core Mission|Communication Style|Critical Rules|Development Philosophy|Signal-Based)'],
            snf_line=f"- **Signal Network Function**: {snf}",
            bullet_prefix="- "
        )
        # Add Signal Network section — find communication style or add before Skills/last section
        comm_match = re.search(r'^#{1,2}\s+[^\n]*Communication Style', body, re.MULTILINE)
        if comm_match:
            body = add_signal_network_section(
                body,
                header_re=r'^#{1,2}\s+[^\n]*Communication Style',
                next_re=[r'^#{1,2}\s+[^\n]*(?:Success Metrics|Skills|Tools)', r'^# Skills'],
                level="###",
                receives=receives, transmit_desc=transmit_desc, trans_lines=trans_lines
            )
        else:
            # Add as standalone section before # Skills at end
            body = add_signal_network_standalone(
                body, level="##",
                receives=receives, transmit_desc=transmit_desc, trans_lines=trans_lines
            )

    elif schema == "alternate":
        # Add SNF to ## Role Definition
        body = add_snf_to_section(
            body,
            header_re=r'^#{1,2}\s+Role Definition',
            next_re=[r'^#{1,2}\s+(?:Core Capabilities|Specialized Skills|Decision Framework|Tooling)'],
            snf_line=f"**Signal Network Function**: {snf}",
            bullet_prefix=""
        )
        # Add Signal Network as standalone section before # Skills
        body = add_signal_network_standalone(
            body, level="##",
            receives=receives, transmit_desc=transmit_desc, trans_lines=trans_lines
        )

    return body


def add_snf_to_section(body, header_re, next_re, snf_line, bullet_prefix):
    """Add Signal Network Function line at end of a section."""
    m = re.search(header_re, body, re.MULTILINE)
    if not m:
        return body

    # Find where next section starts
    remaining = body[m.end():]
    earliest = len(remaining)
    for pat in next_re:
        nm = re.search(pat, remaining, re.MULTILINE)
        if nm and nm.start() < earliest:
            earliest = nm.start()

    section_end = m.end() + earliest
    section_text = body[m.end():section_end].rstrip()

    # Insert SNF at end of section
    new_section = section_text + "\n" + snf_line + "\n"
    body = body[:m.end()] + new_section + body[section_end:]
    return body


def add_signal_network_section(body, header_re, next_re, level, receives, transmit_desc, trans_lines):
    """Add Signal Network subsection inside an existing section."""
    m = re.search(header_re, body, re.MULTILINE)
    if not m:
        return body

    remaining = body[m.end():]
    earliest = len(remaining)
    for pat in next_re:
        nm = re.search(pat, remaining, re.MULTILINE)
        if nm and nm.start() < earliest:
            earliest = nm.start()

    section_end = m.end() + earliest
    section_text = body[m.end():section_end].rstrip()

    sn_block = f"""

{level} Signal Network
- **Receives**: {receives}
- **Transmits**: {transmit_desc}
- **Transcoding** (tools as signal converters):
{trans_lines}
"""
    body = body[:m.end()] + section_text + sn_block + "\n" + body[section_end:]
    return body


def add_signal_network_standalone(body, level, receives, transmit_desc, trans_lines):
    """Add Signal Network as standalone section before # Skills at end."""
    sn_section = f"""
{level} Signal Network

- **Receives**: {receives}
- **Transmits**: {transmit_desc}
- **Transcoding** (tools as signal converters):
{trans_lines}

"""
    # Insert before # Skills or ## Skills at the end
    skills_match = None
    for pat in [r'\n# Skills\s*$', r'\n## Skills\s*$']:
        m = re.search(pat, body, re.MULTILINE)
        if m:
            if skills_match is None or m.start() > skills_match.start():
                skills_match = m

    if skills_match:
        body = body[:skills_match.start()] + "\n" + sn_section + body[skills_match.start():]
    else:
        body = body.rstrip() + "\n" + sn_section

    return body


# ── Main ────────────────────────────────────────────────────────────────────

def process_agent(filepath, category, dry_run=False):
    content = filepath.read_text()
    if not content.startswith("---"):
        return "skip", "no frontmatter"

    end = content.find("---", 3)
    if end == -1:
        return "skip", "no frontmatter end"

    fm_str = content[3:end].strip()
    body = content[end + 3:].strip()

    try:
        fm = yaml.safe_load(fm_str)
    except yaml.YAMLError:
        return "skip", "yaml error"

    if not isinstance(fm, dict):
        return "skip", "bad frontmatter"

    if already_updated(body):
        return "skip", "already updated"

    schema = detect_schema(body)
    if schema == "unknown":
        return "skip", "unknown schema"

    new_body = update_agent(body, fm, category, schema)

    if new_body == body:
        return "skip", "no changes"

    if not dry_run:
        fm_block = content[:end + 3]
        filepath.write_text(fm_block + "\n\n" + new_body.strip() + "\n")

    return "updated", schema


def main():
    dry_run = "--dry-run" in sys.argv
    verbose = "--verbose" in sys.argv or "-v" in sys.argv

    if dry_run:
        print("=== DRY RUN ===\n")

    stats = {"updated": 0, "skipped": 0, "errors": 0}
    categories = {}

    for agent_file in sorted(AGENTS_DIR.rglob("*.md")):
        # Derive category from the division (top-level dir under agents/)
        relative = agent_file.relative_to(AGENTS_DIR)
        category = relative.parts[0] if len(relative.parts) > 1 else "uncategorized"

        try:
            status, detail = process_agent(agent_file, category, dry_run)
            if status == "updated":
                stats["updated"] += 1
                categories[category] = categories.get(category, 0) + 1
                if verbose:
                    print(f"  + {relative} ({detail})")
            else:
                stats["skipped"] += 1
                if verbose:
                    print(f"  . {relative} ({detail})")
        except Exception as e:
            stats["errors"] += 1
            print(f"  X {relative}: {e}")

    print(f"\n{'DRY RUN ' if dry_run else ''}Results:")
    print(f"  Updated: {stats['updated']}")
    print(f"  Skipped: {stats['skipped']}")
    print(f"  Errors:  {stats['errors']}")

    if categories:
        print(f"\nBy category:")
        for cat, count in sorted(categories.items()):
            print(f"  {cat}: {count}")


if __name__ == "__main__":
    main()
