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
- 여백: 없음, 배경은 최종 규격에 꽉 차도록 중앙 크롭됩니다.
- 폰트: Paperlogy 고정

정확한 한글 문구와 하단 학번/이름은 이미지 생성 후 로컬에서 합성합니다.
이 방식은 이미지 생성 모델이 한글 글자를 잘못 그리는 문제를 피하기 위한 것입니다.

## imagegen 프롬프트 원칙

- 배경은 다양하게 만듭니다: 한지 질감, 수채화, 스티커형 테두리, 꽃다발 배치, 리본, 하트 등을 번갈아 사용합니다.
- 가운데는 C열 카드 메시지가 들어갈 수 있도록 깨끗하게 남깁니다.
- 텍스트, 가짜 한글, 숫자, 로고, 워터마크는 배경에 넣지 않습니다.
- 최종 규격은 imagegen 출력이 아니라 로컬 합성 단계에서 엄격히 맞춥니다.

## 로컬 미리보기

이미지 생성 없이 규격과 폰트 합성만 확인하려면 다음을 사용할 수 있습니다.

```bash
node toimage/generate-card-images.mjs --input toimage/sample/sample-students.csv --out toimage/sample --limit 3 --local-preview true
```

## Paperlogy

`toimage/fonts`에 Paperlogy SemiBold/Bold TTF를 넣어 사용합니다.
렌더러는 이 폰트 파일이 없으면 기본 글꼴로 대체하지 않고 실패합니다.
