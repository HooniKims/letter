# 카드 이미지 생성

웹앱과 별개로 Google Sheets에서 내보낸 CSV를 읽어 어버이날 카드 이미지를 만듭니다.

입력 CSV는 A열 학번, B열 이름, C열 카드 메시지 구조를 사용합니다.

## 생성 방식

이 폴더는 OpenAI API 키를 사용하지 않습니다.

1. Codex의 `$imagegen` 스킬로 카드 배경을 만듭니다.
2. 생성된 배경 이미지를 `toimage/sample/backgrounds`에 넣습니다.
3. 아래 명령으로 C열 문구와 하단 학번/이름을 합성합니다.

```bash
node toimage/generate-card-images.mjs --input toimage/sample/sample-students.csv --out toimage/sample --limit 3
```

## 규격

- 최종 PNG: `1170 x 400px`, `300dpi`
- 인쇄 규격: `99.1 x 33.9mm`
- 배경은 최종 규격에 꽉 차도록 중앙 크롭됩니다.
- 문구와 이름은 좌우 `4mm` 안전 여백 안쪽에 배치합니다.
- 폰트: Paperlogy 고정

정확한 한글 문구와 하단 학번/이름은 이미지 생성 후 로컬에서 합성합니다.
이 방식은 이미지 생성 모델이 한글 글자를 잘못 그리는 문제를 피하기 위한 것입니다.

## 설정 파일

`toimage/card-settings.json`에서 이 폴더 전용 설정을 관리합니다.

- `print`: 라벨지 인쇄 규격과 DPI
- `paths`: CSV, 결과 폴더, 배경 폴더
- `font`: Paperlogy 폰트 파일
- `layout.contentSafeMarginMm`: 좌우 안전 여백
- `layout.message`: 문구 최대 폭, 최대 줄 수, 글자 크기, 줄간격, 얇은 외곽선
- `layout.footer`: 하단 학번/이름 위치와 여백
- `koreanLineBreak`: 한글 어절 기반 줄바꿈 규칙

## imagegen 프롬프트 원칙

- `toimage/sample.png`의 느낌을 기준으로 합니다: 크림색 스티커 카드, 부드러운 스캘럽 가장자리, 양쪽 카네이션, 깨끗한 중앙 여백.
- 배경은 다양하게 만듭니다: 꽃 위치, 리본, 작은 하트와 꽃잎, 가장자리 색감만 바꾸고 전체는 미니멀하게 유지합니다.
- 가운데는 C열 카드 메시지가 들어갈 수 있도록 깨끗하게 남깁니다.
- 텍스트, 가짜 한글, 숫자, 로고, 워터마크는 배경에 넣지 않습니다.
- 최종 규격은 imagegen 출력이 아니라 로컬 합성 단계에서 엄격히 맞춥니다.
- 올드한 삽화체, 복잡한 꽃무늬 배경, 진한 양피지 질감은 피합니다.
- Paperlogy 글자는 배경과 분리되도록 반투명 중앙 패널 위에 올리되, 테두리는 얇게 유지합니다.

## 한글 줄바꿈

문구는 공백 기준으로만 단순 분리하지 않고, 한글 어절을 기준으로 여러 후보 줄을 만든 뒤 가장 자연스러운 구성을 선택합니다.

- 문장 끝은 줄 끝에 오도록 우선합니다.
- `챙겨 / 주셔서`처럼 보조 표현이 갈라지는 줄바꿈은 피합니다.
- 한 글자 어절이 줄 끝이나 줄 앞에 홀로 남는 경우는 피합니다.
- 최대 3줄 안에서 각 줄 길이가 과하게 치우치지 않도록 맞춥니다.

## 로컬 미리보기

이미지 생성 없이 규격과 폰트 합성만 확인하려면 다음을 사용할 수 있습니다.

```bash
node toimage/generate-card-images.mjs --input toimage/sample/sample-students.csv --out toimage/sample --limit 3 --local-preview true
```

## Paperlogy

`toimage/fonts`에 Paperlogy SemiBold/Bold TTF를 넣어 사용합니다.
렌더러는 이 폰트 파일이 없으면 기본 글꼴로 대체하지 않고 실패합니다.
