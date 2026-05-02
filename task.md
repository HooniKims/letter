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

## 운영 메모

- 앞으로 코드, 배포 설정, 프롬프트, 환경변수 안내를 바꾸면 작업 후 `task.md`도 함께 업데이트한다.

## 2026-05-02 추가 수정

### 재밌게 스타일 조사 오류 수정

발견된 문제:

```text
엄마 아빠, 부모님은 우리 집 다정한 사랑 알람라 힘든 날도 금방 밝아져요.
```

원인:

- `재밌게` 스타일 fallback 문장에서 역할 표현 뒤에 항상 `라`를 붙이고 있었다.
- `충전기라`, `해결사라`처럼 받침이 없으면 자연스럽지만 `알람라`, `버튼라`처럼 받침이 있으면 잘못된 표현이 된다.

수정:

- `server/cardPrompt.mjs`에 받침 여부를 판단하는 `hasFinalConsonant()`를 추가했다.
- 역할 표현 뒤 조사를 `라` 또는 `이라`로 자동 선택하는 `withRoleParticle()`을 추가했다.
- 예: `다정한 사랑 알람이라`, `밝은 에너지 버튼이라`, `마음 충전기라`

### Netlify 최소 환경변수 파일 생성

요청:

- LM Studio를 우선 사용하고, 실패 시 OpenAI fallback을 사용하는 최소 환경변수 묶음을 `.env2`로 만든다.
- 실제 값은 기존 `.env`에서 필요한 항목만 복사한다.

`.env2`에 포함한 항목:

```text
DEFAULT_AI_PROVIDER
LMSTUDIO_API_URL
LMSTUDIO_API_KEY
LMSTUDIO_GEMMA_E2B_MODEL
LMSTUDIO_TIMEOUT_MS
LMSTUDIO_ENABLE_THINKING
LMSTUDIO_MAX_TOKENS
OPENAI_API_KEY
OPENAI_FALLBACK_MODEL
GOOGLE_APPS_SCRIPT_WEB_APP_URL
```

주의:

- `.env2`에는 실제 키가 들어갈 수 있으므로 Git에 올리지 않는다.
- `.gitignore`에 `.env2`를 추가했다.
- Netlify 환경변수에는 `.env2`의 Name/Value를 하나씩 등록하면 된다.

### Netlify 런타임 진단 API 추가

문제:

- 사용자가 Netlify에 환경변수를 넣었지만 계속 OpenAI `gpt-5-nano`로만 생성된다고 보고했다.
- LM Studio 쪽에는 신호가 오지 않는다고 했다.

가능성이 높은 원인:

- Netlify가 최신 커밋으로 Redeploy되지 않았을 수 있다.
- Netlify 환경변수에 `DEFAULT_AI_PROVIDER=openai`가 남아 있을 수 있다.
- `LMSTUDIO_API_URL`, `LMSTUDIO_API_KEY`가 Netlify 함수 런타임에 전달되지 않았을 수 있다.
- LM Studio 호출이 실패해서 OpenAI fallback으로 넘어갔을 수 있다.

수정:

- `/api/diagnostics`를 추가했다.
- 로컬 Node 서버와 Netlify Functions 모두 같은 진단 정보를 반환한다.
- 실제 키 값은 노출하지 않고, 값 존재 여부와 host, 모델, timeout, provider만 보여준다.

확인 방법:

```text
https://배포주소/api/diagnostics
```

확인해야 할 값:

- `routing.defaultProvider`가 `lmstudio`인지 확인
- `env.defaultAiProvider`가 `openai`로 남아 있지 않은지 확인
- `env.hasLmStudioApiUrl`이 `true`인지 확인
- `env.hasLmStudioApiKey`가 `true`인지 확인
- `lmStudio.apiHost`가 `lm.alluser.site`인지 확인

### LM Studio probe 및 fallback 사유 표시 추가

문제:

