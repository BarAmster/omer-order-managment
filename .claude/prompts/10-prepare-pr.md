# Prompt: Prepare PR

```text
Prepare this branch for a pull request.

Steps:
1. Review git diff and git status.
2. Summarize what changed.
3. Check whether changes match the original requirement.
4. Identify unrelated changes.
5. Run lint, typecheck, tests, and build if available.
6. Update docs/PROGRESS.md.
7. Draft a PR description with summary, validation, risks, and screenshots/logs if relevant.

Do not commit or push unless explicitly asked.
```

# Prepare for source control 

Prepare this work for source control.

Read:

* CLAUDE.md
* docs/PROGRESS.md.

Tasks:

1. Inspect git status.

2. Inspect git diff.

3. Categorize the changes:

   * infrastructure
   * architecture
   * reusable components
   * Orders screen
   * bug fixes
   * refactoring

4. Verify project readiness:

   * lint
   * typecheck
   * build

5. Update docs/PROGRESS.md with:

   * completed work
   * files changed
   * validation results
   * decisions made
   * next steps

6. Propose:

   * branch name
   * commit message
   * PR title
   * PR description

7. Show:

   * git status
   * files to be committed
   * files that should NOT be committed
   * validation summary

Important:

* Do not commit yet.
* Do not push yet.
* Wait for approval.

Return:

* recommended branch name
* recommended commit message
* recommended PR description
* readiness assessment
* any issues that should be fixed before committing
