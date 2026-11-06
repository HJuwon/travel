// 화면 하단 고정 바: 삭제 모드 안내 / 위시 → Day 배치
import { S, cur } from "../state.js";
import { DL } from "../constants.js";
import { $ } from "../utils.js";

export function renderDelbar() {
  const n = Object.keys(S.dsel).length, wn = Object.keys(S.wsel).length, c = cur();

  if (S.del) {
    $("#delbar").innerHTML = `<div class="warn">🗑 ${DL[S.del]} 삭제 모드 — 지울 항목을 눌러 선택하세요. <b>${n}개 선택됨</b> <button data-a="delgo">선택 삭제</button> <button data-a="delcancel">취소</button></div>`;
  } else if (S.tab == "wish" && wn && c) {
    const opts = Array.from({ length: c.nd }, (_, k) => k + 1)
      .map(d => `<option value="${d}" ${String(S.wd || 1) == String(d) ? "selected" : ""}>Day ${d}</option>`).join("");
    $("#delbar").innerHTML = `<div class="warn wb"><b>${wn}개 선택</b><select data-wd="1" aria-label="배치할 Day">${opts}<option value="new" ${S.wd == "new" ? "selected" : ""}>＋ 새 Day</option></select><button class="p" data-a="wplace">에 배치</button><button data-a="wclear">해제</button></div>`;
  } else {
    $("#delbar").innerHTML = "";
  }
}
