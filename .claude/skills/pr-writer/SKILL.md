---
name: pr-writer
description: Generate a pull request title and structured body from the current branch's commits following repository convention, then open it with the gh CLI. Never merges.
---

# PR Writer Skill

Root entrypoint: `AGENTS.md`.
Use this skill as the source of truth for PR creation after reading the
repository-level rules in `AGENTS.md`.

## Purpose

This skill turns a branch's commits into a clean pull request:

1. gather the branch's commits and diff versus the base branch
2. derive a PR title following the repository convention
3. write a structured PR body (요약 / 변경사항 / 테스트 계획)
4. open the PR by running `gh pr create` directly

This skill MUST NOT:

- merge the pull request
- force-push
- create commits (use `smart-commit` for that)
- rewrite history

---

## Execution Flow

Follow this order strictly:

1. run `git branch --show-current`
   - if the branch is `main`, **stop** and report — PRs are opened from feature
     branches, not `main`
2. determine the base branch (default `main`)
3. ensure the branch is pushed:
   - run `git status` to confirm no uncommitted changes intended for the PR
   - run `git push -u origin <branch>` (normal push only, never `--force`)
4. gather context:
   - `git log <base>..HEAD --oneline`
   - `git diff <base>...HEAD --stat`
   - inspect diffs as needed to understand the change
5. derive the PR title (see below)
6. write the PR body (see below)
7. create the PR with `gh pr create --base <base> --title "<title>" --body "<body>"`
8. output the PR URL and stop

---

## PR Title Convention

Mirror the repository commit convention (see `AGENTS.md` and
`docs/commit-and-pr-convention.md`):

```text
Type(Scope) : 설명
```

- **Type and scope are English**; the description (`설명`) is **Korean**, imperative
  / present tense, no trailing period
- Choose the `Type` / `Scope` that best represents the branch's primary intention
- If the branch has a single commit, reuse that commit's message as the title

Example: `Feat(auth) : 로그인 플로우와 유저 스토어 추가`

Allowed types: `Feat`, `Fix`, `Add`, `Remove`, `Refactor`, `Docs`, `Chore`,
`Test`, `Style`, `Implement`.

---

## PR Body Template

```markdown
## 요약

<1-2 sentences: what this PR does and why>

## 변경사항

- <notable change>
- <notable change>

## 테스트 계획

- [ ] <how it was verified — e.g. `npm run build`, `npm run lint`, manual check>
```

Guidelines:

- Base the Summary and Changes on the actual commits and diff, not assumptions.
- List changes grouped by area (components / stores / api / styles / config).
- Fill the Test plan with the commands actually run for this frontend
  (`npm run lint`, `npm run type-check`, `npm run build`) plus any manual checks.

End the PR body with:

```text
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Guardrails

- Never merge, close, or force-push the PR.
- Never amend or rewrite existing commits.
- If the branch is `main`, or nothing differs from the base branch, stop and report
  instead of creating an empty PR.
- If `gh` is not authenticated, stop and report the exact command the user should run
  (`gh auth login`).
