// 카테고리 아이콘 (Lucide 스타일 선 아이콘) · 카테고리 색 변수
// 색은 css/colors.css의 --cat-* 값

export const CK = { 관광: "sight", 식사: "food", 숙소: "stay", 교통: "move", 쇼핑: "shop", 기타: "etc" };

const ICON = {
  관광: '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2l8 5H4z"/><path d="M4 18h16"/>',
  식사: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  숙소: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  교통: '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/>',
  쇼핑: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  기타: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
};

// 아이콘 SVG
export const ic = (c, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[c] || ICON.기타}</svg>`;

// style="--c:..." 에 넣을 카테고리 색
export const cv = c => `--c:var(--cat-${CK[c] || "etc"})`;

// 구글 장소 types → 카테고리 추측
const TYPE_CAT = [
  [/restaurant|cafe|bakery|bar|food|meal/, "식사"],
  [/lodging|hotel|hostel|motel|resort/, "숙소"],
  [/station|airport|transit|bus|subway|train|ferry/, "교통"],
  [/store|shop|mall|market/, "쇼핑"],
];
export const guessCat = types => {
  const t = (types || []).join(" ");
  for (const [re, c] of TYPE_CAT) if (re.test(t)) return c;
  return "관광";
};
