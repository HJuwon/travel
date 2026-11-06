// 예산 탭: 종류별 비용 합계 (후보 제외)
import { cur } from "../state.js";
import { CATS } from "../constants.js";
import { $, esc, won } from "../utils.js";
import { ic, cv } from "../icons.js";

export function renderBudget() {
  const c = cur();
  if (!c) { $("#bud").innerHTML = ""; return; }

  const t = {};
  CATS.forEach(x => t[x] = 0);
  c.rows.forEach(r => { if (r.s != "후보") t[r.c] = (t[r.c] || 0) + (+r.w || 0); });
  const tot = Object.values(t).reduce((a, b) => a + b, 0), mx = Math.max(...Object.values(t), 1);

  $("#bud").innerHTML = `<div class="card"><div class="tot">${won(tot)} ${esc(c.cur)}${c.rate ? ` <small>≈ ${won(tot * c.rate)}원</small>` : ""}</div>`
    + CATS.map(x => `<div class="br" style="${cv(x)}"><span>${ic(x, 14)}${x}</span><div class="t"><div class="bfill" style="width:${t[x] / mx * 100}%"></div></div><span>${won(t[x])} ${esc(c.cur)}</span></div>`).join("")
    + `<p class="mu">후보로 표시한 장소와 보관함은 합계에서 빠져요. 환율은 준비 탭에서 바꿀 수 있어요.</p></div>`;
}
