// 계획 모드: 왼쪽 보관함 + 가운데 Day 칸 (끌어서 배치)
import { S, UI, cur, dayRows, shown, nums } from "../state.js";
import { CATS, MODES } from "../constants.js";
import { $, esc, won, hasXY, dayLabel, dirURL } from "../utils.js";
import { ic, cv } from "../icons.js";
import { pcard } from "./card.js";
import { sortable } from "../events/drag.js";

export function renderWish() {
  const c = cur(), el = $("#wishlist");
  if (!c) { el.innerHTML = $("#wcats").innerHTML = $("#wcount").textContent = ""; return; }

  $("#wcount").textContent = c.wish.length + "곳";
  $("#wcats").innerHTML = ["", ...CATS].map(x =>
    `<button class="cf${UI.catF == x ? " on" : ""}" data-a="cat" data-c="${x}" ${x ? `style="${cv(x)}"` : ""}>${x ? ic(x, 13) + x : "전체"}</button>`
  ).join("");

  el.innerHTML = c.wish.map((w, i) => pcard(w, "w" + i, null, c.cur, UI.catF && w.c != UI.catF)).join("")
    + (c.wish.length ? "" : `<div class="empty">장소를 검색하거나 지도에서 골라<br>가고 싶은 곳을 모아 두세요</div>`);
  sortable(el);
}

function bar(c) {
  const range = c.start ? `${dayLabel(c, 1)} ~ ${dayLabel(c, c.nd)} · ${c.nd}일` : `${c.nd}일`;
  return `<h2>일정</h2><span class="sub">${range}</span>`
    + (c.start ? "" : `<label class="sbtn" title="Day마다 날짜와 날씨가 표시돼요">시작일<input type="date" data-top="1" data-k="start"></label>`)
    + `<span class="sp"></span>`
    + `<label class="sbtn" title="카드 사이 이동시간 계산 기준 (지도 키 필요)">이동<select data-mode="1" aria-label="이동수단">${Object.keys(MODES).map(k => `<option value="${k}" ${k == S.mode ? "selected" : ""}>${MODES[k]}</option>`).join("")}</select></label>`
    + `<button class="sbtn${S.hc ? " on" : ""}" data-a="hc">${S.hc ? "후보 보이기" : "후보 숨기기"}</button>`
    + `<button class="sbtn maptoggle${UI.mapOn ? " on" : ""}" data-a="mapt">🗺 지도</button>`;
}

function column(c, d) {
  const all = dayRows(d), vis = shown(all), nm = nums(vis);
  const must = vis.filter(o => o.r.s != "후보");
  const cost = must.reduce((a, o) => a + (+o.r.w || 0), 0);

  let h = `<div class="col${UI.focus == d ? " focus" : ""}">
    <div class="colh" data-a="focus" data-d="${d}" title="눌러서 지도에 이 Day만 보기">
      <div><b>Day ${d}</b><span>${dayLabel(c, d) || must.length + "곳"}</span></div>
      <div class="cost">${esc(c.cur)}${won(cost)}${c.start ? "<br>" + must.length + "곳" : ""}</div>
      <button class="sm" data-a="menu" data-m="day${d}" aria-label="Day ${d} 메뉴">⋯</button>
      ${UI.menu == "day" + d ? `<div class="mn"><button class="dg" data-a="delday" data-d="${d}">Day ${d} 삭제</button></div>` : ""}
    </div>
    <div class="drop" data-d="${d}">`;

  all.forEach(o => {
    const j = vis.indexOf(o), hid = j < 0;
    h += pcard(o.r, "r" + o.i, hid ? null : nm[j], c.cur, hid);
    // 다음 장소까지 이동 구간 (google/routes.js가 시간을 채움)
    const n = vis[j + 1];
    if (!hid && n && o.r.s != "후보" && n.r.s != "후보" && hasXY(o.r) && hasXY(n.r)) h += `<div class="leg" id="lg${o.i}"><span class="lt">↓</span><a class="gdir" href="${dirURL(o.r, n.r, S.mode)}" target="_blank" rel="noopener" title="구글맵에서 이 구간 길찾기">길찾기 ↗</a></div>`;
  });

  return h + `</div><button class="addc" data-a="manual" data-d="${d}">+ 장소 추가</button></div>`;
}

export function renderBoard() {
  const c = cur();
  if (!c) { $("#bar").innerHTML = ""; $("#board").innerHTML = `<div class="empty">위의 나라 메뉴에서 나라를 추가해 보세요</div>`; return; }
  $("#bar").innerHTML = bar(c);
  let h = "";
  for (let d = 1; d <= c.nd; d++) h += column(c, d);
  $("#board").innerHTML = h + `<button class="addday" data-a="addday">+ Day</button>`;
  document.querySelectorAll("#board .drop").forEach(sortable);
}
