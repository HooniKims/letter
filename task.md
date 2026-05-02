# 작업 기록: AI 어버이날 감사 카드 웹앱

## 프로젝트 목적

학생이 학번과 이름을 입력하고 Step 1, 2, 3 선택지를 고른 뒤 AI로 부모님께 드릴 감사 카드 문구를 생성하는 웹앱을 만든다.

- Step 1: 부모님 성향
- Step 2: 편지 말투/스타일
- Step 3: 전하고 싶은 진심
- 결과: 짧은 두 문장의 감사 카드 문구
- 최종 저장: Google Sheets에 학번 이름, 편지 내용, 생성일시 저장

## 주요 요구사항

- 폰트는 Paperlogy 사용
- `DESIGN.md`, `screen.png`, `textstyle.md` 참고
- 단일 파일에 모두 넣지 않고 기능별 모듈화
- 생성 버튼은 Step 3 아래에 배치
- 생성 중 문구는 타이핑 효과로 표시
- 생성 중 문구: `부모님께 전하는 감사한 마음을 만들고 있습니다.`
- 생성된 AI 카드 문구는 학생이 직접 수정 가능
- 최종 완성하기 전 생성형 AI 윤리 체크 필요
- AI 윤리 문구: `AI에게 도움을 받지만, 최종 생각은 항상 여러분이 하는 모습이 아름답습니다.`
- AI 윤리 문구에는 무지갯빛 반짝임 효과 적용
- 저장 중에는 다른 동작이 되지 않게 잠금
- favicon은 카네이션 이미지 사용

## 구현 구조

### Frontend

- `public/index.html`
- `public/styles.css`
- `public/js/app.js`
- `public/js/api.js`
- `public/js/options.js`
- `public/js/state.js`
- `public/js/ui.js`

### Backend

- `server.mjs`
- `server/env.mjs`
- `server/generator.mjs`
- `server/lmstudio.mjs`
- `server/openai.mjs`
- `server/cardPrompt.mjs`
- `server/sheets.mjs`
- `server/static.mjs`
- `server/validation.mjs`

### Google Apps Script

- `gas/Code.gs`
- `gas/README.md`

## AI 생성 방식

기본 생성 순서는 로컬과 Netlify 모두 동일하게 맞췄다.

1. LM Studio 먼저 시도
2. LM Studio 요청 실패 시 OpenAI fallback 사용

관련 코드:

- `server/env.mjs`: 기본 provider는 `lmstudio`
- `server/generator.mjs`: LM Studio 실패 시 OpenAI로 fallback
- `server/lmstudio.mjs`: LM Studio chat completions streaming 호출
- `server/openai.mjs`: OpenAI Responses API 호출

## 모델 설정

최종 기준:

- 기본 provider: `lmstudio`
- 기본 LM Studio 모델: `google/gemma-4-e2b`
- fallback OpenAI 모델: `gpt-5-nano`
- thinking: `false`
- timeout: `15000ms`

## Netlify 배포 관련 정리

처음 Netlify에 배포했을 때 루트 `index.html`만 보여서 다음 문구가 노출됐다.

```text
웹앱은 Node 서버를 실행한 뒤 http://localhost:5173/에서 엽니다.
```

원인:

- 실제 앱 화면은 `public/index.html`에 있음
- Netlify가 기본 루트를 배포하면서 루트 `index.html`을 보여줌

해결:

- `netlify.toml` 추가
- Netlify publish directory를 `public`으로 지정
- `/api/generate`는 `netlify/functions/generate.mjs`로 연결
- `/api/submit`은 `netlify/functions/submit.mjs`로 연결

## Netlify 환경변수 설정

Netlify는 로컬 `.env` 파일을 자동으로 읽지 않는다. Netlify Site settings의 Environment variables에 직접 등록해야 한다.

필수:

```text
DEFAULT_AI_PROVIDER=lmstudio
LMSTUDIO_API_URL=https://lm.alluser.site
LMSTUDIO_API_KEY=
LMSTUDIO_GEMMA_E2B_MODEL=google/gemma-4-e2b
LMSTUDIO_TIMEOUT_MS=15000
LMSTUDIO_ENABLE_THINKING=false
OPENAI_API_KEY=
OPENAI_FALLBACK_MODEL=gpt-5-nano
GOOGLE_APPS_SCRIPT_WEB_APP_URL=
```