- `/api/diagnostics` 결과는 `defaultProvider=lmstudio`, `apiHost=lm.alluser.site`로 정상인데 실제 생성은 계속 OpenAI `gpt-5-nano`로 보인다고 했다.
- 이 경우 라우팅 문제가 아니라 LM Studio 요청 실패 후 fallback 되었을 가능성이 높다.

수정:

- `/api/diagnostics?probe=lmstudio`를 추가했다.
- 이 주소는 Netlify 함수 런타임에서 `LMSTUDIO_API_URL`의 `/v1/models`에 실제로 닿는지 확인한다.
- 실제 키는 노출하지 않는다.
- 생성 결과가 OpenAI fallback이면 화면 상태 메시지에 `fallback 사유`도 함께 표시한다.

확인 방법:

```text
https://배포주소/api/diagnostics?probe=lmstudio
```

확인해야 할 값:

- `probe.lmStudio.ok`가 `true`인지 확인
- `probe.lmStudio.status`가 `200`인지 확인
- `probe.lmStudio.configuredModelExists`가 `true`인지 확인
- `ok=false`이면 `message`, `status`, `bodyPreview`를 보고 LM Studio 서버 접근 문제인지 인증 문제인지 확인한다.

### 로컬 LM Studio 모델명 확인

확인 결과:

- 로컬 `.env`의 현재 모델명은 `google/gemma-4-e2b`이다.
- `https://lm.alluser.site/v1/models`를 실제 생성과 같은 `Origin`, `Referer`, 인증 헤더로 호출하면 정상 응답한다.
- 응답 모델 목록에 `google/gemma-4-e2b`, `google/gemma-4-e4b`, `gemma-4-26b-a4b-it`가 포함되어 있다.
- 따라서 현재 서버 기준으로 e2b 모델명은 `gemma4:e2b`가 아니라 `google/gemma-4-e2b`가 맞다.

수정:

- diagnostics probe가 실제 생성 코드와 동일하게 `Origin`, `Referer` 헤더를 보내도록 맞췄다.
- `/api/diagnostics?probe=lmstudio` 응답에 `configuredModel`, `configuredModelExists`, `modelIds`를 포함했다.
- `/api/diagnostics`와 probe 응답에 LM Studio 호출 시 사용하는 `originHost`도 표시한다.
- 환경변수에 모델명이 누락되어도 기본값이 `google/gemma-4-e2b`가 되도록 `server/env.mjs`의 fallback 기본값을 맞췄다.

Netlify에서만 OpenAI fallback이 되는 경우 우선 확인할 것:

- Netlify 배포 URL의 `/api/diagnostics?probe=lmstudio`를 직접 연다.
- `routing.defaultProvider`가 `lmstudio`인지 확인한다.
- `probe.lmStudio.ok`가 `true`인지 확인한다.
- `probe.lmStudio.configuredModelExists`가 `true`인지 확인한다.
- 위 값이 모두 정상인데도 생성 결과가 `gpt-5-nano`이면 화면에 표시되는 `fallback 사유`를 확인한다.
- 로컬 `/api/diagnostics` 결과는 Netlify 함수 런타임이 아니므로 Netlify 문제 판단에는 배포 URL에서 확인해야 한다.

### Netlify fetch failed 원인 추적 보강

확인된 현상:

- 화면에 `fallback 사유: fetch failed`가 표시된다고 했다.
- 이 메시지는 `DEFAULT_AI_PROVIDER`, 모델명, API key 존재 여부 문제가 아니라 Netlify 함수가 LM Studio URL로 네트워크 연결 자체를 만들지 못했을 때 나오는 증상이다.
- LM Studio 서버가 401, 403, 404 등으로 응답했다면 `fetch failed`가 아니라 `LM Studio request failed (상태코드)` 형태로 나와야 한다.

Nginx Proxy Manager 설정 관련 판단:

