// css/colors.css에 정의한 색을 JS에서 읽기 (지도 마커·동선처럼 CSS가 닿지 않는 곳용)
// 예: color("pin-must") → "#0b84e5"
export const color = name => getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim();
