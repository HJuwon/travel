// 장소 카드 (보관함 · Day 칸 공통)
import { UI } from "../state.js";
import { esc, won } from "../utils.js";
import { ic, cv } from "../icons.js";

// 카드 아랫줄: 운영시간 첫 줄 · 비용
const meta = (o, cu) => [
  o.hrs ? String(o.hrs).split("\n")[0].slice(0, 20) : "",
  o.w ? esc(cu) + won(o.w) : "",
].filter(Boolean).join(" · ") || esc(o.m || o.c);

// o: 장소, k: 키("r3"/"w0"), no: 번호(보관함은 null), cu: 통화, hid: 숨김
export function pcard(o, k, no, cu, hid) {
  const open = UI.open && UI.open.o === o;
  const cand = no != null && o.s == "후보";
  return `<div class="pcard${cand ? " cand" : ""}${open ? " open" : ""}${hid ? " hid" : ""}" data-a="open" data-k="${k}" tabindex="0" style="${cv(o.c)}">`
    + `<span class="ci">${ic(o.c)}</span>`
    + `<div class="cb"><b>${esc(o.p) || "(이름 없음)"}</b><small>${meta(o, cu)}</small></div>`
    + (no != null ? `<span class="no">${no}</span>` : "")
    + `</div>`;
}
