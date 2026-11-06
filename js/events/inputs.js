// 입력칸 변경 · Enter 키 · 환율 계산기
import { S, UI, cur, moveTo } from "../state.js";
import { render, renderMain } from "../render.js";
import { renderDrawer } from "../views/drawer.js";
import { fx } from "../views/prep.js";

function onChange(e) {
  const t = e.target, c = cur();
  if (t.dataset.mode) { S.mode = t.value; render(); return; }   // 이동수단

  // 상세 패널
  const f = t.dataset.f;
  if (f && UI.open) {
    const o = UI.open.o, v = t.value;
    if (f == "at") { moveTo(o, +v); render(); return; }          // 보관함 ↔ Day
    o[f] = f == "w" ? +v || 0 : v;
    renderMain();                                                // 패널은 그대로 (포커스 유지)
    if (f == "s") renderDrawer();
    return;
  }

  const k = t.dataset.k;
  if (!k || !c) return;
  const v = t.type == "checkbox" ? (t.checked ? 1 : 0) : t.value;
  if (t.dataset.top) c[k] = k == "rate" ? +v || 0 : v;            // 나라 정보 (이름·통화·환율·시작일)
  else if (t.dataset.tr) c.tr[k] = v;                            // 교통·결제
  else if (t.dataset.l) c.prep[t.dataset.l][+t.dataset.i][k] = v; // 준비 탭 목록
  render();
}

function onKeydown(e) {
  const t = e.target;
  // 체크리스트 "추가할 항목" 칸에서 Enter
  const l = t.dataset && t.dataset.add;
  if (l && e.key == "Enter" && t.value.trim()) {
    cur().prep[l].push({ t: t.value.trim(), x: 0 });
    render();
    document.querySelector(`[data-add="${l}"]`)?.focus();
    return;
  }
  // 카드에 포커스 + Enter → 열기
  if (e.key == "Enter" && t.classList && t.classList.contains("pcard")) t.click();
}

function onInput(e) {
  if (e.target.id == "fa") fx();
}

export function bindInputs() {
  document.addEventListener("change", onChange);
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("input", onInput);
}
