// 준비 탭: 예약 정보 · 서류 · 준비물 · 교통/결제 · 환율 계산기
import { cur } from "../state.js";
import { $, esc, won } from "../utils.js";

const BK_TYPES = ["항공", "숙소", "교통", "액티비티"];
const X = (l, i) => `<button class="xb" data-a="del" data-l="${l}" data-i="${i}" aria-label="삭제" title="삭제">✕</button>`;

// 체크리스트 (docs / chk)
function list(l) {
  const p = cur().prep[l];
  return p.map((x, i) => `<div class="row"><input type="checkbox" data-l="${l}" data-i="${i}" data-k="x" ${x.x ? "checked" : ""} aria-label="완료"><input data-l="${l}" data-i="${i}" data-k="t" value="${esc(x.t)}">${X(l, i)}</div>`).join("")
    + `<input data-add="${l}" placeholder="추가할 항목 입력 후 Enter">`;
}

function bookingCard(p) {
  return `<div class="card"><h3>🎫 예약 정보</h3>${p.bk.map((b, i) => `<div class="bkr"><div class="row"><select data-l="bk" data-i="${i}" data-k="t" style="width:auto">${BK_TYPES.map(x => `<option ${x == b.t ? "selected" : ""}>${x}</option>`).join("")}</select><input data-l="bk" data-i="${i}" data-k="n" placeholder="이름·구간" value="${esc(b.n)}" style="flex:1;min-width:0">${X("bk", i)}</div><div class="row"><input data-l="bk" data-i="${i}" data-k="d" type="date" value="${esc(b.d)}" style="flex:1"><input data-l="bk" data-i="${i}" data-k="no" placeholder="예약번호" value="${esc(b.no)}" style="flex:1;min-width:0"></div></div>`).join("")}<button class="btn add" data-a="add" data-l="bk">+ 예약 추가</button></div>`;
}

function transportCard(c) {
  const T = c.tr;
  const ts = (k, l, o) => `<div class="row"><span style="width:120px">${l}</span><select data-tr="1" data-k="${k}"><option value="">-</option>${o.map(x => `<option ${x == T[k] ? "selected" : ""}>${x}</option>`).join("")}</select></div>`;
  const ti = (k, l, ph) => `<div class="row"><span style="width:120px">${l}</span><input data-tr="1" data-k="${k}" value="${esc(T[k])}" placeholder="${ph}"></div>`;
  return `<div class="card"><h3>🚇 교통·결제</h3>${ts("card", "교통카드", ["필요", "불필요", "선택"])}${ti("buy", "카드 이름·구매·충전", "예: Suica, 편의점 충전")}${ts("pay", "트래블월렛·카드", ["대부분 가능", "일부만 가능", "불가"])}${ts("cash", "현금", ["많이 필요", "조금 필요", "거의 불필요"])}${ti("note", "교통 메모", "예: 공항 급행, 패스")}</div>`;
}

function fxCard(c) {
  return `<div class="card fx"><h3>💱 환율 계산기</h3><div class="row">1 ${esc(c.cur)} = <input data-top="1" data-k="rate" type="number" value="${c.rate}" style="width:90px"> 원</div><div class="row"><input id="fa" type="number" placeholder="금액" style="width:110px"> ${esc(c.cur)} = <b id="fo">0</b> 원</div><p class="mu">환율은 직접 입력해요. 예산 탭의 원화 환산에도 쓰여요.</p></div>`;
}

// 환율 계산기 입력값 → 원화 (events/inputs.js에서 호출)
export function fx() {
  $("#fo").textContent = won((+$("#fa").value || 0) * (cur().rate || 0));
}

export function renderPrep() {
  const c = cur();
  if (!c) { $("#prep").innerHTML = ""; return; }
  const p = c.prep;
  $("#prep").innerHTML = `<div class="g2">
${bookingCard(p)}
<div class="card"><h3>🛂 비자·여권·보험</h3>${list("docs")}</div>
<div class="card"><h3>🧳 준비물</h3>${list("chk")}</div>
${transportCard(c)}${fxCard(c)}</div>`;
}
