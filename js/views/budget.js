// 예산 탭: 맨 위 환율(자동) · 환율 계산기 + 종류별 비용 합계 (후보 제외)
import { cur, save } from "../state.js";
import { CATS } from "../constants.js";
import { $, esc, won } from "../utils.js";
import { ic, cv } from "../icons.js";
import { CURS, curOf, liveRate, fmtRate } from "../fx.js";

const when = ms => {
  const d = new Date(ms);
  return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
};

function fxCard(c) {
  const x = curOf(c.code), code = x ? x[0] : esc(c.cur || "?");
  const sel = `<select data-top="1" data-k="code" aria-label="통화" style="width:auto">
    <option value="" ${c.code ? "" : "selected"}>직접 입력</option>
    ${CURS.map(([k, s, n]) => `<option value="${k}" ${k == c.code ? "selected" : ""}>${n} (${k} ${s})</option>`).join("")}</select>`;

  // 통화를 고르면 자동, 아니면 직접 입력
  const rate = c.code && c.rateAt
    ? `<b class="rt">${fmtRate(c.rate)}</b> 원 <span class="mu">· ${when(c.rateAt)} 기준 자동</span>`
    : c.code
      ? `<b class="rt">${c.rate ? fmtRate(c.rate) : "…"}</b> 원 <span class="mu">· 불러오는 중</span>`
      : `<input data-top="1" data-k="rate" type="number" step="any" value="${c.rate}" style="width:100px"> 원 <span class="mu">· 직접 입력</span>`;

  return `<div class="card fxc"><h3>💱 환율</h3>
    <div class="row">${sel}</div>
    <div class="row fxr">1 ${code} = ${rate}</div>
    <div class="fxcalc">
      <label><input id="fa" data-c="${esc(c.code || c.cur)}" type="number" step="any" inputmode="decimal" placeholder="0"><span>${esc(c.cur)}</span></label>
      <span class="eq">=</span>
      <label><input id="fk" type="number" step="any" inputmode="decimal" placeholder="0"><span>원</span></label>
    </div>
    ${c.code ? `<p class="mu">하루 한 번 갱신되는 기준 환율이라 실제 환전·카드 환율과는 조금 달라요. <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates By Exchange Rate API</a></p>` : ""}
  </div>`;
}

// 환율 계산기: 어느 쪽에 입력해도 반대쪽 계산 (events/inputs.js에서 호출)
export function fx(from) {
  const r = cur().rate || 0, a = $("#fa"), k = $("#fk");
  if (!a || !k) return;
  if (from == "fk") a.value = r && k.value !== "" ? +(k.value / r).toFixed(2) : "";
  else k.value = a.value !== "" ? Math.round(a.value * r) : "";
}

// 자동 환율 불러와서 바뀌었으면 반영 (같이 쓰는 데이터라 저장됨)
async function refresh(c) {
  if (!c.code) return;
  const m = await liveRate(c.code);
  if (!m || cur() !== c || !c.code) return;
  if (c.rate != m.rate || c.rateAt != m.at) {
    c.rate = m.rate; c.rateAt = m.at;
    save();
    if (!$("#bud").hidden) renderBudget();
  }
}

export function renderBudget() {
  const c = cur();
  if (!c) { $("#bud").innerHTML = ""; return; }

  const t = {};
  CATS.forEach(x => t[x] = 0);
  c.rows.forEach(r => { if (r.s != "후보") t[r.c] = (t[r.c] || 0) + (+r.w || 0); });
  const tot = Object.values(t).reduce((a, b) => a + b, 0), mx = Math.max(...Object.values(t), 1);

  // 계산기에 입력 중이던 값은 다시 그려도 유지 (통화를 바꿨으면 비움)
  const fa = $("#fa"), keep = fa && fa.dataset.c == (c.code || c.cur) ? fa.value : "";

  $("#bud").innerHTML = fxCard(c)
    + `<div class="card"><h3>💰 예산</h3><div class="tot">${won(tot)} ${esc(c.cur)}${c.rate ? ` <small>≈ ${won(tot * c.rate)}원</small>` : ""}</div>`
    + CATS.map(x => `<div class="br" style="${cv(x)}"><span>${ic(x, 14)}${x}</span><div class="t"><div class="bfill" style="width:${t[x] / mx * 100}%"></div></div><span>${won(t[x])} ${esc(c.cur)}</span></div>`).join("")
    + `<p class="mu">일정에 넣은 장소의 비용 합계예요. 후보로 표시한 장소와 보관함은 빠져요.</p></div>`;

  if (keep) { $("#fa").value = keep; fx("fa"); }
  refresh(c);
}
