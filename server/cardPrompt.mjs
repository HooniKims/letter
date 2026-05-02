import { createHash, randomUUID } from "node:crypto";

const MAX_OUTPUT_CHARS = 180;

export const CARD_INSTRUCTIONS =
  "너는 부모님께 드리는 감사 카드 문구를 쓰는 한국어 작가다. 결과 본문 두 문장만 출력한다. Thinking Process, 분석, 설명, 제목, 번호, 따옴표, 번역, 작성 과정은 절대 쓰지 않는다.";

const PERSONALITY_GUIDES = {
  "활발한": "부모님의 밝은 에너지, 함께 웃게 해주는 모습, 집안 분위기를 환하게 만드는 행동을 떠올려 쓴다.",
  "마음이 따뜻한": "부모님의 포근한 배려, 힘들 때 먼저 알아봐 주는 마음, 말없이 챙겨주는 행동을 담는다.",
  "꼼꼼한": "부모님이 작은 준비물, 일정, 건강, 생활 습관까지 세심하게 챙겨준 구체적인 느낌을 담는다.",
  "아이디어가 많은": "부모님이 문제를 새롭게 해결해 주거나 재미있는 방법을 알려준 모습을 담는다.",
  "똑똑한": "부모님의 지혜로운 조언, 차분한 판단, 내가 배울 수 있었던 생각의 힘을 담는다.",
  "다정한": "부모님의 부드러운 말투, 따뜻한 눈빛, 나를 아껴주는 표현을 담는다.",
  "부지런한": "부모님이 매일 가족을 위해 움직이고 애써 준 시간과 성실함을 담는다.",
  "편안한": "부모님 곁에 있으면 안심되는 느낌, 기대어 쉴 수 있는 분위기, 말없이 든든한 존재감을 담는다."
};

const STYLE_GUIDES = {
  "귀엽게": "통통 튀고 사랑스러운 말투를 쓴다. 짧은 감탄, 말랑한 표현, 살가운 끝맺음을 넣어 귀여움이 바로 느껴지게 한다.",
  "솔직하고 차분하게": "꾸미는 말을 줄이고 담백하게 쓴다. 감정은 과장하지 않고 또박또박 전한다.",
  "재밌게": "부모님이 웃으며 읽을 만한 생활형 농담, 별명 같은 비유, 개그감 있는 말맛을 반드시 넣는다. 장난은 따뜻해야 하고, 감사의 마음은 가볍게 만들지 않는다.",
  "어른스럽게": "존댓말 중심으로 성숙하고 예의 있게 쓴다. 감사의 이유, 존경, 앞으로의 태도가 책임감 있게 이어지게 한다.",
  "감동적으로": "마음이 뭉클해지도록 부모님의 사랑과 시간이 내게 어떤 힘이 되었는지 담는다. 감정은 깊게 쓰되 과장된 신파는 피한다.",
  "멋진 말로": "간결하지만 인상적인 표현을 쓴다. 세련된 비유와 품격 있는 단어로 카드 문구처럼 기억에 남게 만든다."
};

const STYLE_SIGNATURES = {
  "귀엽게": [
    "첫 문장부터 밝고 톡톡 튀는 리듬을 만든다.",
    "포근포근, 방글방글, 폭 안긴다, 마음이 간질간질하다 같은 말랑한 표현을 한 번만 넣는다.",
    "부모님 호칭은 '엄마 아빠' 또는 '부모님' 중 하나를 쓴다.",
    "문장 끝은 자연스러운 '-요'로 쓰고, 느낌표는 최대 한 번만 쓸 수 있다.",
    "금지: 어른스러운 연설문, 무거운 감동문, 추상적인 명언 말투"
  ],
  "솔직하고 차분하게": [
    "비유와 장식을 거의 쓰지 않고, 실제로 말하듯 담백하게 쓴다.",
    "문장 끝은 차분한 '-요'로 정리하고 느낌표를 쓰지 않는다.",
    "감정 단어를 많이 쌓지 말고 고마운 이유를 단정하게 말한다.",
    "금지: 과한 애교, 농담, 웅장한 문장, 시적인 명언 말투"
  ],
  "재밌게": [
    "첫 문장 안에 따뜻한 유머나 재치 있는 비유를 반드시 한 번 넣는다. 웃음 포인트가 없으면 실패다.",
    "부모님을 우리 집 안의 재미있는 역할로 표현한다. 예: 웃음 버튼, 걱정 정리 전문가, 마음 충전기, 잔소리 알람이지만 사랑 충전기",
    "개그는 짧고 선명하게 쓴다. 길게 설명하지 말고 한 번에 읽히는 말맛을 만든다.",
    "두 번째 문장도 평범하게 마무리하지 말고, 감사나 다짐 안에 작은 반전 농담을 넣는다.",
    "부모님을 놀리지 말고, 가족 안에서 웃을 수 있는 표현으로 쓴다.",
    "쓸 수 있는 장치: 살짝 과장하기, 가족 안의 별명 붙이기, 반전 있는 고마움 표현하기",
    "감사 문장이어도 읽는 순간 살짝 웃음이 나야 한다.",
    "금지: 차분한 감사문만 쓰기, 무거운 감동문, 의미 없는 말장난, 그냥 '감사해요'로 끝내기"
  ],
  "어른스럽게": [
    "예의 있는 존댓말과 성숙한 태도가 바로 느껴져야 한다.",
    "존경, 배움, 책임감, 앞으로의 태도 중 하나를 자연스럽게 넣는다.",
    "문장 구조는 안정적으로 쓰고 가벼운 농담이나 애교를 쓰지 않는다.",
    "금지: 귀여운 말투, 과장된 감탄, 장난스러운 비유"
  ],
  "감동적으로": [
    "부모님의 사랑과 시간이 내 마음에 남은 힘을 깊게 표현한다.",
    "한 문장 안에 따뜻한 감각이나 기억을 넣어 뭉클한 장면을 만든다.",
    "눈물 강요처럼 과장하지 말고 진심이 조용히 올라오게 쓴다.",
    "금지: 농담, 가벼운 말장난, 너무 멋부린 명언"
  ],
  "멋진 말로": [
    "짧지만 카드에 적었을 때 인상적인 문장으로 쓴다.",
    "등불, 나침반, 그늘, 별빛, 작은 항구처럼 품격 있는 비유를 한 번만 사용할 수 있다.",
    "단어 선택은 세련되게 하되 중학생이 옮겨 적을 수 있을 만큼 쉽다.",
    "금지: 평범한 생활문, 장난스러운 표현, 과하게 어려운 한자어"
  ]
};

