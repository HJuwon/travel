// 지도에 올릴 점·선 계산 + 지도 위 Day 칩 · 범례 + 간이 지도(키 없을 때)
import { S, UI, cur, dayRows, shown, nums, catOn } from "../state.js";
import { CATS } from "../constants.js";
import { $, esc, hasXY } from "../utils.js";
import { ic, cv } from "../icons.js";
import { G } from "../google/gm.js";

// pts: [{ o, key, no, cand, wish }], lines: Day별 [장소…] (후보 제외)
export function mapData() {
  const c = cur(), pts = [], lines = [];
  if (!c) return { pts, lines };
  const days = UI.focus ? [UI.focus] : Array.from({ length: c.nd }, (_, i) => i + 1);
  const ok = o => hasXY(o) && catOn(o.c); // 내 장소 카테고리 필터
  days.forEach(d => {
    const L = shown(dayRows(d)), nm = nums(L);
    L.forEach((o, j) => { if (ok(o.r)) pts.push({ o: o.r, key: "r" + o.i, no: nm[j], cand: o.r.s == "후보" }); });
    // 카테고리로 거르는 중엔 동선이 끊겨 보이니 숨김
    if (!UI.catF.length) lines.push(L.filter(o => hasXY(o.r) && o.r.s != "후보").map(o => o.r));
  });
  // 계획 모드에선 보관함 장소도 옅게 표시 (어디쯤인지 보면서 배치)
  if (UI.mode == "plan") c.wish.forEach((w, i) => {
    if (ok(w)) pts.push({ o: w, key: "w" + i, no: null, wish: true });
  });
  return { pts, lines };
}

export function pinHTML(p, extra = "") {
  const sel = (UI.open && UI.open.o === p.o) || UI.sel == p.key;
  return `<div class="pin${p.cand ? " cand" : ""}${p.wish ? " wish" : ""}${sel ? " sel" : ""}" style="${cv(p.o.c)}${extra}" title="${esc(p.o.p)}" data-a="pin" data-k="${p.key}">${ic(p.o.c, 16)}${p.no != null ? `<i>${p.no}</i>` : ""}</div>`;
}

// 지도 위: [필터] 버튼(종류를 골라 걸러 보기) + Day 칩, 아래: 범례
export function renderMapHead(pts) {
  const c = cur(), dash = UI.mode == "dash";
  const head = $(dash ? "#dmh" : "#pmh"), pop = $(dash ? "#dmf" : "#pmf"), lg = $(dash ? "#dlg" : "#plg");
  $(dash ? "#pmf" : "#dmf").hidden = true;
  const n = UI.catF.length, open = !!c && UI.menu == "mapf";
  head.innerHTML = c ? (dash ? `<button class="cf fbtn" data-a="fold" data-f="map">🗺 ${UI.fold.map ? "펼치기 ▾" : "접기 ▴"}</button>` : `<button class="cf mclose" data-a="mapt">✕ 지도 닫기</button>`) + (G.map ? `<button class="cf xbtn${UI.xo ? " on" : ""}" data-a="xopen" aria-pressed="${!!UI.xo}">🔍 주변 찾기</button>` : "")
    + `<button class="cf flt${n ? " on" : ""}" data-a="menu" data-m="mapf" aria-haspopup="true" aria-expanded="${open}">⚙ 필터${n ? ` <i>${n}</i>` : ""}</button><span class="msep" aria-hidden="true"></span>`
    + [0, ...Array.from({ length: c.nd }, (_, i) => i + 1)].map(d =>
      `<button class="cf${UI.focus == d ? " on" : ""}" data-a="focus" data-d="${d}">${d ? "Day " + d : "전체"}</button>`).join("")
    : "";
  pop.hidden = !open;
  pop.innerHTML = open ? `<div class="mt">종류 <button class="fr" data-a="cat" data-c="">초기화</button></div>
    <div class="cfs">${CATS.map(x => `<button class="cf${UI.catF.includes(x) ? " on" : ""}" data-a="cat" data-c="${x}" style="${cv(x)}">${ic(x, 13)}${x}</button>`).join("")}</div>
    <p class="mu">고른 종류만 지도와 보관함에 보여요. 아무것도 안 고르면 전부 보여요.</p>` : "";
  lg.innerHTML = (pts.some(p => p.wish) ? `<span>◌ 보관함</span>` : "")
    + (UI.found ? `<span>▢ 주변 검색 결과</span>` : "");
}

// 구글 지도 키가 없을 때: 좌표를 상자 안에 비율로 찍는 간이 지도
export function drawMini(el, pts, lines) {
  el.classList.add("mini");
  const note = `<div class="mininote">간이 지도 · 구글 지도 키(js/keys.js)를 넣으면 구글 지도로 바뀌어요</div>`;
  if (!pts.length) { el.innerHTML = `<div class="empty">지도에 표시할 장소가 없어요</div>` + note; return; }
  // 범위는 일정 장소 기준 (보관함 장소가 멀리 있으면 화면 밖으로 잘림)
  const B = pts.some(p => !p.wish) ? pts.filter(p => !p.wish) : pts;
  const la = B.map(p => p.o.la), lo = B.map(p => p.o.lo);
  const a = Math.min(...la), b = Math.max(...la), c = Math.min(...lo), d = Math.max(...lo);
  const rl = Math.max(b - a, .005), ro = Math.max(d - c, .005);
  const X = v => 10 + (v - c) / ro * 80, Y = v => 88 - (v - a) / rl * 76;
  el.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines.map(L =>
    `<polyline points="${L.map(o => X(o.lo) + "," + Y(o.la)).join(" ")}" fill="none" stroke="var(--route)" stroke-width="2.5" stroke-opacity=".75" stroke-dasharray="6 5" vector-effect="non-scaling-stroke"/>`).join("")}</svg>`
    + pts.filter(p => { const x = X(p.o.lo), y = Y(p.o.la); return x > -2 && x < 102 && y > -2 && y < 102; })
      .map(p => pinHTML(p, `;left:${X(p.o.lo)}%;top:${Y(p.o.la)}%`)).join("") + note;
}
