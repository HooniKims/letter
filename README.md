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

## 주요 기능

- Paperlogy 기반 화면 스타일
- 부모님 성향, 편지 말투, 전하고 싶은 진심 선택
- AI 감사 카드 두 문장 생성
- 생성 문구 직접 수정
- 생성형 AI 윤리 체크 확인
- 최종 완성 내용 Google Sheets 저장
- Apps Script 웹앱 연동
