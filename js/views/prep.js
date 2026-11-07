// 준비 탭: 예약 정보 · 서류 · 준비물 · 교통/결제 · 환율 계산기
//   모든 항목은 '확정된 모습'으로 보여 주고, 눌러야 수정 모드가 됩니다. (UI.pe = 수정 중인 항목 키)
import { UI, cur } from "../state.js";
import { $, esc, won } from "../utils.js";

const BK_TYPES = ["항공", "숙소", "교통", "액티비티"];
const X = (l, i) => `<button class="xb" data-a="del" data-l="${l}" data-i="${i}" aria-label="삭제" title="삭제">✕</button>`;
const OK = `<button class="btn okb" data-a="pdone">완료</button>`;
const fmtD = d => d ? d.slice(5).replace("-", "/") : "";

// 체크리스트 (docs / chk): 체크박스는 항상 누를 수 있고, 글자를 누르면 수정
function list(l) {
  const p = cur().prep[l];
  return p.map((x, i) => {
    const k = l + i;
    const chk = `<input type="checkbox" data-l="${l}" data-i="${i}" data-k="x" ${x.x ? "checked" : ""} aria-label="완료">`;
    if (UI.pe === k) return `<div class="row item editing">${chk}<input data-pe="1" data-l="${l}" data-i="${i}" data-k="t" value="${esc(x.t)}">${OK}${X(l, i)}</div>`;
    return `<div class="row item">${chk}<span class="txt${x.x ? " done" : ""}" data-a="pedit" data-pk="${k}" title="눌러서 수정">${esc(x.t) || "(비어 있음)"}</span>${X(l, i)}</div>`;
  }).join("")
    + `<input data-add="${l}" placeholder="추가할 항목 입력 후 Enter">`;
}

function bookingCard(p) {
  const items = p.bk.map((b, i) => {
    const k = "bk" + i;
    if (UI.pe === k) {
      return `<div class="bk editing"><div class="row"><select data-pe="1" data-l="bk" data-i="${i}" data-k="t" style="width:auto">${BK_TYPES.map(x => `<option ${x == b.t ? "selected" : ""}>${x}</option>`).join("")}</select><input data-pe="1" data-l="bk" data-i="${i}" data-k="n" placeholder="이름·구간" value="${esc(b.n)}" style="flex:1;min-width:0"></div>`
        + `<div class="row"><input data-pe="1" data-l="bk" data-i="${i}" data-k="d" type="date" value="${esc(b.d)}" style="flex:1"><input data-pe="1" data-l="bk" data-i="${i}" data-k="no" placeholder="예약번호" value="${esc(b.no)}" style="flex:1;min-width:0"></div>${OK}${X("bk", i)}</div>`;
    }
    const sub = [fmtD(b.d), b.no].filter(Boolean).map(esc).join(" · ");
    return `<div class="bk" data-a="pedit" data-pk="${k}" title="눌러서 수정"><span class="bkt">${esc(b.t)}</span><b>${esc(b.n) || "(이름 없음)"}</b><small>${sub || "&nbsp;"}</small>${X("bk", i)}</div>`;
  }).join("");
  return `<div class="card"><h3>🎫 예약 정보</h3><div class="bks">${items}</div><button class="btn add" data-a="add" data-l="bk">+ 예약 추가</button></div>`;
}

const TR = [
  ["card", "교통카드", "s", ["필요", "불필요", "선택"]],
  ["buy", "카드 이름·구매·충전", "i", "예: Suica, 편의점 충전"],
  ["pay", "트래블월렛·카드", "s", ["대부분 가능", "일부만 가능", "불가"]],
  ["cash", "현금", "s", ["많이 필요", "조금 필요", "거의 불필요"]],
  ["note", "교통 메모", "i", "예: 공항 급행, 패스"],
];

function transportCard(c) {
  const T = c.tr;
  if (UI.pe === "tr") {
    const rows = TR.map(([k, l, t, o]) => `<div class="row"><span style="width:120px">${l}</span>${t == "s"
      ? `<select data-pe="1" data-tr="1" data-k="${k}"><option value="">-</option>${o.map(x => `<option ${x == T[k] ? "selected" : ""}>${x}</option>`).join("")}</select>`
      : `<input data-pe="1" data-tr="1" data-k="${k}" value="${esc(T[k])}" placeholder="${o}">`}</div>`).join("");
    return `<div class="card"><h3>🚇 교통·결제</h3>${rows}${OK}</div>`;
  }
  const rows = TR.map(([k, l]) => `<div class="kv"><span>${l}</span><span>${esc(T[k]) || "-"}</span></div>`).join("");
  return `<div class="card view" data-a="pedit" data-pk="tr" title="눌러서 수정"><h3>🚇 교통·결제</h3>${rows}</div>`;
}

function fxCard(c) {
  const rate = UI.pe === "fx"
    ? `<input data-pe="1" data-top="1" data-k="rate" type="number" value="${c.rate}" style="width:90px"> 원 ${OK}`
    : `<span class="txt" data-a="pedit" data-pk="fx" title="눌러서 수정"><b>${c.rate}</b> 원</span>`;
  return `<div class="card fx"><h3>💱 환율 계산기</h3><div class="row">1 ${esc(c.cur)} = ${rate}</div><div class="row"><input id="fa" type="number" placeholder="금액" style="width:110px"> ${esc(c.cur)} = <b id="fo">0</b> 원</div><p class="mu">환율은 직접 입력해요. 예산 탭의 원화 환산에도 쓰여요.</p></div>`;
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
