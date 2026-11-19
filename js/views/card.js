// 보관함 장소 카드 (+ 일정 줄에서도 쓰는 아랫줄 글자 meta)
//   누르면 펼쳐지고 지도에서 그 장소를 보여 줌 → [Day 1] [Day 2] … 로 바로 넣기 / ✎ 편집
import { UI, cur } from "../state.js";
import { esc, won, hasXY, gq } from "../utils.js";
import { ic, cv } from "../icons.js";

// 카드 아랫줄: 운영시간 첫 줄 · 비용
export const meta = (o, cu) => [
  o.hrs ? esc(String(o.hrs).split("\n")[0].slice(0, 20)) : "",
  o.w ? esc(cu) + won(o.w) : "",
].filter(Boolean).join(" · ") || esc(o.m || o.c);

// o: 장소, k: 키("r3"/"w0"), no: 번호(보관함은 null), cu: 통화, hid: 숨김
export function pcard(o, k, no, cu, hid) {
  const open = UI.wsel == k || (UI.open && UI.open.o === o);
  const cand = no != null && o.s == "후보";
  let h = `<div class="pcard${cand ? " cand" : ""}${open ? " open" : ""}${hid ? " hid" : ""}" data-a="wpick" data-k="${k}" tabindex="0" style="${cv(o.c)}" aria-expanded="${open}">`
    + `<span class="ci">${ic(o.c)}</span>`
    + `<div class="cb"><b>${esc(o.p) || "(이름 없음)"}</b><small>${meta(o, cu)}</small></div>`
    + (no != null ? `<span class="no">${no}</span>` : "");
  if (UI.wsel == k) {
    const c = cur();
    h += `<div class="pmore wmore">`
      + (o.addr ? `<div class="mu">${esc(o.addr)}</div>` : "")
      + (hasXY(o) ? "" : `<div class="mu">위치 정보가 없어서 지도에 안 보여요</div>`)
      + `<div class="wdays"><span class="mu">일정에 넣기</span>${Array.from({ length: c.nd }, (_, i) => `<button class="btn" data-a="wday" data-k="${k}" data-d="${i + 1}">Day ${i + 1}</button>`).join("")}</div>`
      + `<div class="pact"><button class="btn" data-a="dopen" data-k="${k}">✎ 편집</button><a class="btn" href="${gq(o)}" target="_blank" rel="noopener">구글맵 ↗</a></div>`
      + `</div>`;
  }
  return h + `</div>`;
}
