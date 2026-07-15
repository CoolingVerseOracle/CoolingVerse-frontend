# AGENTS.md

Root entrypoint and single source of truth for all coding agents (Codex, Claude
Code, etc.) working in this repository. Claude Code loads this via `CLAUDE.md`
(`@AGENTS.md` import).

## Project overview

**CoolingVerse frontend** — web client for the CoolingVerse project (Oracle 2026
summer). This is a fresh repository: application scaffolding does not exist yet, so
the sections below describe the **intended** stack and conventions. Follow them from
the first commit so the project stays consistent as it is built.

- Remote: `github.com/CoolingVerseOracle/CoolingVerse-frontend`
- Default branch: `main`

## Tech stack

- **Vue 3** — Composition API with `<script setup>` SFCs
- **TypeScript** — strict typing across the app
- **Vite** — dev server and build tool
- **Pinia** — state management (one store per domain via `defineStore`)
- **Vue Router** — client-side routing
- **SCSS** — styles authored in `<style scoped lang="scss">` per component
- **npm** — package manager (use `npm`, commit `package-lock.json`)

## Commands

These activate once the Vite project is scaffolded:

- `npm install` — install dependencies
- `npm run dev` — start the dev server
- `npm run build` — production build (runs type-check + Vite build)
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
- `npm run type-check` — run `vue-tsc` type checking

## Project structure (planned)

```
src/
  components/     # reusable UI components (PascalCase .vue)
  views/          # route-level page components
  stores/         # Pinia stores (one per domain)
  router/         # Vue Router config
  composables/    # reusable composition functions (useXxx)
  api/            # API clients / HTTP layer
  assets/
    styles/       # global SCSS, variables, mixins
  types/          # shared TypeScript types
```

- Path alias `@/` maps to `src/` — prefer `@/` absolute imports over deep relative paths.

## Coding conventions

- Component files and names use **PascalCase** (e.g. `UserCard.vue`).
- Always use `<script setup lang="ts">` in SFCs.
- Composables are named `useXxx` and live in `src/composables/`.
- Pinia stores use `defineStore`, one store per domain in `src/stores/`.
- Styles are **scoped SCSS** per SFC; share tokens via `src/assets/styles/`.
- Keep components small and typed; avoid `any`.

## Commit convention

Format: `Type(Scope) : 설명` — **type/scope in English, description in Korean**.
See `docs/commit-and-pr-convention.md` for the full reference.

Rules:
- Type and scope are English; the description (`설명`) is Korean, imperative/present tense
- No trailing period
- One primary scope

Allowed types: `Feat`, `Fix`, `Add`, `Remove`, `Refactor`, `Docs`, `Chore`,
`Test`, `Style`, `Implement`.

Examples: `Feat(auth) : 로그인 폼 유효성 검사 추가`,
`Style(components) : 카드 간격 정렬`, `Chore(vite) : @ 경로 별칭 설정`.

## Pull request convention

Full reference: `docs/commit-and-pr-convention.md`.

- **Title** follows the commit convention: `Type(Scope) : 설명` (English type/scope,
  Korean description).
- **Body** has three sections with **Korean headers**:
  - **요약** — what and why, in a sentence or two
  - **변경사항** — bullet list of notable changes
  - **테스트 계획** — how it was verified

## Skills / workflows

Automation lives under `.claude/skills/`. Any agent (Claude native invocation, or
Codex reading these files) MUST follow them for the corresponding task:

- **`.claude/skills/smart-commit/SKILL.md`** — analyze changes, group into meaningful
  commit units, selectively stage, and commit per the convention above. **May also
  `git push` (normal push, never `--force`); does not open PRs or merge.**
- **`.claude/skills/pr-writer/SKILL.md`** — generate a PR title + structured body from
  the branch's commits and open it with `gh`. **Never merges.**
