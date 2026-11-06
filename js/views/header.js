// 상단: 나라 선택 메뉴 · 탭 · 계획/대시보드 전환
import { S, UI, cur } from "../state.js";
import { $, esc } from "../utils.js";

const TABS = [["plan", "일정"], ["prep", "준비"], ["bud", "예산"], ["wx", "날씨"]];

function countryMenu(c) {
  let h = `<div class="mn"><div class="mt">나라</div>`;
  h += S.cs.map((x, i) => `<button class="${i == S.sel ? "on" : ""}" data-a="sel" data-i="${i}">${esc(x.f)} ${esc(x.n)}<small>${x.rows.length}곳</small></button>`).join("");
  h += `<button data-a="addc">+ 새 나라</button>`;
  if (!S.cs.some(x => x.n == "일본")) h += `<button data-a="sample">+ 예시 불러오기 (일본)</button>`;
  if (c) {
    h += `<div class="msep"></div><div class="mt">${esc(c.n)} 설정</div>
    <div class="mform">
      <label>국기<input data-top="1" data-k="f" value="${esc(c.f)}"></label>
      <label>이름<input data-top="1" data-k="n" value="${esc(c.n)}"></label>
      <label>통화<input data-top="1" data-k="cur" value="${esc(c.cur)}"></label>
      <label class="full">여행 시작일<input type="date" data-top="1" data-k="start" value="${esc(c.start)}"></label>
    </div>
    <button class="dg" data-a="delc">이 나라 삭제</button>`;
  }
  return h + `</div>`;
}

export function renderHeader() {
  const c = cur();
  $("#cwrap").innerHTML = `<button class="country" data-a="menu" data-m="country" aria-haspopup="true" aria-expanded="${UI.menu == "country"}">${c ? `${esc(c.f)} ${esc(c.n)} <small>${c.nd}일 · ${esc(c.cur)}</small>` : "나라 추가"} ▾</button>${UI.menu == "country" ? countryMenu(c) : ""}`;
  $("#tabs").innerHTML = TABS.map(t => `<button class="${S.tab == t[0] ? "on" : ""}" data-a="tab" data-t="${t[0]}">${t[1]}</button>`).join("");
  $("#seg").hidden = S.tab != "plan";
  $("#seg").innerHTML = [["plan", "계획"], ["dash", "대시보드"]].map(m => `<button class="${UI.mode == m[0] ? "on" : ""}" data-a="mode" data-m="${m[0]}">${m[1]}</button>`).join("");
}
