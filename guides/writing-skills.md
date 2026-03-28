# How to Write Skills

> The definitive guide to writing Canopy skills. A skill is a reusable command
> that any agent can execute in any workspace. Write it once, use it everywhere.

---

## The Rules

1. **Write directives, not wisdom.** Tell the agent what to DO, not why. The agent
   doesn't need a philosophy lecture. It needs steps.

2. **Cut general knowledge.** Only include what the agent wouldn't already know.
   Don't explain what a REST API is. Don't define JSON. The agent knows.

3. **Scope to the build task.** Every sentence should help the agent do its job.
   If a sentence doesn't change what the agent does, delete it.

4. **Start with good defaults.** The simplest correct approach first. Progressive
   complexity only when the user asks for it.

5. **Be concrete.** Show what good looks like. Examples > explanations.

6. **Convert warnings into directives or anti-patterns.** One line each.
   Not: "Be careful about X because Y and Z."
   Instead: "NEVER do X. Use Y instead."

7. **Under 500 lines.** If your skill is longer, split reference material into
   separate files that load on-demand (progressive disclosure pattern).

---

## Skill File Format

Every skill lives in `library/skills/{category}/{skill-name}/SKILL.md`:

```yaml
---
name: skill-name
description: One-line description. Include trigger keywords at the end. Triggered by keyword1, keyword2, keyword3.
---

# /skill-name — Short Title

## Purpose

One paragraph. What this skill does and when to use it.

## Usage

\```
/skill-name <required-arg> [--optional-flag <value>]
\```

## Arguments

| Arg | Required | Default | Description |
|-----|----------|---------|-------------|
| `required-arg` | Yes | — | What it is |
| `--optional-flag` | No | `default` | What it controls |

## Workflow

1. **Step name** — What the agent does. Be specific.
2. **Step name** — Next action. Include decision points.
3. **Step name** — Output step. What gets written where.

## Examples

\```bash
# Basic usage
/skill-name "input"

# With options
/skill-name "input" --flag value
\```

## Output

What the skill produces. File paths, formats, what the user sees.

## Dependencies

What this skill needs to work. Other skills, engine features, external tools.
```

---

## The Frontmatter

The `description` field is critical — it's used for routing. Include trigger keywords:

```yaml
# Good — agent knows when to invoke this
description: Audit an LLM evaluation pipeline for quality issues. Triggered by eval, audit, evaluation, pipeline quality, LLM testing.

# Bad — too vague, no triggers
description: Helps with evaluations.
```

Include exclusion conditions when helpful:

```yaml
description: Generate synthetic test data for LLM evaluations. Use when building eval datasets. Do NOT use for production data generation. Triggered by synthetic, test data, eval data.
```

---

## Progressive Disclosure

Keep the SKILL.md under 500 lines. If you need more:

```
skills/
└── my-skill/
    ├── SKILL.md              ← Always loaded (~200 lines)
    ├── references/
    │   ├── methodology.md    ← Loaded in Phase 2
    │   ├── templates.md      ← Loaded in Phase 3
    │   └── examples.md       ← Loaded on request
    └── scripts/
        └── helper.py         ← Called by skill steps
```

In the SKILL.md, reference supporting files:

```markdown
## Workflow

1. **Discover** — Analyze the input.
2. **Style** — Load `references/methodology.md` and apply the framework.
3. **Generate** — Use `references/templates.md` as the skeleton.
```

The agent loads `SKILL.md` first (~2K tokens). Supporting files load only when the
workflow reaches that phase. This is how you keep context costs low while having
deep reference material available.

---

## Skill Composition

Skills can reference other skills as next steps:

```markdown
## Next Steps

After running this skill, consider:
- `/error-analysis` if failures were found
- `/synthetic-data` if the test set is too small
- `/validate-evaluator` if judge accuracy is unclear
```

This creates a directed graph of skills — the agent navigates between them based
on the situation. Don't hardcode dependencies. Suggest, don't require.

---

## Anti-Patterns

| Don't | Do |
|-------|-----|
| Long explanations of why | Short directives of what |
| "You might want to consider..." | "Do X." |
| Repeating what the agent knows | Only domain-specific knowledge |
| One massive SKILL.md | Progressive disclosure with references |
| Generic output | Specific output format with example |
| Vague workflow steps | Numbered steps with decision points |
| No examples | 2-3 realistic examples |
| No output description | Exact file paths and formats |

---

## Testing Your Skill

Before publishing:

1. **Read it cold.** If you were an agent seeing this for the first time, could
   you execute every step without ambiguity?
2. **Check the triggers.** Does the description include enough keywords to route correctly?
3. **Verify outputs.** Does the skill say exactly where it writes and in what format?
4. **Test composability.** Does it reference related skills for next steps?
5. **Count lines.** Under 500? If not, split.

---

## Category Reference

| Category | Skills For |
|----------|-----------|
| `development/` | Code generation, review, testing, debugging, CI/CD |
| `content/` | Writing, presentations, social media, documentation |
| `search/` | Information retrieval, web research, codebase search |
| `knowledge/` | Knowledge management, note-taking, second brain |
| `operations/` | System admin, monitoring, deployment |
| `strategy/` | Planning, analysis, decision-making |
| `agent/` | Agent management, spawning, coordination |
| `workflow/` | Multi-step process automation |
| `learning/` | Memory, observation, pattern capture |
| `security/` | Auditing, scanning, hardening |
| `ai-patterns/` | LLM evaluation, prompt engineering, synthetic data |
| `processing/` | Data pipeline, ETL, transformation |
| `coordination/` | Multi-agent communication, task management |
| `governance/` | Budget, approval, hiring, compliance |
| `analysis/` | Diagnostics, metrics, reporting |
| `workspace/` | Workspace management, import/export, composition |
