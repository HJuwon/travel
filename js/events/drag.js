// 끌어서 배치하기 (SortableJS)
//   - 마우스: 바로 잡힘 / 터치: 길게 눌러서 잡힘
//   - 보관함 ↔ Day, Day ↔ Day, Day 안 순서 변경
//   - 위쪽 Day 칩에 놓으면 그 Day 맨 아래로 옮김 (지금 화면에 없는 Day로도)
import Sortable from "https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/modular/sortable.esm.js";
import { UI, cur, byKey, moveTo } from "../state.js";
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

// Day 칩: 놓기만 되는 자리. 놓인 카드는 화면에서 지우고, 옮기는 건 sync에서
//   (sync가 화면의 카드 키("r3")로 장소를 찾으니 그 전에 목록 순서를 바꾸면 안 됨)
let toChip = null; // { o, d }
export const chipDrop = el => Sortable.get(el) || Sortable.create(el, {
  group: { name: "places", pull: false, put: true },
  draggable: ".none", sort: false,
  onAdd(e) {
    toChip = { o: byKey(e.item.dataset.k), d: +el.dataset.drop };
    e.item.remove();
  },
});

// 보관함에서 일정으로 온 장소: 영업시간 등이 비어 있으면 구글에서 채움
function fill(o) { if (o.id && !o.hrs && G.Place) autofill(new G.Place({ id: o.id }), o); }

// 화면에 놓인 순서 그대로 데이터에 반영
function sync() {
  const c = cur();
  if (!c) return;
  const objs = sel => [...document.querySelectorAll(sel)].map(e => byKey(e.dataset.k)).filter(Boolean);
  const wish = objs("#wishlist .pcard"), rows = [];
  document.querySelectorAll("#days .drop").forEach(z => {
    const d = +z.dataset.d;
    objs(`#days .drop[data-d="${d}"] .pcard`).forEach(o => {
      if (c.wish.includes(o)) { o.s = o.s || "필수"; o.w = o.w || 0; fill(o); }
      o.d = d;
      rows.push(o);
    });
  });
  // 혹시 화면에 없던 항목은 원래 자리 유지
  c.rows.forEach(o => { if (!rows.includes(o) && !wish.includes(o)) rows.push(o); });
  c.wish.forEach(o => { if (!rows.includes(o) && !wish.includes(o)) wish.push(o); });
  c.rows = rows;
  c.wish = wish;
  if (toChip && toChip.o) {
    const { o, d } = toChip, w = c.wish.includes(o);
    moveTo(o, d);
    if (w) fill(o);
  }
  toChip = null;
  UI.dm = UI.wsel = null; // 카드 순서가 바뀌면 키("r3")가 달라지니 펼침 닫기
  render();
}
