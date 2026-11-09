// 준비 탭: 예약 정보 · 비자·여권·보험 · 준비물 · 교통/결제 · 환율 계산기
//   카드마다 평소엔 글로만 보여 주고,
//   - 카드를 누르면 수정 모드 → [완료]를 눌러야 반영 ([취소]·Esc면 그대로)
//   - 오른쪽 위 휴지통 → 지울 항목을 골라 [선택 삭제]
//   UI.pe = 수정 중인 카드, UI.draft = 수정 중인 사본, UI.pd = 삭제 고르는 중인 카드, UI.pdSel = 고른 번호들
import { UI, cur } from "../state.js";
import { $, esc, won } from "../utils.js";

const BK_TYPES = ["항공", "숙소", "교통", "액티비티"];
const TR = [
  ["card", "교통카드", "s", ["필요", "불필요", "선택"]],
  ["buy", "카드 이름·구매·충전", "i", "예: Suica, 편의점 충전"],
  ["pay", "트래블월렛·카드", "s", ["대부분 가능", "일부만 가능", "불가"]],
  ["cash", "현금", "s", ["많이 필요", "조금 필요", "거의 불필요"]],
  ["note", "교통 메모", "i", "예: 공항 급행, 패스"],
];
const fmtD = d => d ? d.slice(5).replace("-", "/") : "";
const TRASH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>`;

// ----- 수정 · 삭제 상태 처리 (events/actions.js에서 호출) -----
const clone = v => JSON.parse(JSON.stringify(v));
const source = (c, k) => k == "tr" ? c.tr : k == "fx" ? { rate: c.rate } : c.prep[k];
const blank = k => k == "bk" ? { t: "항공", n: "", d: "", no: "" } : { t: "", x: 0 };

export function startEdit(k, addNew) {
  const c = cur();
  UI.pd = null;
  UI.pe = k;
  UI.draft = clone(source(c, k));
  if (addNew) UI.draft.push(blank(k));
  UI.peFocus = addNew ? UI.draft.length - 1 : 0;
}

export function finishEdit() {
  const c = cur(), k = UI.pe, d = UI.draft;
  if (!c || !k || !d) return;
  if (k == "tr") c.tr = d;
  else if (k == "fx") c.rate = +d.rate || 0;
  else if (k == "bk") c.prep.bk = d.filter(b => b.n.trim() || b.d || b.no.trim());   // 빈 예약은 버림
  else c.prep[k] = d.filter(x => x.t.trim()).map(x => ({ ...x, t: x.t.trim() }));   // 빈 줄은 버림
  cancelEdit();
}

export function cancelEdit() { UI.pe = null; UI.draft = null; }

export function startDelete(k) { cancelEdit(); UI.pd = UI.pd == k ? null : k; UI.pdSel = []; }

export function toggleSel(i) {
  UI.pdSel = UI.pdSel.includes(i) ? UI.pdSel.filter(x => x != i) : [...UI.pdSel, i];
}

export function doDelete() {
  const c = cur(), k = UI.pd;
  if (!c || !k) return;
  if (k == "tr") UI.pdSel.forEach(i => { c.tr[TR[i][0]] = ""; });               // 교통·결제는 고른 칸을 비움
  else c.prep[k] = c.prep[k].filter((_, i) => !UI.pdSel.includes(i));
  UI.pd = null; UI.pdSel = [];
}

// 수정 중 입력 → 사본에만 기록 (events/inputs.js에서 호출)
export function draftInput(t) {
  const d = UI.draft;
  if (!d) return;
  const v = t.value;
  if (t.dataset.i != null) d[+t.dataset.i][t.dataset.k] = v;
  else d[t.dataset.k] = v;
}

// 수정 중 [+ 추가] → 맨 아래에 빈 칸
export function addRow() {
  UI.draft.push(blank(UI.pe));
  UI.peFocus = UI.draft.length - 1;
}

// 체크리스트 수정 중 Enter → 아래에 새 줄
export function draftNewLine(i) {
  UI.draft.splice(i + 1, 0, blank(UI.pe));
  UI.peFocus = i + 1;
}

// ----- 그리기 -----
// 카드 머리: 제목 + 오른쪽 위 휴지통
function head(k, title, canDel = true) {
  const del = canDel && UI.pe != k
    ? `<button class="trash${UI.pd == k ? " on" : ""}" data-a="pdel" data-pk="${k}" aria-label="${title} 항목 삭제" title="골라서 삭제">${TRASH}</button>` : "";
  return `<h3>${title}<span class="sp"></span>${del}</h3>`;
}

// 카드 아래 버튼: 수정 중이면 [완료][취소], 삭제 고르는 중이면 [선택 삭제][취소]
function foot(k) {
  if (UI.pe == k) return `<div class="pft"><button class="btn p" data-a="pdone">완료</button><button class="btn" data-a="pcancel">취소</button></div>`;
  if (UI.pd == k) {
    const n = UI.pdSel.length;
    return `<div class="pft"><span class="mu">${k == "tr" ? "비울 칸을 고르세요" : "지울 항목을 고르세요"}</span><span class="sp"></span><button class="btn dg" data-a="pdelgo" ${n ? "" : "disabled"}>${k == "tr" ? "선택 비우기" : "선택 삭제"}${n ? " " + n : ""}</button><button class="btn" data-a="pdel" data-pk="${k}">취소</button></div>`;
  }
  return "";
}

// 삭제 고르는 중이면 항목에 붙일 속성
const pick = (k, i) => UI.pd == k ? ` data-a="psel" data-i="${i}"` : "";
const picked = (k, i) => UI.pd == k && UI.pdSel.includes(i) ? " picked" : "";
const mark = (k, i) => UI.pd == k ? `<span class="pm${UI.pdSel.includes(i) ? " on" : ""}" aria-hidden="true"></span>` : "";

// 카드 전체를 눌러 수정 (삭제 고르는 중엔 X)
const cardAttr = k => UI.pe == k ? `class="card editing"` : UI.pd == k ? `class="card picking"` : `class="card view" data-a="pedit" data-pk="${k}" title="눌러서 수정"`;

function listCard(k, title, ph) {
  const p = cur().prep[k];
  let body;
  if (UI.pe == k) {
    body = UI.draft.map((x, i) => `<div class="row"><input data-dr="1" data-i="${i}" data-k="t" value="${esc(x.t)}" placeholder="${ph}" enterkeyhint="next"></div>`).join("")
      + `<button class="btn add" data-a="padd">+ 항목 추가</button>`;
  } else {
    body = p.map((x, i) => `<div class="row item${picked(k, i)}"${pick(k, i)}>${mark(k, i)}`
      + (UI.pd == k ? "" : `<input type="checkbox" data-l="${k}" data-i="${i}" data-k="x" ${x.x ? "checked" : ""} aria-label="완료 표시">`)
      + `<span class="txt${x.x ? " done" : ""}">${esc(x.t)}</span></div>`).join("")
      || `<div class="mu">아직 없어요. 눌러서 추가하세요</div>`;
  }
  return `<div ${cardAttr(k)}>${head(k, title, p.length > 0)}${body}${foot(k)}</div>`;
}

function bookingCard(p) {
  const k = "bk";
  let body;
  if (UI.pe == k) {
    body = UI.draft.map((b, i) => `<div class="bk editing">
      <div class="row"><select data-dr="1" data-i="${i}" data-k="t" style="width:auto">${BK_TYPES.map(x => `<option ${x == b.t ? "selected" : ""}>${x}</option>`).join("")}</select><input data-dr="1" data-i="${i}" data-k="n" placeholder="이름·구간 (예: 인천→나리타)" value="${esc(b.n)}" style="flex:1;min-width:0"></div>
      <div class="row"><input data-dr="1" data-i="${i}" data-k="d" type="date" value="${esc(b.d)}" style="flex:1"><input data-dr="1" data-i="${i}" data-k="no" placeholder="예약번호" value="${esc(b.no)}" style="flex:1;min-width:0"></div></div>`).join("")
      + `<button class="btn add" data-a="padd">+ 예약 추가</button>`;
  } else {
    body = p.bk.length ? `<div class="bks">${p.bk.map((b, i) => {
      const sub = [fmtD(b.d), b.no].filter(Boolean).map(esc).join(" · ");
      return `<div class="bk${picked(k, i)}"${pick(k, i)}>${mark(k, i)}<span class="bkt">${esc(b.t)}</span><b>${esc(b.n) || "(이름 없음)"}</b><small>${sub || "&nbsp;"}</small></div>`;
    }).join("")}</div>` : `<div class="mu">아직 없어요. 눌러서 항공·숙소 예약을 적어 두세요</div>`;
  }
  return `<div ${cardAttr(k)}>${head(k, "🎫 예약 정보", p.bk.length > 0)}${body}${foot(k)}</div>`;
}

function transportCard(c) {
  const k = "tr";
  let body;
  if (UI.pe == k) {
    const T = UI.draft;
    body = TR.map(([f, l, t, o]) => `<div class="row"><span style="width:120px;flex:none">${l}</span>${t == "s"
      ? `<select data-dr="1" data-k="${f}"><option value="">-</option>${o.map(x => `<option ${x == T[f] ? "selected" : ""}>${x}</option>`).join("")}</select>`
      : `<input data-dr="1" data-k="${f}" value="${esc(T[f])}" placeholder="${o}">`}</div>`).join("");
  } else {
    body = TR.map(([f, l], i) => `<div class="kv${picked(k, i)}"${pick(k, i)}>${mark(k, i)}<span class="kl">${l}</span><span>${esc(c.tr[f]) || "-"}</span></div>`).join("");
  }
  return `<div ${cardAttr(k)}>${head(k, "🚇 교통·결제", TR.some(([f]) => c.tr[f]))}${body}${foot(k)}</div>`;
}

function fxCard(c) {
  const rate = UI.pe == "fx"
    ? `<input data-dr="1" data-k="rate" type="number" value="${UI.draft.rate}" style="width:90px"> 원`
    : `<span class="txt" data-a="pedit" data-pk="fx" title="눌러서 수정"><b>${c.rate}</b> 원</span>`;
  return `<div class="card fx">${head("fx", "💱 환율 계산기", false)}<div class="row">1 ${esc(c.cur)} = ${rate}</div>${foot("fx")}<div class="row"><input id="fa" type="number" placeholder="금액" style="width:110px"> ${esc(c.cur)} = <b id="fo">0</b> 원</div><p class="mu">환율은 직접 입력해요. 예산 탭의 원화 환산에도 쓰여요.</p></div>`;
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
${listCard("docs", "🛂 비자·여권·보험", "예: 여행자보험 가입")}
${listCard("chk", "🧳 준비물", "예: 보조배터리")}
${transportCard(c)}${fxCard(c)}</div>`;

  // 수정 모드로 막 들어왔으면 해당 칸에 커서
  if (UI.pe && UI.peFocus != null) {
    const sel = UI.pe == "tr" || UI.pe == "fx" ? "#prep [data-dr]" : `#prep [data-dr][data-i="${UI.peFocus}"]:not(select)`;
    const el = document.querySelector(sel);
    UI.peFocus = null;
    if (el) { el.focus(); if (el.select && el.type != "date") el.select(); }
  }
}
