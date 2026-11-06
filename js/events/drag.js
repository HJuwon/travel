// 끌어서 배치하기 (SortableJS)
//   - 마우스: 바로 잡힘 / 터치: 길게 눌러서 잡힘
//   - 보관함 ↔ Day 칸, Day 칸 ↔ Day 칸, 칸 안 순서 변경
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/modular/sortable.esm.js";
import { cur, byKey } from "../state.js";
import { render } from "../render.js";
import { G } from "../google/gm.js";
import { autofill } from "../google/places.js";

const OPT = {
  group: "places",
  animation: 160,
  draggable: ".pcard",
  delay: 250, delayOnTouchOnly: true, touchStartThreshold: 5,
  ghostClass: "ghost", chosenClass: "chosen",
  onStart() { document.body.classList.add("dragging"); },
  onEnd() { document.body.classList.remove("dragging"); setTimeout(sync); },
};

// 같은 요소에 두 번 붙이지 않게
export const sortable = el => Sortable.get(el) || Sortable.create(el, OPT);

// 화면에 놓인 순서 그대로 데이터에 반영
function sync() {
  const c = cur();
  if (!c) return;
  const objs = sel => [...document.querySelectorAll(sel)].map(e => byKey(e.dataset.k)).filter(Boolean);
  const wish = objs("#wishlist .pcard"), rows = [];
  document.querySelectorAll("#board .drop").forEach(z => {
    const d = +z.dataset.d;
    objs(`#board .drop[data-d="${d}"] .pcard`).forEach(o => {
      if (c.wish.includes(o)) { o.s = o.s || "필수"; o.w = o.w || 0; if (o.id && !o.hrs && G.Place) autofill(new G.Place({ id: o.id }), o); }
      o.d = d;
      rows.push(o);
    });
  });
  // 혹시 화면에 없던 항목은 원래 자리 유지
  c.rows.forEach(o => { if (!rows.includes(o) && !wish.includes(o)) rows.push(o); });
  c.wish.forEach(o => { if (!rows.includes(o) && !wish.includes(o)) wish.push(o); });
  c.rows = rows;
  c.wish = wish;
  render();
}
