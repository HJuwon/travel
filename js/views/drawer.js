// 장소 상세 패널 (오른쪽에서 열림): 모든 정보 편집 · 보관함↔Day 이동 · 삭제
import { UI, cur } from "../state.js";
import { CATS, STS } from "../constants.js";
import { $, esc, gq } from "../utils.js";
import { ic, cv } from "../icons.js";
import { G } from "../google/gm.js";
import { card } from "../google/map.js";

export function renderDrawer() {
  const el = $("#drawer"), O = UI.open;
  el.classList.toggle("on", !!O);
  $("#scrim").hidden = !O;
  if (!O) { el.innerHTML = ""; return; }

  const o = O.o, c = cur(), inWish = c.wish.includes(o), food = o.c == "식사";
  const f = (k, l, ph = "") => `<label class="f">${l}<input data-f="${k}" value="${esc(o[k])}" placeholder="${ph}"></label>`;
  const ta = (k, l, ph = "", min = 2) => `<label class="f">${l}<textarea data-f="${k}" rows="${Math.min(8, Math.max(min, String(o[k] || "").split("\n").length))}" placeholder="${ph}">${esc(o[k])}</textarea></label>`;

  el.innerHTML = `<div class="dhd" style="${cv(o.c)}"><span class="ci">${ic(o.c, 18)}</span><input data-f="p" value="${esc(o.p)}" placeholder="장소 이름" aria-label="장소 이름"><button class="x" data-a="close" aria-label="닫기">✕</button></div>
  <div class="dbody">
    <div class="f">종류<div class="segc">${CATS.map(x => `<button class="cf${o.c == x ? " on" : ""}" data-a="setc" data-c="${x}" style="${cv(x)}">${ic(x, 13)}${x}</button>`).join("")}</div></div>
    <div class="row3">
      <label class="f">위치<select data-f="at"><option value="0" ${inWish ? "selected" : ""}>보관함</option>${Array.from({ length: c.nd }, (_, k) => `<option value="${k + 1}" ${!inWish && o.d == k + 1 ? "selected" : ""}>Day ${k + 1}</option>`).join("")}</select></label>
      <label class="f">구분<select data-f="s">${STS.map(x => `<option ${x == (o.s || "필수") ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label class="f">비용(${esc(c.cur)})<input data-f="w" type="number" value="${esc(o.w || 0)}"></label>
    </div>
    ${ta("hrs", "운영·입장 시간 (요일별)", "09:00~17:00", 3)}
    ${f("fee", "입장료", "무료 / 1,000엔")}
    ${food ? f("brk", "브레이크타임", "15:00~17:00") + f("menu", "대표·인기 메뉴") : ""}
    ${f("dress", "복장 규정")}
    ${f("tip", "꿀팁 (추천 시간대 등)", "오전 9시 전 방문")}
    ${ta("m", "메모")}
    <div id="drev"></div>
  </div>
  <div class="dft">
    ${o.id && G.Place ? `<button class="btn" data-a="hrs">영업시간 불러오기</button>` : ""}
    <a class="btn" target="_blank" rel="noopener" href="${gq(o)}">구글맵</a>
    ${/^https?:/.test(o.web || "") ? `<a class="btn" target="_blank" rel="noopener" href="${esc(o.web)}">공식 사이트</a>` : ""}
    <button class="btn dg" data-a="odel">삭제</button>
  </div>`;

  if (o.id && G.Place) loadReviews(o);
}

// 구글 평점·리뷰 3개
async function loadReviews(o) {
  try {
    const p = new G.Place({ id: o.id });
    await p.fetchFields({ fields: ["rating", "userRatingCount", "reviews", "googleMapsURI"] });
    const el = $("#drev");
    if (!el || !UI.open || UI.open.o !== o) return;
    el.innerHTML = "";
    if (p.rating) el.appendChild(card(o.p, p));
  } catch (e) { console.error(e); }
}
