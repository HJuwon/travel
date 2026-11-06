// 장소 추가 · 영업시간/웹사이트 자동 채우기 (Places API)
import { G } from "./gm.js";
import { fit } from "./map.js";
import { S, cur } from "../state.js";
import { render } from "../render.js";

export async function addPlace(p) {
  const c = cur();
  if (!c) return;
  await p.fetchFields({ fields: ["displayName", "location", "formattedAddress"] });
  const base = { p: p.displayName, id: p.id, la: p.location.lat(), lo: p.location.lng(), c: "관광", m: "" };

  if (S.tab == "wish") { c.wish.push(base); render(); fit(); return; }

  c.rows.push(Object.assign(base, { w: 0, d: S.day || 1, s: "필수" }));
  const nr = c.rows[c.rows.length - 1];
  S.pin = c.rows.length - 1;
  render(); fit();
  autofill(p, nr);
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

// 새로 추가한 장소의 영업시간·웹사이트·무료 여부 채우기
export async function autofill(p, r) {
  try {
    await p.fetchFields({ fields: ["regularOpeningHours", "websiteUri", "priceLevel"] });
    applyHours(r, p.regularOpeningHours);
    if (p.websiteUri) r.web = p.websiteUri;
    if (String(p.priceLevel).indexOf("FREE") > -1 && !r.fee) r.fee = "무료";
    render();
  } catch (e) { console.error(e); }
}

// "구글에서 영업시간 불러오기" 버튼
export async function loadHours(i) {
  const r = cur().rows[i];
  if (!r.id || !G.Place) return;
  try {
    const p = new G.Place({ id: r.id });
    await p.fetchFields({ fields: ["regularOpeningHours"] });
    if (applyHours(r, p.regularOpeningHours)) render();
    else alert("영업시간 정보가 없어요");
  } catch (e) { alert("불러오지 못했어요"); }
}
