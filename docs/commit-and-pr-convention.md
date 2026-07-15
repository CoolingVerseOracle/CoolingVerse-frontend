# 커밋 & PR 컨벤션 (한국어)

CoolingVerse frontend 저장소의 커밋 메시지와 Pull Request 작성 규칙입니다.
`smart-commit`, `pr-writer` 스킬은 이 문서를 기준으로 동작합니다.

> 요약: **타입/스코프는 영문, 설명(Description)은 한국어**로 작성합니다.
> PR 본문 섹션 제목은 한국어(요약 / 변경사항 / 테스트 계획)를 사용합니다.

## 브랜치 전략

브랜치는 **`main` + 작업 브랜치** 2계층만 사용합니다.

- **`main`** — 항상 배포 가능한 기준 브랜치. **직접 커밋/push 금지.**
- **작업 브랜치** — 모든 작업은 `main`에서 분기한 작업 브랜치에서 수행.
  네이밍: `<type>/<간단한-설명>` (소문자·하이픈), 예: `feat/login-view`,
  `fix/scenario-filter`, `docs/branch-strategy`
- **`main` 병합은 반드시 PR을 통해서만** 이루어집니다. 작업 브랜치에서
  PR을 생성(`pr-writer`)하고, 리뷰 후 병합합니다. PR 없이 `main`에
  병합/직접 push하지 않습니다.

## 실행 방식

커밋과 PR 생성은 스킬을 통해 수행합니다. 각 스킬은 내부적으로 표준 CLI를
**직접 실행**합니다.

- `smart-commit` — 스테이징 후 `git commit`을 직접 실행하고, 이어서 `git push`(일반
  push, `--force` 금지)까지 실행 가능. PR 생성/merge는 하지 않음
- `pr-writer` — `gh pr create`를 직접 실행 (merge 안 함)

---

## 커밋 메시지 컨벤션

형식:

```text
Type(Scope) : 설명
```

규칙:

- **타입(Type)**: 영문, 아래 허용 목록에서 선택
- **스코프(Scope)**: 영문 소문자, 변경이 일어난 도메인/폴더명
- **설명(Description)**: **한국어**, 명령형·현재형으로 간결하게
- 설명의 마침표(`.`)는 붙이지 않음
- 하나의 커밋 = 하나의 의도, 하나의 주요 스코프

### 허용 타입

| 타입 | 용도 |
| --- | --- |
| `Feat` | 새로운 기능 추가 |
| `Fix` | 버그 수정 |
| `Add` | 파일·리소스·의존성 등 추가 |
| `Remove` | 코드·파일·기능 제거 |
| `Refactor` | 동작 변화 없는 구조 개선 |
| `Docs` | 문서 수정 |
| `Chore` | 빌드·설정·잡무 |
| `Test` | 테스트 추가·수정 |
| `Style` | 포맷팅·공백·세미콜론 등 비기능 변경 |
| `Implement` | 기능 구현(설계 → 구현) |

### 스코프 예시

Vue 3 + Vite 프론트엔드 기준 주요 스코프(영문 유지):

`auth`, `router`, `store`, `components`, `views`, `api`, `composables`,
`styles`, `vite`, `deps`, `config`

### 커밋 예시

```text
Feat(auth) : 로그인 폼 유효성 검사 추가
Fix(store) : 로그아웃 시 유저 상태 초기화
Refactor(components) : 프로필 뷰에서 UserCard 분리
Style(components) : 카드 간격 정렬
Chore(vite) : @ 경로 별칭 설정
Docs(readme) : 개발 서버 실행 방법 보강
```

---

## PR 컨벤션

### PR 제목

커밋 컨벤션과 동일한 형식을 사용합니다. **타입/스코프는 영문, 설명은 한국어**입니다.

```text
Type(Scope) : 설명
```

- 브랜치의 주요 의도를 대표하는 타입/스코프 선택
- 커밋이 하나뿐이면 해당 커밋 메시지를 그대로 사용

예시:

```text
Feat(auth) : 로그인 플로우와 유저 스토어 추가
Fix(api) : 토큰 만료 시 재요청 처리
```

### PR 본문 템플릿

섹션 제목은 **한국어**를 사용합니다.

```markdown
## 요약

<이 PR이 무엇을, 왜 하는지 1~2문장>

## 변경사항

- <주요 변경 내용>
- <주요 변경 내용>

## 테스트 계획

- [ ] <검증 방법 — 예: `npm run build`, `npm run lint`, 수동 확인>
```

작성 가이드:

- 요약·변경사항은 실제 커밋과 diff를 근거로 작성(추측 금지)
- 변경사항은 영역별로 묶어 정리(components / stores / api / styles / config)
- 테스트 계획에는 실제로 실행한 명령(`npm run lint`, `npm run type-check`,
  `npm run build`)과 수동 확인 항목을 기록

PR 본문 마지막에 다음 서명을 추가합니다:

```text
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 가드레일

- `main` 브랜치에서는 PR을 열지 않음(피처 브랜치에서만)
- base와 차이가 없으면 빈 PR을 만들지 않고 중단
- merge / close / force-push / 히스토리 재작성 금지
