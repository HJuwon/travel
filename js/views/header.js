// 나라 칩 · 탭 · 나라 이름/국기/통화 입력
import { S, cur } from "../state.js";
import { $, esc } from "../utils.js";

const TABS = [["wish", "📌 위시"], ["plan", "🗺️ 일정"], ["prep", "🧳 준비"], ["bud", "💰 예산"], ["wx", "🌤️ 날씨"]];

export function renderCountries() {
  const c = cur();
  $("#cs").innerHTML = S.cs.map((c, i) =>
    `<div class="chip ${i == S.sel ? "on" : ""}${S.dsel["c:" + i] ? " sl" : ""}" data-del="c:${i}" data-a="sel" data-i="${i}">${esc(c.f)} ${esc(c.n)} <small>${c.rows.length}곳</small></div>`
  ).join("") + (S.cs.some(c => c.n == "일본") ? "" : `<div class="chip add" data-a="sample">+ 예시(일본)</div>`);

  $("#csa").innerHTML = `<div class="chip add" data-a="addc">+ 나라</div>` + (c
    ? `<button class="sm" data-a="menu" data-m="c" title="나라 더 보기" aria-label="나라 더 보기">⋯</button>${S.menu == "c" ? `<div class="mn"><div class="mt">나라</div><button class="dg" data-a="delc">${esc(c.n)} 삭제</button></div>` : ""}`
    : "");
}

export function renderHeader() {
  const c = cur();
  $("#hd").innerHTML = c
    ? `<input data-k="f" data-top="1" value="${esc(c.f)}" style="width:48px" aria-label="국기"><input data-k="n" data-top="1" value="${esc(c.n)}" style="flex:1;min-width:0" aria-label="나라 이름"><input data-k="cur" data-top="1" value="${esc(c.cur)}" style="width:52px;font-size:14px;font-weight:500" title="통화" aria-label="통화">`
    : `<span class="mu">위에서 나라를 추가해 보세요.</span>`;
  $("#tabs").innerHTML = TABS.map(t => `<button class="${S.tab == t[0] ? "on" : ""}" data-a="tab" data-t="${t[0]}">${t[1]}</button>`).join("");
}
