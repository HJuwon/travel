// 작은 도우미 함수들

export const $ = s => document.querySelector(s);

// HTML 이스케이프
export const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// 숫자 → "1,234"
export const won = n => Math.round(n).toLocaleString("ko-KR");

// 좌표가 있는 장소인지
export const hasXY = r => typeof r.la == "number" && typeof r.lo == "number";

// 구글맵 검색 링크
export const gq = r => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(r.p) + (r.id ? "&query_place_id=" + r.id : "");

// 두 좌표 사이 직선거리(km)
export const hav = (a, b) => {
  const t = x => x * Math.PI / 180;
  const p = Math.sin(t(b.lat - a.lat) / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(t(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(p));
};

// 밀리초 → "1시간 5분"
export const fmtT = ms => {
  const m = Math.max(1, Math.round(ms / 60000));
  return m >= 60 ? Math.floor(m / 60) + "시간 " + (m % 60) + "분" : m + "분";
};
