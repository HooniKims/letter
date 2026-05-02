const STYLE_GUIDES = {
  "귀엽게": "통통 튀고 사랑스러운 말투로 쓴다. 가벼운 의성어와 말랑한 표현을 한 번만 넣는다.",
  "솔직하고 차분하게": "과장 없이 담백하고 직접적인 말투로 쓴다. 진심이 조용히 드러나게 한다.",
  "재밌게": "부모님이 웃을 수 있는 생활형 비유나 작은 농담을 반드시 넣는다. 그래도 감사의 진심은 가볍게 만들지 않는다.",
  "어른스럽게": "존중과 책임감이 느껴지는 말투로 쓴다. 앞으로 더 잘하겠다는 태도를 자연스럽게 담는다.",
  "감동적으로": "부모님 사랑과 시간에 대한 고마움이 마음 깊이 느껴지게 쓴다. 과장된 신파는 피한다.",
  "멋진 말로": "짧고 인상적인 카드 문구처럼 쓴다. 세련된 비유를 한 번만 사용한다."
};

const PERSONALITY_GUIDES = {
  "활발한": "밝은 에너지와 웃음",
  "마음이 따뜻한": "따뜻한 배려와 다정함",
  "꼼꼼한": "작은 부분까지 챙기는 세심함",
  "아이디어가 많은": "새로운 생각과 문제 해결",
  "똑똑한": "지혜로운 조언과 판단",
  "다정한": "부드러운 말투와 따뜻한 표현",
  "부지런한": "매일 성실하게 애쓰는 모습",
  "편안한": "곁에 있으면 안심되는 분위기"
};

const MESSAGE_GUIDES = {
  "건강과 평안 기원": "부모님의 건강과 평안을 바라는 마음",
  "키워주신 은혜 감사": "길러 주신 사랑과 정성에 대한 감사",
  "효도하겠다는 다짐": "말과 행동으로 더 잘하겠다는 다짐",
  "여유와 휴식 권유": "오늘만큼은 쉬고 자신을 돌보길 바라는 마음",
  "행복한 추억 회고": "함께 웃었던 추억을 떠올리는 마음",
  "부모님의 삶 응원": "부모님의 하루와 꿈을 응원하는 마음"
};

export const CLIENT_CARD_SYSTEM_PROMPT = [
  "너는 중학생이 부모님께 드릴 어버이날 감사 카드 문구를 쓰는 한국어 글쓰기 도우미다.",
  "결과 본문 두 문장만 출력한다.",
  "생각 과정은 내부에서만 처리하고 절대 출력하지 않는다.",
  "제목, 설명, 목록, JSON, 영어, 작성 과정, Thinking Process는 절대 출력하지 않는다.",
  "두 문장 모두 부모님께 직접 말하는 존댓말 편지체로 쓴다."
].join(" ");

export function buildClientCardPrompt(input) {
  const variation = Math.random().toString(36).slice(2, 10);
  return [
    "아래 선택을 반드시 반영해서 부모님께 직접 드릴 감사 카드 문구를 한국어 두 문장으로만 써 줘.",
    `보내는 학생: ${input.studentInfo}`,
    `Step 1 부모님 성향: ${input.personality} - ${PERSONALITY_GUIDES[input.personality] || "부모님의 좋은 모습"}`,
    `Step 2 편지 말투/스타일: ${input.style} - ${STYLE_GUIDES[input.style] || "선택한 말투를 분명히 반영"}`,
    `Step 3 전하고 싶은 진심: ${input.message} - ${MESSAGE_GUIDES[input.message] || "감사한 진심"}`,
    `다양성 코드: ${variation}`,
    "",
    "규칙:",
    "1. 정확히 두 문장만 쓴다.",
    "2. 첫 문장은 '엄마 아빠,' 또는 '부모님,'으로 시작한다.",
    "3. 두 문장 모두 '-요', '-게요', '-습니다' 같은 존댓말로 끝낸다.",
    "4. 설명문처럼 쓰지 말고 실제 편지처럼 쓴다.",
    "5. '물들인다', '살겠다', '존재다' 같은 해설체 문장으로 끝내지 않는다.",
    "6. 재밌게 스타일이면 개그감 있는 비유를 반드시 넣는다.",
    "7. 귀엽게 스타일이면 말랑하고 통통 튀는 표현을 반드시 넣는다.",
    "8. 학생 이름이나 학번은 문구에 넣지 않는다.",
    "9. 답변은 한국어 카드 문구 두 문장으로 바로 시작한다."
  ].join("\n");
}

export function normalizeClientCardText(content) {
  const finalText = sliceFromLastAddress(String(content || ""));
  const cleaned = finalText
    .replace(/```[\s\S]*?```/g, "")
    .replace(/Thinking Process[\s\S]*?(?=(엄마 아빠|부모님)[,，])/gi, "")
    .replace(/^\s*(Thinking Process|Analysis|Reasoning)\s*[:：][\s\S]*$/gi, "")
    .replace(/^(결과|본문|카드|문구)\s*[:：]\s*/gim, "")
    .replace(/\s+/g, " ")
    .trim();

  const sentences = cleaned.match(/[^.!?。？！]+[.!?。？！]/g) || [cleaned];
  return sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")
    .trim();
}

function sliceFromLastAddress(value) {
  const candidates = ["엄마 아빠,", "엄마 아빠，", "부모님,", "부모님，"];
  const completionIndex = value.lastIndexOf("내부 처리 완료");
  if (completionIndex >= 0) {
    const afterCompletion = value.slice(completionIndex);
    const completionAddressIndexes = candidates
      .map((candidate) => afterCompletion.indexOf(candidate))
      .filter((index) => index >= 0);
    if (completionAddressIndexes.length) {
      return afterCompletion.slice(Math.min(...completionAddressIndexes));
    }
  }

  const markerIndexes = ["최종 검토", "최종 답변", "문구 작성"]
    .map((marker) => value.lastIndexOf(marker))
    .filter((index) => index >= 0);
  const searchStart = markerIndexes.length ? Math.max(...markerIndexes) : 0;
  const searchArea = value.slice(searchStart);
  const indexes = candidates
    .map((candidate) => searchArea.indexOf(candidate))
    .filter((index) => index >= 0);

  if (indexes.length) return searchArea.slice(Math.min(...indexes));

  const fallbackIndexes = candidates
    .map((candidate) => value.indexOf(candidate))
    .filter((index) => index >= 0);
  if (!fallbackIndexes.length) return value;
  return value.slice(Math.min(...fallbackIndexes));
}