주의:

- 실제 비밀키와 Apps Script URL은 이 파일에 기록하지 않는다.
- `LMSTUDIO_API_URL`은 `https://lm.alluser.site`를 사용한다.
- `http://localhost:1234`는 Netlify에서 사용할 수 없다.
- `OPENAI_API_KEY`는 LM Studio 실패 시 fallback을 위해 필요하다.
- `GOOGLE_APPS_SCRIPT_WEB_APP_URL`은 `/exec`로 끝나는 Apps Script 웹앱 URL을 넣는다.

## Google Sheets 저장

최종 완성하기 버튼을 누르면 Google Apps Script 웹앱 URL로 POST 요청을 보내 저장한다.

저장 열:

- A열: 학번 이름
- B열: 편지 내용
- C열: 생성일시

생성일시:

- 한국시간 기준
- 서버에서 `Asia/Seoul` 기준으로 포맷

Google Sheets 표시 관련 Apps Script 처리:

- B열은 자동 줄바꿈
- 생성일시 열은 가로/세로 가운데 정렬
- 새 데이터는 A2부터 누적

## 프롬프트 및 후처리 개선

문제:

- 성향과 말투가 약하게 반영됨
- `재밌게` 스타일에 개그감이 부족함
- 편지 문체가 아니라 설명문처럼 나오는 경우가 있었음
- 존댓말이 아닌 문장 또는 어색한 어미가 나오는 경우가 있었음
- 한국어 띄어쓰기가 붙는 경우가 있었음

개선:

- `textstyle.md` 내용을 반영해 스타일별 가이드 강화
- 스타일별 예비 문장 추가
- 성향별 예비 문장 추가
- 진심 선택지별 예비 문장 추가
- `귀엽게`, `재밌게`, `어른스럽게`, `감동적으로`, `멋진 말로`, `솔직하고 차분하게`가 분명히 구분되도록 후처리
- `재밌게`는 웃음 버튼, 걱정 정리 전문가, 마음 저장소, 효도 담당 같은 표현을 사용하도록 강화
- `물들인다`, `살겠다`, `존재다` 같은 설명문 어미 제거
- `게요고`, `요고`, `하겠습니다요`, `습니다요`, `배려이` 등 어색한 결합 후처리

## 장기 테스트 기록

### 5시간 e2b 단독 테스트

조건:

- 모델: `google/gemma-4-e2b`
- thinking: `false`
- OpenAI fallback 미사용
- LM Studio 직접 호출

결과:

- 총 1,567회
- 통과 1,445회
- 실패 122회
- 통과율 92.2%

실패 원인:

- 대부분은 실제 문장 품질보다 테스트 판정 키워드가 좁아서 생긴 실패
- 일부 실제 문제: 빈 응답, 어색한 어미, 편지체 부족

### 보정 후 전체 조합 테스트

조건:

- Step 1, 2, 3 전체 조합 288회
- 모델: `google/gemma-4-e2b`
- thinking: `false`
- OpenAI fallback 미사용

결과:

- 총 288회
- 통과 288회
- 실패 0회
- 통과율 100%

## GitHub 업로드 기록

원격 저장소:

```text
https://github.com/HooniKims/letter.git
```

주요 커밋:

- `0e08368 Initial parents day letter app`
- `aefaeec Add Netlify deployment support`
- `13d723d Prefer LM Studio when configured on Netlify`

추가로 마지막 라우팅 변경은 커밋 및 push 대상이다.

## 배포 전 주의사항

- `.env`는 Git에 올리지 않는다.
- Netlify에는 `.env` 대신 환경변수를 직접 등록한다.
- Netlify 환경변수를 바꾼 뒤에는 반드시 Redeploy 한다.
- LM Studio가 Netlify에서 동작하려면 `https://lm.alluser.site`가 Netlify 서버에서 접근 가능해야 한다.
- LM Studio가 실패해도 OpenAI fallback이 동작하려면 `OPENAI_API_KEY`가 Netlify에 있어야 한다.

## 현재 동작 기준

- 로컬 실행: `npm start` 후 `http://localhost:5173`
- Netlify 배포: `public/` 정적 화면 + Netlify Functions API
- 기본 AI 생성: LM Studio
- fallback: OpenAI `gpt-5-nano`
- 최종 저장: Apps Script를 통해 Google Sheets 저장
