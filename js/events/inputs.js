// 입력칸 변경 · Enter 키 · 환율 계산기
import { S, UI, cur, moveTo, byKey } from "../state.js";
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
    if (f == "done") { o.done = t.checked ? 1 : 0; renderMain(); return; }  // 다녀왔어요
    o[f] = f == "w" ? +v || 0 : v;
    renderMain();                                                // 패널은 그대로 (포커스 유지)
    if (f == "s") renderDrawer();
    return;
  }

  // 여행 설정: 기본 이동수단
  if (t.dataset.set == "mode") { S.mode = t.value; render(); return; }
  // 예산 탭: 다녀옴 체크 · 실제 금액
  if (t.dataset.bd) {
    const o = byKey(t.dataset.k);
    if (!o) return;
    if (t.dataset.bd == "done") o.done = t.checked ? 1 : 0;
    else if (t.value === "") delete o.paid; else o.paid = +t.value || 0;
    render();
    return;
  }
  if (t.dataset.ex) return; // 예산 탭 추가 지출 입력칸 ([+ 추가]를 눌러야 반영)
  // 구글 목록 링크 수정 (새 링크 칸은 [확인]을 눌러야 반영)
  if (t.dataset.gl == "url") { const e = c && c.gl[+t.dataset.i]; if (e && t.value.trim()) e.url = t.value.trim(); render(); return; }
  if (t.dataset.gl) return;

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
  // 구글 목록 새 링크 칸에서 Enter → [확인]
  if (e.key == "Enter" && t.dataset && t.dataset.gl == "new" && !e.isComposing) { e.preventDefault(); document.querySelector("[data-a=gladd]").click(); return; }
  // 예산 탭 추가 지출 칸에서 Enter → [+ 추가]
  if (e.key == "Enter" && t.dataset && t.dataset.ex && !e.isComposing) { e.preventDefault(); t.closest(".exadd").querySelector("[data-a=exadd]").click(); return; }
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
