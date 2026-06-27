# Claude Code Starter Kit

This starter kit contains practical templates for starting a new software project with Claude Code.

## Suggested file locations

```text
CLAUDE.md
docs/
  PRD.md
  ARCHITECTURE.md
  PROGRESS.md
  DECISIONS.md
.claude/
  settings.example.json
  hooks/
    README.md
  skills/
    code-review/SKILL.md
    refactor/SKILL.md
    test-generation/SKILL.md
    architecture-review/SKILL.md
    bug-investigation/SKILL.md
    feature-implementation/SKILL.md
    security-review/SKILL.md
  agents/
    architect.md
    backend-reviewer.md
    frontend-reviewer.md
    test-engineer.md
    security-reviewer.md
    database-reviewer.md
prompts/
  01-start-new-project.md
  02-create-prd.md
  03-plan-architecture.md
  04-open-feature.md
  05-check-existing-code.md
  06-deep-refactor.md
  07-write-tests.md
  08-debugging.md
  09-security-review.md
  10-prepare-pr.md
  11-close-session.md
  12-continue-from-previous-day.md
```

## How to use

1. Copy the files into the root of your project.
2. Fill placeholders such as `<PROJECT_NAME>`.
3. Keep `CLAUDE.md` short.
4. Move long recurring procedures into `.claude/skills`.
5. Keep sensitive file deny rules in `.claude/settings.json`.
6. Update `docs/PROGRESS.md` after meaningful sessions.
