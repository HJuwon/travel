// 위시 탭: 가고 싶은 곳 목록 (골라서 Day에 배치)
import { S, cur } from "../state.js";
import { CATS } from "../constants.js";
import { $, esc, gq } from "../utils.js";

export function renderWish() {
  const c = cur(), el = $("#wish");
  if (!c) { el.innerHTML = ""; return; }
  const W = c.wish, sel = S.wsel;

  let h = `<div class="lbox"><div class="dh"><b>📌 가고 싶은 곳 ${W.length}곳</b><span>골라서 Day에 배치해요</span></div>`;
  if (S.wmsg) h += `<div class="wmsg"><span>✓ ${esc(S.wmsg)}</span><button class="ic" data-a="gotoday" data-d="${S.wmd}">일정 보기</button></div>`;
  if (!W.length) h += `<div class="empty">위 검색창에서 장소를 검색하거나,<br>지도의 장소 아이콘을 눌러 모아 보세요.</div>`;

  W.forEach((w, i) => {
    h += `<div class="stop"><input class="wck" type="checkbox" data-wsel="${i}" ${sel[i] ? "checked" : ""} aria-label="선택"><div class="pc${sel[i] ? " sel" : ""}"><div class="ph"><span class="nm" data-a="wpan" data-i="${i}">${esc(w.p) || "(이름 없음)"}</span><a class="go" target="_blank" rel="noopener" href="${gq(w)}">구글맵</a><button class="xb" data-a="wdel" data-i="${i}" aria-label="삭제">✕</button></div><div class="row" style="margin:6px 0 0"><select data-w="${i}" data-k="c" style="width:auto">${CATS.map(x => `<option ${x == w.c ? "selected" : ""}>${x}</option>`).join("")}</select><input data-w="${i}" data-k="m" placeholder="메모 (예: 오전 추천)" value="${esc(w.m)}"></div></div></div>`;
  });

  h += `<div class="acts"><button class="p" data-a="wmanual">+ 직접 추가</button>${W.length ? `<button data-a="wall">${W.every((_, i) => sel[i]) ? "전체 해제" : "전체 선택"}</button>` : ""}</div></div>`;
  el.innerHTML = h;
}
