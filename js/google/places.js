// 장소 추가 · 영업시간/웹사이트/카테고리/가격대/결제/예약/소개 자동 채우기 (Places API)
import { G } from "./gm.js";
import { panTo } from "./map.js";
import { UI, cur } from "../state.js";
import { guessCat } from "../icons.js";
import { render } from "../render.js";
import { toast } from "../utils.js";
import { curOf } from "../fx.js";

// d = 0 이면 보관함, 1 이상이면 그 Day에 추가
// open = false 면 상세 패널을 열지 않고 지도도 그대로 (지도에서 연달아 추가할 때)
export async function addPlace(p, d = 0, open = true) {
  const c = cur();
  if (!c) return;
  await p.fetchFields({ fields: ["displayName", "location", "formattedAddress", "types"] });
  const o = { p: p.displayName, id: p.id, la: p.location.lat(), lo: p.location.lng(), c: guessCat(p.types), m: "", w: 0 };
  if (d) { o.d = d; o.s = "필수"; c.rows.push(o); } else c.wish.push(o);
  if (open) UI.open = { o };
  render();
  if (open) panTo(o);
  autofill(p, o);
}

// 구글 영업시간 → "월~금 09:00~18:00" 형태 + 브레이크타임 추출
export function fmtHours(h) {
  if (!h) return null;
  const P = h.periods;
  if (!P || !P.length) {
    const w = h.weekdayDescriptions;
    return w && w.length ? { text: w.join("\n"), brk: "" } : null;
  }
  const L = "일월화수목금토", ord = [1, 2, 3, 4, 5, 6, 0], by = [[], [], [], [], [], [], []];
  const t = o => String(o.hour).padStart(2, "0") + ":" + String(o.minute).padStart(2, "0");
  P.forEach(q => {
    if (!q.close) { for (let d = 0; d < 7; d++) by[d].push("24시간"); return; }
    by[q.open.day].push(t(q.open) + "~" + t(q.close));
  });
  by.forEach(a => a.sort());

  // 같은 시간대인 요일끼리 묶기
  const g = {};
  ord.forEach((d, k) => { const key = by[d].join(", ") || "휴무"; (g[key] = g[key] || []).push(k); });
  const lab = ks => {
    const o = [];
    let i = 0;
    while (i < ks.length) {
      let j = i;
      while (j + 1 < ks.length && ks[j + 1] == ks[j] + 1) j++;
      if (j - i >= 2) o.push(L[ord[ks[i]]] + "~" + L[ord[ks[j]]]);
      else for (let m = i; m <= j; m++) o.push(L[ord[ks[m]]]);
      i = j + 1;
    }
    return o.join("·");
  };
  const text = Object.keys(g).map(k => lab(g[k]) + " " + k).join("\n");

  // 하루 중 영업 사이 빈 시간 = 브레이크타임
  const gaps = new Set();
  by.forEach(a => {
    for (let k = 0; k + 1 < a.length; k++) {
      const e = a[k].split("~")[1], b = a[k + 1].split("~")[0];
      if (e && b && e < b) gaps.add(e + "~" + b);
    }
  });
  return { text, brk: [...gaps].join(", ") };
}

export function applyHours(r, h) {
  const f = fmtHours(h);
  if (!f) return false;
  r.hrs = f.text;
  if (f.brk) r.brk = f.brk;
  return true;
}

// ----- 영업시간 말고 구글이 주는 정보: 가격대 · 결제 수단 · 예약 · 한 줄 소개 -----
//   (구글에 정보가 없는 곳은 비어 있어요. 장소 상세 패널에서 직접 고칠 수 있어요)
export const MORE = ["priceRange", "paymentOptions", "isReservable", "editorialSummary"];

// 가격대 PriceRange → "€10~20" (대부분 식당·카페만 있음)
function fmtPrice(pr) {
  if (!pr) return "";
  const s = pr.startPrice, e = pr.endPrice, m = s || e;
  if (!m) return "";
  const sym = (curOf(m.currencyCode) || [0, m.currencyCode + " "])[1];
  const n = x => x && x.units != null ? Number(x.units).toLocaleString("ko-KR") : "";
  return s && e ? sym + n(s) + "~" + n(e) : s ? sym + n(s) + " 이상" : sym + n(e) + " 이하";
}

// 결제 수단 PaymentOptions → "현금만" / "카드 가능 · 모바일 결제"
function fmtPay(o) {
  if (!o) return "";
  if (o.acceptsCashOnly) return "현금만 받아요";
  const x = [];
  if (o.acceptsCreditCards || o.acceptsDebitCards) x.push("카드 가능");
  else if (o.acceptsCreditCards === false) x.push("카드 안 받음");
  if (o.acceptsNFC || o.acceptsNfc) x.push("모바일 결제(애플페이 등) 가능");
  return x.join(" · ");
}

// 장소 객체 r 에 채우기. force = true 면 이미 적어 둔 값도 구글 값으로 바꿈
export function applyMore(r, p, force) {
  const put = (k, v) => { if (v && (force || !r[k])) r[k] = v; };
  put("price", fmtPrice(p.priceRange));
  put("pay", fmtPay(p.paymentOptions));
  put("rsv", p.isReservable === true ? "예약 가능" : p.isReservable === false ? "예약 안 받음 (현장 대기)" : "");
  put("sum", p.editorialSummary || "");
  r.g2 = 1; // 이 정보까지 한 번 불러왔다는 표시 (상세 패널을 열 때마다 다시 부르지 않게)
}

// 영업시간·웹사이트·무료 여부 + 가격대·결제·예약·소개 채우기 (비어 있는 칸만)
export async function autofill(p, r) {
  try {
    await p.fetchFields({ fields: ["regularOpeningHours", "websiteUri", "priceLevel", ...MORE] });
    if (!r.hrs) applyHours(r, p.regularOpeningHours);
    if (p.websiteUri && !r.web) r.web = p.websiteUri;
    if (String(p.priceLevel).indexOf("FREE") > -1 && !r.fee) r.fee = "무료";
    applyMore(r, p);
    render();
  } catch (e) { console.error(e); }
}

// 상세 패널의 [구글 정보 다시 불러오기] 버튼: 영업시간·가격대·결제·예약·소개를 구글 값으로 새로
export async function loadHours(r) {
  if (!r || !r.id || !G.Place) return;
  try {
    const p = new G.Place({ id: r.id });
    await p.fetchFields({ fields: ["regularOpeningHours", "websiteUri", ...MORE] });
    const h = applyHours(r, p.regularOpeningHours);
    if (p.websiteUri) r.web = p.websiteUri;
    applyMore(r, p, true);
    render();
    toast(h ? "✓ 구글 정보를 새로 불러왔어요" : "✓ 불러왔어요 (영업시간 정보는 없어요)");
  } catch (e) { alert("불러오지 못했어요"); }
}
