// 입력칸 변경 · Enter 키 · 환율 계산기
import { UI, cur, moveTo } from "../state.js";
import { commitAdd } from "../views/addpanel.js";
import { render, renderMain } from "../render.js";
import { renderDrawer } from "../views/drawer.js";
import { draftInput, draftNewLine, finishEdit } from "../views/prep.js";
import { fx } from "../views/budget.js";
import { curOf } from "../fx.js";

function onChange(e) {
  const t = e.target, c = cur();
  // 준비 탭 수정 중: 사본에만 기록 ([완료]를 눌러야 반영)
  if (t.dataset.dr) { draftInput(t); return; }
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
  if (t.dataset.top && k == "code") {                             // 통화 고르기 → 기호도 맞추고 자동 환율 다시
    c.code = v; c.rateAt = 0;
    const x = curOf(v);
    if (x) c.cur = x[1];
  }
  else if (t.dataset.top) c[k] = k == "rate" ? +v || 0 : v;       // 나라 정보 (이름·통화 기호·환율·시작일)
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
  // 준비 탭 수정 중 Enter: 체크리스트는 아래에 새 줄, 나머지는 [완료]
  if (e.key == "Enter" && t.dataset && t.dataset.dr && !e.isComposing) {
    e.preventDefault();
    draftInput(t);
    if (UI.pe == "docs" || UI.pe == "chk") draftNewLine(+t.dataset.i); else finishEdit();
    render();
    return;
  }
  // 장소 추가 패널 이름 칸 Enter → 추가
  if (e.key == "Enter" && t.dataset && t.dataset.ad == "name") { e.preventDefault(); commitAdd(); return; }
  // 카드에 포커스 + Enter → 열기
  if (e.key == "Enter" && t.classList && t.classList.contains("pcard")) t.click();
}

function onInput(e) {
  if (e.target.id == "fa" || e.target.id == "fk") fx(e.target.id);
  if (e.target.dataset.dr) draftInput(e.target);
}

export function bindInputs() {
  document.addEventListener("change", onChange);
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("input", onInput);
}
