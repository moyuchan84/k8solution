# /ship — 코드 검사 → 브랜치 → 커밋 → Push → PR

인자: `$ARGUMENTS`
- 인자 없음: 브랜치명과 PR 제목을 변경 내용에서 자동 추론
- 인자 1개: 브랜치명으로 사용 (예: `/ship feat/my-feature`)
- 인자 2개: 브랜치명 + PR 제목 (예: `/ship feat/x "Add X feature"`)

---

## Step 1 — 변경 파일 파악

`git status`와 `git diff HEAD`를 실행해 어떤 파일이 변경/추가됐는지 파악한다.
변경된 파일이 없으면 "커밋할 변경 사항이 없습니다"를 출력하고 종료한다.

## Step 2 — 코드 검사 (변경된 레이어에 따라 선택 실행)

### Python 파일이 변경된 경우 (`backend/` 포함)
다음을 순서대로 실행한다. 오류 발생 시 즉시 사용자에게 보고하고 수정 여부를 묻는다.

1. **구문 검사** — 변경된 `.py` 파일 각각에 대해:
   ```
   python -m py_compile <file>
   ```
   실패 시 해당 파일의 구문 오류를 수정한 뒤 계속 진행한다.

2. **임포트 순서·미사용 임포트 검사** (ruff 설치 시):
   ```
   cd backend && python -m ruff check . --select F401,F811,E401 --fix
   ```
   ruff가 없으면 이 단계를 건너뛴다.

3. **빠른 단위 테스트** (pytest 설치 시):
   ```
   cd backend && python -m pytest tests/ -x -q --tb=short 2>&1 | head -60
   ```
   테스트가 없거나 pytest가 없으면 건너뛴다.
   실패 시 사용자에게 결과를 보여주고 "테스트 실패에도 계속 진행할까요?"를 확인한다.

### 프론트엔드 파일이 변경된 경우 (`frontend/` 포함)
1. **타입 체크** (설치 시):
   ```
   cd frontend && npx tsc --noEmit 2>&1 | head -40
   ```
2. **린트**:
   ```
   cd frontend && npm run lint 2>&1 | head -40
   ```
   오류 발생 시 사용자에게 보고한다. `npm run lint`가 없으면 건너뛴다.

### 검사 요약 출력
모든 검사 결과를 표로 정리해 보여준다:
- ✅ 통과 / ⚠️ 경고(계속 진행) / ❌ 실패(중단)

## Step 3 — 브랜치 결정

현재 브랜치를 확인한다 (`git branch --show-current`).

**현재 브랜치가 `main` 또는 `master`인 경우:**
- `$ARGUMENTS`에서 첫 번째 인자를 브랜치명으로 사용한다.
- 인자가 없으면 변경 내용을 보고 `feat/`, `fix/`, `chore/` 접두사를 붙인 kebab-case 브랜치명을 자동 생성한다 (예: `feat/add-k8s-client`, `fix/validate-name-regex`).
- 브랜치를 생성하고 전환한다: `git checkout -b <브랜치명>`

**이미 feature 브랜치인 경우:**
- 해당 브랜치를 그대로 사용한다.
- 사용자에게 현재 브랜치명을 알린다.

## Step 4 — 커밋

1. 변경된 파일을 스테이징한다. `.env`, `*.pyc`, `__pycache__` 같은 민감/불필요 파일은 제외한다.
   ```
   git add <변경된 파일들>
   ```

2. `git diff --cached`를 보고 커밋 메시지를 작성한다:
   - 형식: `<type>: <한국어 요약>` (type: feat/fix/chore/docs/refactor/test)
   - 본문: 주요 변경 내용 bullet 3개 이내
   - 트레일러: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

3. 커밋을 실행한다.

## Step 5 — Push

```
git push -u origin <브랜치명>
```

이미 upstream이 있으면 `git push`만 실행한다.

## Step 6 — PR 생성

`gh pr list --head <브랜치명>`으로 이미 PR이 있는지 확인한다.

**PR이 없는 경우** `gh pr create`로 생성한다:
- 제목: `$ARGUMENTS`의 두 번째 인자 또는 커밋 메시지 첫 줄을 사용
- 본문에 포함할 내용:
  - `## Summary` — 변경 내용 bullet 3~5개
  - `## 검증 결과` — Step 2의 검사 결과 표
  - `## Test plan` — 체크리스트 형태로 테스트 방법 제안
  - `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

**PR이 이미 있는 경우** PR URL을 출력하고 "이미 PR이 존재합니다"를 알린다.

## 완료 출력

아래 형식으로 결과를 출력한다:

```
✅ 완료
  브랜치: feat/xxx
  커밋:   abc1234 — "feat: ..."
  PR:     https://github.com/...
```
