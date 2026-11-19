// 상단: 나라 선택 메뉴 · 탭
import { S, UI, cur } from "../state.js";
import { $, esc } from "../utils.js";
import { online } from "../sync.js";
import { SEED } from "../seed.js";

const TABS = [["plan", "🗓", "일정"], ["prep", "🧳", "준비"], ["bud", "💰", "예산"], ["wx", "⛅", "날씨"]];
const EX = SEED().cs.map(x => [x.n, x.f]); // 예시로 불러올 수 있는 나라

function countryMenu(c) {
  let h = `<div class="mn"><div class="mt">나라</div>`;
  h += S.cs.map((x, i) => `<button class="${i == S.sel ? "on" : ""}" data-a="sel" data-i="${i}">${esc(x.f)} ${esc(x.n)}<small>${x.nd}일 · ${x.rows.length}곳</small></button>`).join("");
  h += `<button data-a="addc">+ 새 나라</button>`;
  EX.filter(([n]) => !S.cs.some(x => x.n == n)).forEach(([n, f]) => { h += `<button data-a="sample" data-n="${esc(n)}">+ 예시 불러오기 (${f} ${esc(n)})</button>`; });
  if (c) h += `<div class="msep"></div><button data-a="set">⚙ ${esc(c.n)} 여행 설정 <small>이름·통화·날짜·일수</small></button>`;
  if (online) h += `<div class="msep"></div><button data-a="logout">이 기기에서 나가기</button>`;
  return h + `</div>`;
}

export function renderHeader() {
  const c = cur();
  $("#cwrap").innerHTML = `<button class="country" data-a="menu" data-m="country" aria-haspopup="true" aria-expanded="${UI.menu == "country"}">${c ? `${esc(c.f)} ${esc(c.n)} <small>${c.nd}일 · ${esc(c.cur)}</small>` : "나라 추가"} ▾</button>${UI.menu == "country" ? countryMenu(c) : ""}`;
  $("#tabs").innerHTML = TABS.map(([k, i, l]) => `<button class="${S.tab == k ? "on" : ""}" data-a="tab" data-t="${k}"${S.tab == k ? ` aria-current="page"` : ""}><span class="ti" aria-hidden="true">${i}</span>${l}</button>`).join("");
}
