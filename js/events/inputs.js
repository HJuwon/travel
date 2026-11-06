// 입력칸 변경 · Enter 키 · 환율 계산기
import { S, cur } from "../state.js";
import { render } from "../render.js";
import { fx } from "../views/prep.js";

function onChange(e) {
  const t = e.target;
  if (t.dataset.mode) { S.mode = t.value; render(); return; }                 // 이동수단
  if (t.dataset.wd) { S.wd = t.value; return; }                              // 위시 배치할 Day
  if (t.dataset.wsel != null) {                                              // 위시 체크박스
    if (t.checked) S.wsel[t.dataset.wsel] = 1; else delete S.wsel[t.dataset.wsel];
    render(); return;
  }

  const k = t.dataset.k;
  if (!k) return;
  const c = cur(), v = t.type == "checkbox" ? (t.checked ? 1 : 0) : t.value;

  if (t.dataset.top) c[k] = k == "rate" ? +v || 0 : v;                       // 나라 정보 (이름·통화·환율·시작일)
  else if (t.dataset.tr) c.tr[k] = v;                                        // 교통·결제
  else if (t.dataset.l) c.prep[t.dataset.l][+t.dataset.i][k] = v;            // 준비 탭 목록
  else if (t.dataset.w != null) c.wish[+t.dataset.w][k] = v;                 // 위시
  else {                                                                     // 일정 장소
    const r = c.rows[+t.dataset.i];
    r[k] = k == "w" ? +v || 0 : k == "d" ? Math.max(1, +v || 1) : v;
    if (k == "d" && r.d > c.nd) c.nd = r.d;
  }
  render();
}

function onKeydown(e) {
  // 체크리스트 "추가할 항목" 칸에서 Enter
  const l = e.target.dataset && e.target.dataset.add;
  if (l && e.key == "Enter" && e.target.value.trim()) {
    cur().prep[l].push({ t: e.target.value.trim(), x: 0 });
    render();
    return;
  }
  // 장소 이름에 포커스 + Enter → 클릭과 동일
  if (e.key == "Enter" && e.target.classList && e.target.classList.contains("nm")) e.target.click();
}

function onInput(e) {
  if (e.target.id == "fa") fx();
}

export function bindInputs() {
  document.addEventListener("change", onChange);
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("input", onInput);
}
