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

// Day d의 날짜 (시작일이 없으면 null)
export const dayDate = (c, d) => {
  if (!c || !c.start) return null;
  const t = new Date(c.start + "T00:00:00");
  t.setDate(t.getDate() + d - 1);
  return t;
};
export const dayLabel = (c, d) => {
  const t = dayDate(c, d);
  return t ? t.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", weekday: "short" }) : "";
};

// 오늘이 여행 중이면 몇 번째 Day인지 (아니면 0)
export const todayDay = c => {
  const s = dayDate(c, 1);
  if (!s) return 0;
  const n = new Date(); n.setHours(0, 0, 0, 0);
  const d = Math.round((n - s) / 864e5) + 1;
  return d >= 1 && d <= c.nd ? d : 0;
};

export const isPhone = () => matchMedia("(max-width:760px)").matches;

// 밀리초 → "1시간 5분"
export const fmtT = ms => {
  const m = Math.max(1, Math.round(ms / 60000));
  return m >= 60 ? Math.floor(m / 60) + "시간 " + (m % 60) + "분" : m + "분";
};
