# Google Sheets 저장 설정

현재 웹앱의 `최종 완성하기` 버튼은 서버의 `/api/submit`으로 저장을 요청합니다.
Google Sheets에 실제로 쓰려면 아래 둘 중 하나를 설정해야 합니다.

스프레드시트를 `링크가 있는 모든 사용자 편집 가능`으로 열어두어도 Google Sheets API의 쓰기 요청은 인증 없이 동작하지 않습니다.
공개 링크는 대상 문서를 찾는 데만 쓰고, 실제 저장 권한은 Apps Script Web App 또는 서비스 계정으로 처리해야 합니다.

## 방법 1. Apps Script Web App 사용

1. 저장할 Google 스프레드시트를 엽니다.
2. `확장 프로그램 > Apps Script`를 엽니다.
3. `gas/Code.gs` 내용을 붙여넣습니다.
4. `배포 > 새 배포 > 웹 앱`으로 배포합니다.
5. 실행 권한은 본인, 접근 권한은 웹앱을 호출할 사용자 범위에 맞게 설정합니다.
6. 발급된 Web App URL을 `.env`에 추가합니다.

```env
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/배포_ID/exec
```

`Code.gs`를 수정한 뒤에는 기존 URL만 다시 복사하는 것으로는 부족할 수 있습니다.
`배포 관리 > 수정 > 버전 > 새 버전`을 선택해서 다시 배포해야 새 `doPost` 코드가 실제 웹앱에 반영됩니다.
웹앱 URL을 브라우저에서 열었을 때 `어버이날 감사 카드 저장 웹앱이 준비되었습니다.`라는 JSON 메시지가 보이면 올바른 배포본입니다.

현재 `Code.gs`는 시트 서식도 함께 적용합니다.
A열은 학번, B열은 이름, C열은 편지 내용, D열은 생성일시로 저장됩니다.
C열은 긴 편지 내용이 셀 폭을 넘으면 자동 줄바꿈되고, D열 생성일시는 가로/세로 가운데 정렬됩니다.
기존 `학번 이름 / 편지 내용 / 생성일시` 3열 구조가 남아 있으면 웹앱 URL을 한 번 열거나 새 제출이 들어올 때 4열 구조로 자동 정리합니다.
이미 저장된 행도 웹앱 URL을 한 번 열거나 새 제출이 들어오면 같은 서식이 다시 적용됩니다.

## 방법 2. Google 서비스 계정 사용

1. Google Cloud에서 서비스 계정을 만들고 Sheets API를 활성화합니다.
2. 대상 스프레드시트를 서비스 계정 이메일에 편집자로 공유합니다.
3. `.env`에 아래 값을 추가합니다.

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=서비스계정@프로젝트.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=1juHN4fRQzb9WAhVCqmJ7u3qfwEJQMAFCSOs_VvS5Wr0
GOOGLE_SHEETS_RANGE=A:D
```