- 사용자가 공유한 설정에서 `dcmsletter.netlify.app` Origin은 정규식상 허용된다.
- `X-API-Key` 검사도 현재 앱이 보내는 헤더와 맞다.
- 따라서 그 설정만 보면 CORS나 인증 설정이 직접 원인이라고 보기는 어렵다.
- 다만 API key가 대화에 노출되었으므로 운영 전 교체하는 것이 안전하다.

수정:

- `server/networkError.mjs`를 추가해 Node fetch의 숨겨진 `cause.code`, `syscall`, `hostname`, `address`, `port` 등을 표시한다.
- LM Studio 연결 실패 시 fallback 사유가 단순 `fetch failed`가 아니라 `LM Studio network error: TypeError: fetch failed: cause(code=...)`처럼 더 구체적으로 보이게 했다.
- `/api/diagnostics?probe=lmstudio`도 네트워크 실패 세부 정보를 `detail`에 표시한다.

### Netlify 연결 timeout 확인

추가 확인:

- 브라우저 확장 프로그램 오류(`chrome-extension://...`)는 앱과 무관하다.
- 실제 앱 오류는 `fallback 사유: LM Studio network error: TypeError: fetch failed: cause(code=UND_ERR_CONNECT_TIMEOUT)`이다.
- `UND_ERR_CONNECT_TIMEOUT`은 Netlify 함수 서버가 `lm.alluser.site`에 TCP/TLS 연결을 열지 못했다는 뜻이다.
- CORS, API key, 모델명 문제라면 연결 timeout이 아니라 401, 403, 404 같은 HTTP 상태 코드가 표시되어야 한다.
- Netlify 배포 URL에서 `/api/diagnostics?probe=lmstudio`를 직접 호출했을 때도 LM Studio probe가 실패했다.

판단:

- 앱 코드와 Netlify 환경변수는 LM Studio 우선으로 잡혀 있다.
- 로컬에서는 같은 URL, 같은 Origin, 같은 key로 `/v1/models`와 `/v1/chat/completions`가 정상 동작한다.
- 따라서 남은 원인은 Netlify 함수 실행 서버에서 `58.148.64.77:443` 또는 `lm.alluser.site:443`까지 도달하지 못하는 네트워크/방화벽/공유기/NPM 노출 문제다.

수정:

- probe 자체 timeout이 먼저 발생해 원인을 가리는 문제를 줄이기 위해 probe timeout을 `LMSTUDIO_TIMEOUT_MS + 5000ms`, 최소 `20000ms`로 늘렸다.
- probe 응답에 `targetHost`, `timeoutMs`도 표시되도록 했다.

### 브라우저 직접 LM Studio 호출 방식 추가

참고한 정상 동작 구조:

- 다른 프로젝트는 Netlify Function이나 서버 API route가 아니라 브라우저에서 `https://lm.alluser.site/v1/chat/completions`를 직접 호출한다.
- 브라우저 직접 호출은 `Origin`, `Referer`가 자동으로 붙기 때문에 `lm.alluser.site`의 CORS/Origin 제한을 통과한다.
- 인증은 `Authorization`이 아니라 `X-API-Key`를 사용한다.
- 실제 요청 모델명은 `google/gemma-4-e2b`이다.

수정:

- `server/clientConfig.mjs`를 추가해 브라우저가 사용할 LM Studio endpoint, model, key 설정을 제공한다.
- `netlify/functions/client-config.mjs`와 `/api/client-config` redirect를 추가했다.
- `public/js/clientLmStudio.js`를 추가해 브라우저에서 LM Studio에 직접 POST한다.
- `public/js/letterPrompt.js`를 추가해 프론트 직접 호출용 카드 프롬프트와 응답 정규화를 담당한다.
- `public/js/api.js`의 생성 흐름을 `브라우저 LM Studio 직접 호출 -> 실패 시 기존 /api/generate fallback` 순서로 변경했다.
- 브라우저 직접 호출 body에는 `stream:false`, `reasoning_effort:"none"`, `enable_thinking:false`를 넣는다.
- `X-API-Key`만 보내고 `Authorization`은 보내지 않는다.