const STYLE_TONE_EXAMPLES = {
  "귀엽게": "톤 예시: 엄마 아빠가 웃어주면 제 마음도 포근포근해져요.",
  "솔직하고 차분하게": "톤 예시: 말로 자주 못 했지만 부모님이 챙겨주신 마음을 알고 있어요.",
  "재밌게": "톤 예시: 엄마 아빠는 우리 집 걱정 정리 전문가라 제 고민도 줄 서자마자 퇴근해요.",
  "어른스럽게": "톤 예시: 부모님의 성실한 모습을 보며 책임감을 배웠습니다.",
  "감동적으로": "톤 예시: 부모님이 건네준 따뜻한 마음이 힘든 날마다 제 버팀목이 되었어요.",
  "멋진 말로": "톤 예시: 부모님은 제 하루를 밝혀주는 가장 든든한 등불입니다."
};

const MESSAGE_GUIDES = {
  "건강과 평안 기원": "부모님이 몸과 마음 모두 편안하기를 바라는 마음을 중심에 둔다.",
  "키워주신 은혜 감사": "나를 길러준 시간, 정성, 사랑에 대한 감사가 중심이 되게 한다.",
  "효도하겠다는 다짐": "앞으로 말과 행동으로 더 잘하겠다는 구체적인 다짐을 담는다.",
  "여유와 휴식 권유": "부모님이 잠시 쉬고 자신을 돌보았으면 하는 바람을 담는다.",
  "행복한 추억 회고": "함께했던 따뜻한 기억, 웃었던 순간, 즐거웠던 추억 중 하나를 반드시 담는다.",
  "부모님의 삶 응원": "부모님도 자신의 하루와 꿈을 소중히 여기길 응원하는 마음을 담는다."
};

export function buildCardPrompt(input) {
  const variation = buildVariationGuide(input);

  return [
    "부모님께 직접 드리는 감사 카드 문구를 한국어 두 문장으로만 써.",
    `Step 1 부모님 성향: ${input.personality} - ${getGuide(PERSONALITY_GUIDES, input.personality)}`,
    `Step 2 편지 말투: ${input.style} - ${getGuide(STYLE_GUIDES, input.style)}`,
    `Step 3 전하고 싶은 진심: ${input.message} - ${getGuide(MESSAGE_GUIDES, input.message)}`,
    `문체 기준: ${getStyleToneExample(input.style)}`,
    `표현 힌트: ${variation.device}, ${variation.closing}`,
    "",
    "규칙:",
    "1. 두 문장만 출력한다. 제목, 설명, 분석, 영어, JSON, Thinking Process는 쓰지 않는다.",
    "2. 첫 문장은 부모님을 직접 부르는 호칭으로 시작한다. 호칭은 부모님 또는 엄마 아빠 중 하나만 고른다.",
    "3. 부모님께 직접 말하는 1인칭 존댓말 편지체로 쓴다.",
    "4. 두 문장 모두 '-요.', '-게요.', '-께요.', '-습니다.' 중 하나로 끝낸다.",
    "5. 학번, 선택지 이름, '너', '네', '당신'은 쓰지 않는다.",
    "6. 한국어 띄어쓰기를 정확히 지킨다.",
    "7. 설명문 어미인 '한다', '된다', '살겠다', '물들인다', '존재다'로 끝내지 않는다.",
    "8. Step 2 말투가 가장 분명하게 느껴져야 한다."
  ].join("\n");
}

