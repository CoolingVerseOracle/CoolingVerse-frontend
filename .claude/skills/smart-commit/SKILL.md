---
name: smart-commit
description: Analyze git changes, split them into meaningful commit units, perform selective staging, and create commits following repository convention. Stop before push.
---

# Smart Commit Skill

Root entrypoint: `AGENTS.md`.
Use this skill as the source of truth for commit execution after reading the
repository-level rules in `AGENTS.md`.

## Purpose

This skill automates commit creation with high-quality structure.

It performs:

1. git diff analysis
2. semantic grouping of changes
3. selective staging (file or hunk level)
4. commit message generation based on repository convention
5. commit execution by running `git commit` directly

After the commits are created, this skill MAY run `git push` (normal push only,
never `--force`) to publish them.

This skill MUST NOT:

- create pull requests
- merge branches
- force-push or rewrite history

---

## Execution Flow

Follow this order strictly:

1. inspect current branch — **if on `main`, do NOT commit there.** Branch strategy
   (see `docs/commit-and-pr-convention.md`) allows only `main` + working branches,
   and `main` changes only via PR. Create/switch to a working branch named
   `<type>/<short-desc>` (e.g. `feat/login-view`) first, carrying the changes over
2. run `git status`
3. run `git diff` (and `git diff --staged` if anything is already staged)
4. identify all modified / added / deleted files
5. group changes into commit units based on intention
6. generate commit plan
7. perform selective staging for one unit
8. generate commit message
9. run `git commit`
10. repeat for remaining units if clean separation exists
11. optionally run `git push` (normal push only, never `--force`) to publish the
    commits

---

## Commit Message Convention

Use the repository convention (see `AGENTS.md` and
`docs/commit-and-pr-convention.md`) exactly:

```text
Type(Scope) : 설명
```

Rules:

- **type and scope are English**; the description (`설명`) is **Korean**
- imperative / present tense
- no period at the end
- one primary scope

Allowed types:

- `Feat`
- `Fix`
- `Add`
- `Remove`
- `Refactor`
- `Docs`
- `Chore`
- `Test`
- `Style`
- `Implement`

Scope is the affected area of this Vue 3 + Vite frontend. Typical scopes:
`auth`, `router`, `store`, `components`, `views`, `api`, `composables`, `styles`,
`vite`, `deps`, `config`.

Examples:

- `Feat(auth) : 로그인 폼 유효성 검사 추가`
- `Fix(store) : 로그아웃 시 유저 상태 초기화`
- `Refactor(components) : 프로필 뷰에서 UserCard 분리`
- `Style(components) : 카드 간격 정렬`
- `Chore(vite) : @ 경로 별칭 설정`

---

## Commit Grouping Rules

### One Commit = One Intention

Each commit must represent exactly one logical purpose.

Valid intentions:

- feature addition
- bug fix
- refactor
- test update
- docs update
- formatting change
- removal

---

### Do NOT mix

Never combine in one commit:

- feature + refactor
- refactor + test
- test + docs
- multiple domains without clear single intention

---

### Grouping Heuristics

When analyzing `git diff`:

1. group by **primary intention**, not by file type
2. prefer **domain-based grouping** (e.g. a Vue view + its store + its composable
   that ship one feature belong together)
3. separate test changes unless tightly coupled
4. separate docs unless trivial
5. keep lockfile changes (`package-lock.json`) with the dependency change that
   caused them
6. if one file contains mixed changes:
   - prefer hunk-level staging
   - if unsafe → report before committing

---

## Selective Staging Rules

### Priority

1. file-level staging (`git add <path>`)
2. hunk-level staging (`git add -p <path>`) when needed
3. avoid `git add .` unless all changes share one intention

---

### Example

Bad:

```bash
git add .
git commit -m "Update stuff"
```

Good:

```bash
git add src/stores/user.ts src/views/LoginView.vue
git commit -m "Feat(auth) : 유저 스토어와 함께 로그인 플로우 추가"

git add src/assets/styles/tokens.scss
git commit -m "Style(styles) : 간격 토큰 추가"
```

---

## Push & Stop Condition

After the last commit unit is committed, `git push` is allowed — run a normal push
(never `--force`) to publish the commits, then report what was committed and pushed.
**Never push to `main`** — only working branches are pushed; `main` moves only via
merged PRs.

Pull request creation and merging are **not** part of this skill — use `pr-writer`
for PRs. Never force-push or rewrite history.