환경변수:

- Netlify에는 `NEXT_PUBLIC_LOCAL_LLM_API_KEY`를 등록한다.
- 브라우저 직접 호출용 공개 키만 사용하므로 `LMSTUDIO_API_KEY`는 Netlify에서 삭제해도 된다.
- 이 앱은 빌드 과정이 없는 정적 앱이므로 `NEXT_PUBLIC_*` 값이 자동으로 JS에 주입되지 않는다. 대신 `/api/client-config`가 공개 설정으로 내려준다.
- 브라우저 LM Studio 직접 호출이 실패하면 `/api/generate?provider=openai`로 넘어가 OpenAI만 호출한다. Netlify 서버에서 다시 LM Studio timeout을 기다리지 않도록 했다.

검증:

- `node --test tests/client-lmstudio.test.mjs` 통과
- 브라우저와 같은 `Origin`, `Referer`를 붙인 직접 호출에서 `provider=lmstudio-browser`, `model=google/gemma-4-e2b`로 생성 확인
- LM Studio 서버가 모델을 내린 순간에는 `400 Model unloaded.`가 올 수 있으며, 이 경우 앱은 기존 fallback 경로로 넘어간다.

### Netlify 환경변수 정리

현재 브라우저 직접 LM Studio 호출 구조에서 Netlify에 남길 항목:

```text
DEFAULT_AI_PROVIDER=lmstudio
LMSTUDIO_API_URL=https://lm.alluser.site
NEXT_PUBLIC_LOCAL_LLM_API_KEY
LMSTUDIO_GEMMA_E2B_MODEL=google/gemma-4-e2b
LMSTUDIO_MAX_TOKENS=700
OPENAI_API_KEY
OPENAI_FALLBACK_MODEL=gpt-5-nano
GOOGLE_APPS_SCRIPT_WEB_APP_URL
```

삭제해도 되는 항목:

```text
LMSTUDIO_API_KEY
LOCAL_LLM_API_KEY
LMSTUDIO_GEMMA_E4B_MODEL
LMSTUDIO_GEMMA_26B_MODEL
LMSTUDIO_TIMEOUT_MS
LMSTUDIO_ENABLE_THINKING
LMSTUDIO_TEMPERATURE
LMSTUDIO_TOP_P
LMSTUDIO_PRESENCE_PENALTY
LMSTUDIO_FREQUENCY_PENALTY
OPENAI_MODEL
GOOGLE_SHEETS_URL
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SHEETS_RANGE
```

주의:

- `NEXT_PUBLIC_LOCAL_LLM_API_KEY`는 브라우저에서 직접 쓰는 값이므로 공개 전제의 키로 취급해야 한다.
- 이전에 대화에 노출된 API key는 교체하는 것이 안전하다.
- Netlify 환경변수 삭제/수정 뒤에는 반드시 Redeploy 해야 한다.

### `.env.example2` 생성

요청:

- Netlify에 남길 환경변수만 실제 값까지 정리한 파일을 만든다.

처리:

- 기존 `.env`에서 필요한 값만 읽어 `.env.example2`를 생성했다.
- `NEXT_PUBLIC_LOCAL_LLM_API_KEY`는 기존 `.env`의 `LMSTUDIO_API_KEY` 값을 옮겨 담았다.
- `.env.example2`는 실제 키값이 들어가므로 Git에 올리지 않는다.
- 현재 `.gitignore`의 `.env.*` 규칙에 따라 `.env.example2`는 Git 무시 대상임을 확인했다.

포함된 항목:

```text
DEFAULT_AI_PROVIDER
LMSTUDIO_API_URL
NEXT_PUBLIC_LOCAL_LLM_API_KEY
LMSTUDIO_GEMMA_E2B_MODEL
LMSTUDIO_MAX_TOKENS
OPENAI_API_KEY
OPENAI_FALLBACK_MODEL
GOOGLE_APPS_SCRIPT_WEB_APP_URL
```