function getGuide(guides, key) {
  return guides[key] || "선택한 단어의 느낌이 구체적인 행동과 분위기로 드러나게 쓴다.";
}

function getStyleSignature(style) {
  return STYLE_SIGNATURES[style] || [
    "선택한 말투가 단어 선택, 문장 리듬, 끝맺음에서 분명히 드러나게 쓴다."
  ];
}

function getStyleToneExample(style) {
  return STYLE_TONE_EXAMPLES[style] || "톤 예시: 고른 말투가 단어와 리듬에서 바로 느껴져야 한다.";
}

export function normalizeTwoSentences(content, input) {
  const cleaned = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^(결과|본문|카드|문구|답변)\s*[:：-]\s*/gim, "")
    .replace(/[“”"]/g, "")
    .replace(/[^.!?。！？]*시작한다[,，]\s*/g, "")
    .replace(/[^.!?。！？]*끝낸다[,，]\s*/g, "")
    .replace(/문장\s*리듬[^.!?。！？]*[.!?。！？]?/g, "")
    .replace(/변주\s*코드[^.!?。！？]*[.!?。！？]?/g, "")
    .replace(/요요/g, "요")
    .replace(/당신들/g, "부모님")
    .replace(/당신/g, "부모님")
    .replace(/네 모습/g, "부모님의 모습")
    .replace(/너의/g, "부모님의")
    .replace(/\s+/g, " ")
    .trim();

  const sentences = (cleaned.match(/[^.!?。！？\n]+[.!?。！？]/g) || [cleaned])
    .map((sentence) => sentence.trim())
    .filter(isCardSentence);
  const selected = [0, 1].map((index) => {
    const candidate = sentences[index]
      ? polishDirectLetterSentence(sentences[index], input, index)
      : "";

    if (
      isPolishedCardSentence(candidate)
      && matchesRequiredStyle(candidate, input.style)
      && matchesRequiredContext(candidate, input, index)
    ) {
      return candidate;
    }

    const fallback = index === 0
      ? buildFallbackOpeningSentence(input)
      : buildFallbackSecondSentence(input);
    return polishDirectLetterSentence(fallback, input, index);
  });

  return cleanAwkwardCombinations(selected
    .join(" ")
    .trim())
    .slice(0, MAX_OUTPUT_CHARS)
    .trim();
}

function cleanAwkwardCombinations(text) {
  return text
    .replace(/드릴게요고/g, "드리겠다고")
    .replace(/할게요고/g, "하겠다고")
    .replace(/게요고/g, "겠다고")
    .replace(/요고/g, "고");
}

function buildVariationGuide(input) {
  const seed = `${input.studentInfo}|${input.personality}|${input.style}|${input.message}|${randomUUID()}`;
  const hash = createHash("sha256").update(seed).digest();

  return {
    opening: pick(hash[0], [
      "작은 고마움",
      "일상의 배려",
      "든든했던 순간",
      "말하지 못한 마음",
      "구체적인 장면"
    ]),
    device: pick(hash[1], [
      "구체적인 행동",
      "짧은 감각 표현",
      "일상 장면",
      "마음의 변화",
      "직접 말하는 느낌"
    ]),
    closing: pick(hash[2], [
      "더 자주 표현하기",
      "건강과 평안 바람",
      "꼭 전하고 싶은 한마디",
      "작은 약속",
      "부모님 웃음 바람"
    ]),
    rhythm: pick(hash[3], [
      "첫 문장은 담백하게, 두 번째 문장은 따뜻하게",
      "첫 문장은 구체적으로, 두 번째 문장은 다짐으로",
      "첫 문장은 짧게, 두 번째 문장은 조금 더 부드럽게",
      "두 문장 모두 학생다운 말투로 간결하게",
      "감정은 과장하지 말고 진심이 느껴지게"
    ]),
    code: hash.subarray(0, 4).toString("hex")
  };
}

function buildFallbackSecondSentence(input) {
  const seed = `${input.studentInfo}|${input.personality}|${input.style}|${input.message}|fallback|${randomUUID()}`;
  const hash = createHash("sha256").update(seed).digest();

  return pick(hash[0], getFallbackSecondOptions(input));
}

function getFallbackSecondOptions(input) {
  if (input.style === "재밌게") {
    const message = getFunnyMessageSentence(input.message);
    return [
      `엄마 아빠, ${message}`,
      `엄마 아빠, ${message}`,
      `엄마 아빠, ${message}`,
      `엄마 아빠, ${message}`
    ];
  }

  if (input.style === "귀엽게") {
    const message = getCuteMessageSentence(input.message);
    return [
      `엄마 아빠, ${message}`,
      `엄마 아빠, ${message}`,
      `엄마 아빠, ${message}`,
      `엄마 아빠, ${message}`
    ];
  }

  if (input.style === "솔직하고 차분하게") {
    const message = getCalmMessageSentence(input.message);
    return [
      `부모님, ${message}`,
      `부모님, ${message}`,
      `부모님, ${message}`,
      `부모님, ${message}`
    ];
  }

  if (input.style === "어른스럽게") {
    const message = getMatureMessageSentence(input.message);
    return [
      `부모님, ${message}`,
      `부모님, ${message}`,
      `부모님, ${message}`,
      `부모님, ${message}`
    ];
  }

  if (input.style === "감동적으로") {
    const message = getTouchingMessageSentence(input.message);
    return [
      `부모님, ${message}`,
      `부모님, ${message}`,
      `부모님, ${message}`,
      `부모님, ${message}`
    ];
  }

  if (input.style === "멋진 말로") {
    const message = getElegantMessageSentence(input.message);
    return [
      `부모님, ${message}`,
      `부모님, ${message}`,
      `부모님, ${message}`,
      `부모님, ${message}`
    ];
  }

  const message = getGeneralMessageSentence(input.message);
  return [
    `부모님, ${message}`,
    `부모님, ${message}`,
    `부모님, ${message}`,
    `부모님, ${message}`
  ];
}

function buildFallbackOpeningSentence(input) {
  const seed = `${input.studentInfo}|${input.personality}|${input.style}|${input.message}|opening|${randomUUID()}`;
  const hash = createHash("sha256").update(seed).digest();

  return pick(hash[0], getFallbackOpeningOptions(input));
}

function getFallbackOpeningOptions(input) {
  if (input.style === "재밌게") {
    const phrase = getFunnyPersonalityPhrase(input.personality);
    const rolePhrase = withRoleParticle(phrase);
    return [
      `엄마 아빠, 부모님은 우리 집 ${rolePhrase} 제 마음을 금방 웃게 해 주세요.`,
      `엄마 아빠, 부모님은 우리 집 ${rolePhrase} 제 하루를 웃음으로 충전해 주세요.`,
      `엄마 아빠, 부모님은 우리 집 ${rolePhrase} 힘든 날도 금방 밝아져요.`,
      `엄마 아빠, 부모님은 우리 집 ${rolePhrase} 제 걱정도 금방 정리돼요.`
    ];
  }

  if (input.style === "귀엽게") {
    const phrase = getCutePersonalityPhrase(input.personality);
    return [
      `엄마 아빠, ${phrase} 덕분에 제 마음이 포근포근해져요.`,
      `엄마 아빠, ${phrase}는 제 하루를 방글방글하게 해 줘요.`,
      `엄마 아빠, ${phrase} 덕분에 저는 오늘도 씩씩해요.`,
      `엄마 아빠, ${phrase}가 제 마음을 폭 안아 주는 것 같아요.`
    ];
  }

  if (input.style === "솔직하고 차분하게") {
    const phrase = getCalmPersonalityPhrase(input.personality);
    return [
      `부모님, ${phrase} 덕분에 제가 편안하게 지낼 수 있었어요.`,
      `부모님, ${phrase}을 알고 있어서 늘 고마웠어요.`,
      `부모님, ${phrase}을 떠올리면 제 마음이 차분히 놓여요.`,
      `부모님, ${phrase}이 제 하루를 든든하게 해 주었어요.`
    ];
  }

  if (input.style === "어른스럽게") {
    const phrase = getMaturePersonalityPhrase(input.personality);
    return [
      `부모님, ${phrase}을 보며 책임감과 사랑을 배웠습니다.`,
      `부모님, ${phrase}에 깊이 감사드리며 더 바르게 성장하겠습니다.`,
      `부모님, ${phrase}은 제가 존경하는 삶의 태도입니다.`,
      `부모님, ${phrase}을 마음에 새기며 보답하는 사람이 되겠습니다.`
    ];
  }

  if (input.style === "감동적으로") {
    const phrase = getTouchingPersonalityPhrase(input.personality);
    return [
      `부모님, ${phrase}는 힘든 날마다 제 마음의 버팀목이 되어 주었어요.`,
      `부모님, ${phrase}가 제 가슴에 오래 남아 큰 힘이 되었어요.`,
      `부모님, ${phrase}를 떠올리면 마음 깊이 고마움이 차올라요.`,
      `부모님, ${phrase} 덕분에 저는 사랑받는 사람이라는 걸 느껴요.`
    ];
  }

  if (input.style === "멋진 말로") {
    const phrase = getElegantPersonalityPhrase(input.personality);
    return [
      `부모님, ${phrase}는 제 하루를 비추는 든든한 등불입니다.`,
      `부모님, ${phrase}는 제가 바른 길로 걷게 하는 나침반입니다.`,
      `부모님, ${phrase}는 제 삶을 더 깊고 귀하게 채워 줍니다.`,
      `부모님, ${phrase}는 제 마음에 오래 빛나는 별빛입니다.`
    ];
  }

  const phrase = getGeneralPersonalityPhrase(input.personality);
  return [
    `부모님, ${phrase} 덕분에 늘 고마운 마음이 큽니다.`,
    `부모님, ${phrase}을 보며 제가 많은 것을 배웠습니다.`,
    `부모님, ${phrase}이 제 하루를 든든하게 지켜 주었습니다.`,
    `부모님, ${phrase}을 생각하면 말로 다 못 할 만큼 감사합니다.`
  ];
}

function isCardSentence(sentence) {
  const metaPatterns = [
    /시작한다[.!?。！？]?$/,
    /끝낸다[.!?。！？]?$/,
    /문장\s*리듬/,
    /변주\s*지시/,
    /변주\s*코드/,
    /감사\s*초점/,
    /출력하지/,
    /반영하되/,
    /시작하자면/,
    /(물들인다|살겠다|존재다|한다|된다)[.!?。！？]?$/
  ];

  return !metaPatterns.some((pattern) => pattern.test(sentence));
}

function polishDirectLetterSentence(sentence, input, index) {
  let polished = sentence
    .replace(/[.!?。！？]+$/g, "")
    .replace(/하겠습니다요/g, "하겠습니다")
    .replace(/습니다요/g, "습니다")
    .replace(/니다요/g, "니다")
    .replace(/니다게요/g, "니다")
    .replace(/배려이/g, "배려가")
    .replace(/(드립니다|바랍니다|합니다|입니다|됩니다)(?:요|게요)/g, "$1")
    .replace(/게요는\s*다짐/g, "겠다는 다짐")
    .replace(/요는\s*다짐/g, "겠다는 다짐")
    .replace(/드릴게요고/g, "드리겠다고")
    .replace(/할게요고/g, "하겠다고")
    .replace(/게요고/g, "겠다고")
    .replace(/요고/g, "고")
    .replace(/^다정한\s*오후,\s*/g, "")
    .replace(/^작은\s*고마움으로\s*시작하자면,\s*/g, "")
    .replace(/오늘도\s*집안을\s*따뜻하게\s*물들인다/g, "오늘도 제 마음을 따뜻하게 해 주세요")
    .replace(/매일\s*더\s*열심히\s*살겠다/g, "매일 더 열심히 지낼게요")
    .replace(/같은\s*존재다/g, "같은 분들이세요")
    .replace(/보답하겠다/g, "보답할게요")
    .replace(/다짐한다/g, "다짐할게요")
    .replace(/하겠다(?!고)/g, "할게요")
    .replace(/살겠다(?!고)/g, "지낼게요")
    .replace(/물들인다/g, "따뜻하게 해 주세요")
    .replace(/존재다/g, "분들이세요")
    .replace(/더\s*잘\s*살겠습니다/g, "더 잘하겠습니다")
    .replace(/잘\s*살겠습니다/g, "잘 지내겠습니다")
    .replace(/얻고\s*살고\s*있습니다/g, "얻고 있어요")
    .replace(/살고\s*있습니다/g, "지내고 있어요")
    .trim();

  if (!/^(부모님|엄마\s*아빠)[,，]/.test(polished)) {
    const address = input.style === "귀엽게" || input.style === "재밌게" ? "엄마 아빠" : "부모님";
    polished = `${address}, ${polished}`;
  }

  if (!/(요|게요|께요|습니다|니다|세요|드립니다|바랍니다|합니다)$/.test(polished)) {
    polished += index === 0 ? "요" : "게요";
  }

  return `${polished}.`;
}

function isPolishedCardSentence(sentence) {
  const hasPoliteEnding = /(요|게요|께요|습니다|니다|세요|드립니다|바랍니다|합니다|입니다|됩니다)\.$/.test(sentence);
  const hasAwkwardEnding = /(드립니다요|드립니다게요|바랍니다요|바랍니다게요|합니다요|합니다게요|입니다요|입니다게요|됩니다요|됩니다게요|니다요|니다게요|요요|게요요|습니다요|하겠습니다요|요는|게요는|요고|게요고|물들인다|살겠다|존재다|시작하자면|변주\s*코드|미처요|배려이)/.test(sentence);

  return hasPoliteEnding && !hasAwkwardEnding;
}

function matchesRequiredStyle(sentence, style) {
  const markers = REQUIRED_STYLE_MARKERS[style];
  if (!markers) return true;
  return markers.some((marker) => sentence.includes(marker));
}

function matchesRequiredContext(sentence, input, index) {
  if (index === 1 && input.message === "여유와 휴식 권유" && /(제가|저는)[^.?!。！？]*(쉬고 싶|휴식하고 싶|여유를 가지고 쉬)/.test(sentence)) {
    return false;
  }

  const markers = index === 0
    ? REQUIRED_PERSONALITY_MARKERS[input.personality]
    : REQUIRED_MESSAGE_MARKERS[input.message];

  if (!markers) return true;
  return markers.some((marker) => sentence.includes(marker));
}

function pick(index, values) {
  return values[index % values.length];
}

function withRoleParticle(phrase) {
  return `${phrase}${hasFinalConsonant(phrase) ? "이라" : "라"}`;
}

function hasFinalConsonant(value) {
  const match = String(value).match(/[가-힣](?!.*[가-힣])/);
  if (!match) return false;

  const code = match[0].charCodeAt(0);
  return (code - 0xac00) % 28 !== 0;
}

const REQUIRED_STYLE_MARKERS = {
  "귀엽게": ["포근", "방글", "말랑", "귀엽", "폭", "씩씩", "웃어"],
  "솔직하고 차분하게": ["알고", "차분", "진심", "고마", "편안", "조용히", "마음", "바라", "기억"],
  "재밌게": ["웃음", "충전기", "충전소", "전문가", "알람", "버튼", "농담", "반전", "개그", "정리", "효도 담당", "해결사", "저장소", "자동", "앨범", "모드"],
  "어른스럽게": ["존경", "책임", "배웠", "성장", "감사드", "다짐", "약속", "보답", "삶의 태도", "바르게"],
  "감동적으로": ["버팀목", "마음 깊이", "가슴", "오래", "사랑받", "따뜻", "소중", "힘", "고마움"],
  "멋진 말로": ["등불", "나침반", "별빛", "빛", "길", "삶", "귀하게", "채워", "깊고", "소망"]
};

const REQUIRED_PERSONALITY_MARKERS = {
  "활발한": ["밝", "웃", "에너지", "환", "힘"],
  "마음이 따뜻한": ["따뜻", "포근", "배려", "챙겨", "마음"],
  "꼼꼼한": ["세심", "꼼꼼", "챙겨", "챙기", "준비", "살펴", "작은 부분", "작은 일", "책임감"],
  "아이디어가 많은": ["생각", "해결", "방법", "아이디어", "새로운", "길을 열어", "길", "찾아"],
  "똑똑한": ["지혜", "조언", "현명", "생각", "배웠"],
  "다정한": ["다정", "부드러운", "따뜻한", "눈빛", "말"],
  "부지런한": ["부지런", "매일", "성실", "애써", "움직"],
  "편안한": ["편안", "안심", "쉬", "든든", "기대"]
};

const REQUIRED_MESSAGE_MARKERS = {
  "건강과 평안 기원": ["건강", "평안", "편안", "행복"],
  "키워주신 은혜 감사": ["키워", "길러", "자라", "은혜", "사랑", "정성"],
  "효도하겠다는 다짐": ["효도", "보답", "잘할", "드릴게요", "다짐"],
  "여유와 휴식 권유": ["쉬", "여유", "돌보", "편안", "휴식"],
  "행복한 추억 회고": ["추억", "기억", "함께", "시간", "웃"],
  "부모님의 삶 응원": ["응원", "하루", "꿈", "삶", "행복"]
};

function getCutePersonalityPhrase(personality) {
  return ({
    "활발한": "부모님의 밝은 에너지",
    "마음이 따뜻한": "부모님의 따뜻한 마음",
    "꼼꼼한": "부모님의 세심한 챙김",
    "아이디어가 많은": "부모님의 새로운 생각",
    "똑똑한": "부모님의 지혜로운 조언",
    "다정한": "부모님의 다정한 말",
    "부지런한": "부모님의 매일 애쓰는 모습",
    "편안한": "부모님의 편안한 품"
  })[personality] || "부모님의 따뜻한 마음";
}

function getFunnyPersonalityPhrase(personality) {
  return ({
    "활발한": "밝은 에너지 버튼",
    "마음이 따뜻한": "따뜻한 마음 충전기",
    "꼼꼼한": "세심한 걱정 정리 전문가",
    "아이디어가 많은": "새로운 생각 해결사",
    "똑똑한": "지혜로운 고민 해결 전문가",
    "다정한": "다정한 사랑 알람",
    "부지런한": "매일 애쓰는 에너지 충전소",
    "편안한": "편안한 마음 충전기"
  })[personality] || "마음 충전기";
}

function getGeneralPersonalityPhrase(personality) {
  return ({
    "활발한": "밝은 에너지와 웃음",
    "마음이 따뜻한": "따뜻한 마음과 배려",
    "꼼꼼한": "세심하게 챙겨 주시는 모습",
    "아이디어가 많은": "새로운 생각으로 해결해 주시는 모습",
    "똑똑한": "지혜로운 조언과 현명한 생각",
    "다정한": "다정한 말과 따뜻한 눈빛",
    "부지런한": "매일 성실하게 애써 주시는 모습",
    "편안한": "편안하고 든든하게 기대게 해 주시는 마음"
  })[personality] || "따뜻한 마음";
}

function getCalmPersonalityPhrase(personality) {
  return ({
    "활발한": "밝게 웃어 주시는 모습",
    "마음이 따뜻한": "말없이 챙겨 주신 따뜻한 마음",
    "꼼꼼한": "작은 일까지 세심하게 살펴 주신 마음",
    "아이디어가 많은": "새로운 방법을 함께 찾아 주신 모습",
    "똑똑한": "차분하고 지혜롭게 알려 주신 말",
    "다정한": "저를 아껴 주신 다정한 말",
    "부지런한": "매일 성실하게 애쓰신 모습",
    "편안한": "곁에 있으면 마음이 놓이는 든든함"
  })[personality] || "저를 챙겨 주신 마음";
}

function getMaturePersonalityPhrase(personality) {
  return ({
    "활발한": "밝은 태도로 가족에게 힘을 주시는 모습",
    "마음이 따뜻한": "따뜻한 배려로 가족을 살피시는 마음",
    "꼼꼼한": "작은 부분까지 책임감 있게 챙기시는 모습",
    "아이디어가 많은": "새로운 생각으로 길을 찾아 주시는 지혜",
    "똑똑한": "현명한 판단과 깊은 조언",
    "다정한": "다정한 말과 품격 있는 사랑",
    "부지런한": "성실하게 하루를 쌓아 가시는 태도",
    "편안한": "언제나 기대어 쉴 수 있는 든든한 울타리"
  })[personality] || "가족을 위해 애쓰시는 태도";
}

function getTouchingPersonalityPhrase(personality) {
  return ({
    "활발한": "밝은 웃음과 따뜻한 에너지",
    "마음이 따뜻한": "조용히 건네 주신 따뜻한 사랑",
    "꼼꼼한": "작은 순간까지 챙겨 주신 보살핌",
    "아이디어가 많은": "힘들 때 길을 열어 주신 마음",
    "똑똑한": "흔들릴 때 붙잡아 주신 지혜로운 말",
    "다정한": "따뜻한 눈빛과 다정한 말",
    "부지런한": "매일 저를 위해 애쓰신 시간",
    "편안한": "말없이 기대게 해 주신 품"
  })[personality] || "저를 사랑으로 감싸 주신 마음";
}

function getElegantPersonalityPhrase(personality) {
  return ({
    "활발한": "밝은 에너지",
    "마음이 따뜻한": "따뜻한 배려",
    "꼼꼼한": "세심한 손길",
    "아이디어가 많은": "새로운 시각",
    "똑똑한": "지혜로운 조언",
    "다정한": "다정한 눈빛",
    "부지런한": "성실한 발걸음",
    "편안한": "편안한 품"
  })[personality] || "따뜻한 사랑";
}

function getCuteMessageSentence(message) {
  return ({
    "건강과 평안 기원": "오래오래 건강하고 편안하게 웃어 주시면 제 마음도 방글방글해져요.",
    "키워주신 은혜 감사": "저를 사랑으로 키워 주신 은혜가 제 마음에 포근포근 남아 있어요.",
    "효도하겠다는 다짐": "제가 받은 사랑만큼 귀엽고 든든하게 효도할게요.",
    "여유와 휴식 권유": "오늘은 잠깐 쉬면서 마음까지 포근포근 편안해지셨으면 좋겠어요.",
    "행복한 추억 회고": "함께 웃었던 추억이 떠오를 때마다 제 마음이 방글방글해져요.",
    "부모님의 삶 응원": "부모님의 하루와 꿈도 반짝반짝 행복하길 제가 귀엽게 응원할게요."
  })[message] || "제 고마운 마음이 포근포근하게 전해졌으면 좋겠어요.";
}

function getFunnyMessageSentence(message) {
  return ({
    "건강과 평안 기원": "건강과 평안을 매일 충전하시도록 제가 웃음 버튼을 자주 눌러 드릴게요.",
    "키워주신 은혜 감사": "저를 키워 주신 은혜는 제 마음 저장소에 평생 자동 저장돼 있어요.",
    "효도하겠다는 다짐": "앞으로는 제가 웃음 버튼을 더 자주 눌러 드리는 효도 담당이 될게요.",
    "여유와 휴식 권유": "오늘은 걱정 정리 모드를 끄고 쉬는 모드를 켜셨으면 좋겠어요.",
    "행복한 추억 회고": "함께 웃었던 추억은 제 마음 앨범에서 늘 자동 재생돼요.",
    "부모님의 삶 응원": "부모님의 하루와 꿈도 제가 옆에서 응원 버튼을 꾹 눌러 드릴게요."
  })[message] || "제가 웃음 버튼을 자주 눌러 드리는 효도 담당이 될게요.";
}

function getCalmMessageSentence(message) {
  return ({
    "건강과 평안 기원": "건강하고 편안하게 지내시기를 진심으로 바라요.",
    "키워주신 은혜 감사": "말로 자주 못 했지만 키워 주신 은혜를 늘 기억하고 있어요.",
    "효도하겠다는 다짐": "앞으로 말보다 행동으로 더 잘하고 보답할게요.",
    "여유와 휴식 권유": "오늘만큼은 잠시 쉬시고 부모님의 마음도 편안했으면 좋겠어요.",
    "행복한 추억 회고": "함께 웃었던 시간을 조용히 떠올리면 지금도 참 고마워요.",
    "부모님의 삶 응원": "부모님의 하루와 꿈을 차분한 마음으로 응원할게요."
  })[message] || "제 진심이 차분하게 전해졌으면 좋겠어요.";
}

function getMatureMessageSentence(message) {
  return ({
    "건강과 평안 기원": "부모님의 건강과 평안을 위해 늘 마음 다해 기도하겠습니다.",
    "키워주신 은혜 감사": "저를 키워 주신 은혜를 잊지 않고 책임 있는 모습으로 보답하겠습니다.",
    "효도하겠다는 다짐": "앞으로 말과 행동으로 더 잘하며 부모님께 보답하겠다고 다짐합니다.",
    "여유와 휴식 권유": "이제는 부모님께서도 잠시 쉬시며 스스로의 마음을 돌보셨으면 좋겠습니다.",
    "행복한 추억 회고": "함께 웃었던 소중한 시간을 기억하며 더 바르게 성장하겠습니다.",
    "부모님의 삶 응원": "부모님의 하루와 꿈을 존경하는 마음으로 응원하겠습니다."
  })[message] || "받은 사랑을 잊지 않고 성숙한 모습으로 보답하겠습니다.";
}

function getTouchingMessageSentence(message) {
  return ({
    "건강과 평안 기원": "부모님이 오래도록 건강하고 평안하시기를 마음 깊이 바라요.",
    "키워주신 은혜 감사": "저를 키워 주신 사랑과 정성이 제 마음에 오래 남아 있어요.",
    "효도하겠다는 다짐": "받은 사랑이 헛되지 않도록 더 자주 표현하고 보답할게요.",
    "여유와 휴식 권유": "오늘은 잠시 짐을 내려놓고 부모님의 마음도 따뜻하게 쉬었으면 좋겠어요.",
    "행복한 추억 회고": "함께 웃었던 기억은 힘든 날마다 저를 다시 일으키는 힘이 되었어요.",
    "부모님의 삶 응원": "부모님의 하루와 꿈이 더 따뜻하게 빛나기를 마음 깊이 응원할게요."
  })[message] || "제 고마움이 부모님 마음에 따뜻하게 닿았으면 좋겠어요.";
}

function getElegantMessageSentence(message) {
  return ({
    "건강과 평안 기원": "부모님의 건강과 평안이 오래도록 환한 빛처럼 머물기를 바랍니다.",
    "키워주신 은혜 감사": "저를 키워 주신 은혜는 제 삶을 채워 준 가장 귀한 선물입니다.",
    "효도하겠다는 다짐": "받은 사랑을 제 삶의 길 위에서 당당히 보답하겠습니다.",
    "여유와 휴식 권유": "오늘은 부모님의 마음에도 고요한 쉼과 밝은 여유가 머물기를 바랍니다.",
    "행복한 추억 회고": "함께 웃었던 추억은 제 마음에 오래 빛나는 별빛입니다.",
    "부모님의 삶 응원": "부모님의 하루와 꿈이 더 넓은 가능성으로 빛나기를 응원하겠습니다."
  })[message] || "제 진심이 부모님께 오래 남는 고백이 되기를 바랍니다.";
}

function getGeneralMessageSentence(message) {
  return ({
    "건강과 평안 기원": "항상 건강하고 평안하게 지내시기를 진심으로 바랍니다.",
    "키워주신 은혜 감사": "저를 사랑과 정성으로 키워 주신 은혜에 깊이 감사드립니다.",
    "효도하겠다는 다짐": "앞으로 말과 행동으로 더 잘하고 효도하겠다고 다짐합니다.",
    "여유와 휴식 권유": "오늘만큼은 잠시 쉬시며 부모님의 마음도 돌보셨으면 좋겠습니다.",
    "행복한 추억 회고": "함께 웃었던 따뜻한 추억을 오래오래 기억하겠습니다.",
    "부모님의 삶 응원": "부모님의 하루와 꿈을 제가 진심으로 응원하겠습니다."
  })[message] || "제 진심이 부모님께 따뜻하게 닿기를 바랍니다.";
}
