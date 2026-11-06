// Day 칩 · Day 메뉴(추가/삭제) · 이동수단 · 후보 표시 토글
import { S, cur } from "../state.js";
import { MODES } from "../constants.js";
import { $ } from "../utils.js";

export function renderDays() {
  const c = cur(), bx = $("#days").parentNode.parentNode;
  bx.hidden = !c || S.tab == "wish";
  if (!c) { $("#days").innerHTML = $("#dact").innerHTML = $("#dtools").innerHTML = ""; return; }

  let h = `<button class="chip ${S.day == 0 ? "on" : ""}" data-a="day" data-d="0">전체</button>`;
  for (let d = 1; d <= c.nd; d++) {
    h += `<button class="chip ${S.day == d ? "on" : ""}${S.dsel["day:" + d] ? " sl" : ""}" data-del="day:${d}" data-a="day" data-d="${d}">Day ${d}</button>`;
  }
  $("#days").innerHTML = h;

  $("#dact").innerHTML = `<button class="sm" data-a="menu" data-m="day" title="Day 더 보기" aria-label="Day 더 보기">⋯</button>${S.menu == "day"
    ? `<div class="mn"><button data-a="addday">+ Day 추가</button>${S.day
      ? `<button class="dg" data-a="delday">Day ${S.day} 삭제</button>`
      : `<div class="mt" style="padding-bottom:8px">삭제하려면 Day를 먼저 선택하세요</div>`}</div>`
    : ""}`;

  $("#dtools").innerHTML = `<label title="카드 사이의 이동시간을 이 수단 기준으로 계산해요 (지도 키 필요)">이동시간<select data-mode="1" aria-label="이동시간 계산 기준">${Object.keys(MODES).map(k => `<option value="${k}" ${k == S.mode ? "selected" : ""}>${MODES[k]}</option>`).join("")}</select></label><span class="sp"></span><button class="swg" data-a="hc" role="switch" aria-checked="${!S.hc}">후보 표시<span class="tg2${S.hc ? "" : " on"}"></span></button>`;
}
