# `.agents/` — shared agent context

Single source of truth for **OpenCode**, **OpenAI Codex**, and **Google Antigravity**.

| Path | Purpose | OpenCode | Codex | Antigravity |
|------|---------|----------|-------|-------------|
| `../AGENTS.md` | Root entry: commands, map, non-negotiables | auto | auto | auto |
| `rules/*.md` | Deep rules, load on demand (or all via `opencode.json`) | `instructions` glob | via `AGENTS.md` pointers | native `.agents/rules` |
| `skills/*/SKILL.md` | Reusable workflows (Agent Skills standard) | native `.agents/skills` | follow when described | native `.agents/skills` |
| `agents/*.md` | Subagent definitions | mirrored in `../.opencode/agents/` | — | native `.agents/agents` |

Tool config outside this folder:

- `../opencode.json` — OpenCode instructions + permissions
- `../.opencode/agents/` — OpenCode markdown agents
- `../.codex/config.toml` — Codex project sandbox/approvals

## Editing guidelines

- Keep `../AGENTS.md` short; put detail in `rules/`.
- Skill folder name must equal `name` in frontmatter (`^[a-z0-9]+(-[a-z0-9]+)*$`).
- Antigravity rule files ≤ 12,000 characters each.
- Never put secrets in these files.
