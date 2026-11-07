// 입력칸 변경 · Enter 키 · 환율 계산기
import { UI, cur, moveTo, save } from "../state.js";
import { commitAdd } from "../views/addpanel.js";
import { render, renderMain } from "../render.js";
import { renderDrawer } from "../views/drawer.js";
import { fx } from "../views/prep.js";

function onChange(e) {
  const t = e.target, c = cur();
  // 장소 추가 패널
  if (t.dataset.ad && UI.add) {
    if (t.dataset.ad == "at") UI.add.d = +t.value;
    return;
  }

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
  if (t.dataset.pe) { save(); return; }                           // 수정 중에는 다시 그리지 않음 (포커스 유지)
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
  // 준비 탭 수정 중 Enter → 확정
  if (e.key == "Enter" && t.dataset && t.dataset.pe) { t.blur(); UI.pe = null; render(); return; }
  // 장소 추가 패널 이름 칸 Enter → 추가
  if (e.key == "Enter" && t.dataset && t.dataset.ad == "name") { e.preventDefault(); commitAdd(); return; }
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
