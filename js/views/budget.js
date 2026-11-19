// 예산 탭: 맨 위 환율(자동) · 환율 계산기 + 계획 vs 실제 지출 (종류별로 펼쳐서 다녀온 곳 체크 · 추가 지출)
import { UI, cur, save } from "../state.js";
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

// ----- 예산: 계획(일정) vs 실제(다녀온 곳 + 직접 추가한 지출) -----
//   계획 = 일정에 넣은 장소의 예산 합계 (후보 제외)
//   실제 = '다녀왔어요'로 체크한 장소(실제 금액을 적으면 그 금액) + 일정 밖에서 쓴 돈(c.ex)
const amt = n => (+n || 0).toLocaleString("ko-KR", { maximumFractionDigits: 2 });
export const paid = r => r.done ? (r.paid !== undefined && r.paid !== "" ? +r.paid || 0 : +r.w || 0) : 0;

function totals(c) {
  const t = {};
  CATS.forEach(x => t[x] = { plan: 0, real: 0 });
  c.rows.forEach(r => {
    const x = t[r.c] || t.기타;
    if (r.s != "후보") x.plan += +r.w || 0;
    x.real += paid(r);
  });
  c.ex.forEach(e => { (t[e.c] || t.기타).real += +e.w || 0; });
  return t;
}

// 종류 하나를 펼쳤을 때: 일정 장소(체크 = 다녀옴) + 직접 추가한 지출
function detail(c, cat) {
  const cu = esc(c.cur);
  const R = c.rows.map((r, i) => ({ r, i })).filter(o => (CATS.includes(o.r.c) ? o.r.c : "기타") == cat)
    .sort((a, b) => (a.r.s == "후보") - (b.r.s == "후보") || a.r.d - b.r.d);
  const E = c.ex.map((e, i) => ({ e, i })).filter(o => (CATS.includes(o.e.c) ? o.e.c : "기타") == cat);

  let h = `<div class="bdet"><div class="bsub">일정에서 <span class="mu">다녀온 곳을 체크하면 실제 지출에 들어가요</span></div>`;
  h += R.map(({ r, i }) => {
    const k = "r" + i;
    return `<div class="bi${r.done ? " on" : ""}">
      <label><input type="checkbox" data-bd="done" data-k="${k}" ${r.done ? "checked" : ""}><span class="bn"><small>Day ${r.d}</small> ${esc(r.p) || "(이름 없음)"}${r.s == "후보" ? ` <em>후보</em>` : ""}</span></label>
      <span class="bw">${r.done
        ? `<input type="number" step="any" inputmode="decimal" data-bd="paid" data-k="${k}" value="${r.paid !== undefined && r.paid !== "" ? esc(r.paid) : ""}" placeholder="${amt(r.w)}" aria-label="${esc(r.p)} 실제 금액"> ${cu}`
        : `<span class="mu">계획 ${cu}${amt(r.w)}</span>`}</span></div>`;
  }).join("") || `<div class="mu bi">일정에 이 종류 장소가 없어요</div>`;

  h += `<div class="bsub">일정 밖에서 쓴 돈 <span class="mu">예: 공항 택시, 간식, 기념품</span></div>`;
  h += E.map(({ e, i }) => `<div class="bi on ex"><span class="bn">${esc(e.t) || "(내용 없음)"}</span><span class="bw">${cu}${amt(e.w)}<button class="xb" data-a="exdel" data-i="${i}" aria-label="${esc(e.t)} 지우기">✕</button></span></div>`).join("");
  h += `<div class="exadd"><input data-ex="t" placeholder="내용" aria-label="지출 내용"><input data-ex="w" type="number" step="any" inputmode="decimal" placeholder="금액(${cu})" aria-label="금액"><button class="btn" data-a="exadd" data-c="${cat}">+ 추가</button></div>`;
  return h + `</div>`;
}

function budgetCard(c) {
  const t = totals(c), cu = esc(c.cur);
  const P = CATS.reduce((a, x) => a + t[x].plan, 0), A = CATS.reduce((a, x) => a + t[x].real, 0);
  const krw = n => c.rate ? `<small>≈ ${won(n * c.rate)}원</small>` : "";
  const left = P - A;
  let h = `<div class="card"><h3>💰 예산</h3>
    <div class="bsum">
      <div><span>계획</span><b>${cu}${amt(P)}</b>${krw(P)}</div>
      <div><span>실제 지출</span><b>${cu}${amt(A)}</b>${krw(A)}</div>
      <div class="${left < 0 ? "over" : ""}"><span>${left < 0 ? "초과" : "남음"}</span><b>${cu}${amt(Math.abs(left))}</b>${krw(Math.abs(left))}</div>
    </div>`;
  h += CATS.map(x => {
    const v = t[x], open = UI.bo == x, mx = Math.max(v.plan, v.real, 1);
    return `<div class="bcat${open ? " open" : ""}" style="${cv(x)}">
      <button class="br" data-a="bo" data-c="${x}" aria-expanded="${open}">
        <span class="bl">${ic(x, 15)}${x}</span>
        <span class="t"><span class="bplan" style="width:${v.plan / mx * 100}%"></span><span class="bfill" style="width:${v.real / mx * 100}%"></span></span>
        <span class="bv"><b>${cu}${amt(v.real)}</b><small>/ ${cu}${amt(v.plan)}</small></span><span class="chev" aria-hidden="true">▾</span>
      </button>${open ? detail(c, x) : ""}</div>`;
  }).join("");
  return h + `<p class="mu">막대: 옅은 색 = 계획(일정 예산 합계, 후보 제외), 진한 색 = 실제 지출. 종류를 누르면 다녀온 곳을 체크하고 일정 밖 지출을 추가할 수 있어요. 일정의 장소 줄에서 [다녀왔어요]를 눌러도 돼요.</p></div>`;
}

export function renderBudget() {
  const c = cur();
  if (!c) { $("#bud").innerHTML = ""; return; }

  // 계산기에 입력 중이던 값은 다시 그려도 유지 (통화를 바꿨으면 비움)
  const fa = $("#fa"), keep = fa && fa.dataset.c == (c.code || c.cur) ? fa.value : "";

  $("#bud").innerHTML = fxCard(c) + budgetCard(c);

  if (keep) { $("#fa").value = keep; fx("fa"); }
  refresh(c);
}
