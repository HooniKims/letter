# AI 어버이날 감사 카드

학생이 학번과 이름을 입력하고 부모님 성향, 편지 말투, 전하고 싶은 진심을 선택하면 AI가 두 문장의 감사 카드 문구를 생성하는 웹앱입니다.

## 실행

```bash
npm start
```

기본 주소는 `http://localhost:5173`입니다.

## 환경변수

`.env.example`을 참고해 `.env`를 만듭니다. 실제 `.env` 파일은 API 키와 Google Apps Script URL을 포함하므로 Git에 올리지 않습니다.

기본 생성 경로는 LM Studio이며, LM Studio 생성 실패 시 OpenAI `gpt-5-nano`를 fallback으로 사용합니다.

## Netlify 배포

Netlify는 `netlify.toml` 설정에 따라 `public/` 폴더를 배포합니다. `/api/generate`, `/api/submit` 요청은 Netlify Functions로 연결됩니다.

Netlify 클라우드는 로컬 PC의 LM Studio `localhost`에 접근할 수 없으므로, Netlify 환경에서는 기본 생성 경로가 OpenAI로 동작합니다. Netlify Site settings의 Environment variables에 최소한 다음 값을 등록합니다.

```text
OPENAI_API_KEY
OPENAI_FALLBACK_MODEL
GOOGLE_APPS_SCRIPT_WEB_APP_URL
```

외부에서 접근 가능한 LM Studio 서버를 따로 운영한다면 `DEFAULT_AI_PROVIDER=lmstudio`와 `LMSTUDIO_API_URL`을 Netlify 환경변수에 추가해 LM Studio 우선으로 바꿀 수 있습니다.

### Netlify 필수 환경변수

| 이름 | 값 |
| --- | --- |
| `OPENAI_API_KEY` | 기존 `.env`의 OpenAI API 키 |
| `OPENAI_FALLBACK_MODEL` | `gpt-5-nano` |
| `GOOGLE_APPS_SCRIPT_WEB_APP_URL` | Apps Script 웹앱 `/exec` URL |

### Netlify 선택 환경변수

| 이름 | 값 |
| --- | --- |
| `DEFAULT_AI_PROVIDER` | 비워두면 Netlify에서는 자동으로 `openai` 사용 |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Apps Script만 쓰면 없어도 됨 |
| `GOOGLE_SHEETS_RANGE` | 필요하면 `A:C` |

### 로컬 실행용 `.env`

로컬 PC에서 LM Studio를 우선 사용하려면 기존 `.env`처럼 아래 값을 둡니다.

```text
DEFAULT_AI_PROVIDER=lmstudio
LMSTUDIO_API_URL=http://localhost:1234/v1
LMSTUDIO_API_KEY=lm-studio
LMSTUDIO_GEMMA_E2B_MODEL=google/gemma-4-e2b
LMSTUDIO_TIMEOUT_MS=15000
LMSTUDIO_ENABLE_THINKING=false
OPENAI_API_KEY=
OPENAI_FALLBACK_MODEL=gpt-5-nano
GOOGLE_APPS_SCRIPT_WEB_APP_URL=
```

빈 값에는 기존 `.env`에 있던 실제 값을 넣습니다.

## 주요 기능

- Paperlogy 기반 화면 스타일
- 부모님 성향, 편지 말투, 전하고 싶은 진심 선택
- AI 감사 카드 두 문장 생성
- 생성 문구 직접 수정
- 생성형 AI 윤리 체크 확인
- 최종 완성 내용 Google Sheets 저장
- Apps Script 웹앱 연동
