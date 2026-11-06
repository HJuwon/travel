// 장소 이름을 끌어서 순서 바꾸기 (다른 Day 카드에 놓으면 그 Day로 이동)
import { S, cur } from "../state.js";
import { render } from "../render.js";

let drag = null;
const clearOver = () => document.querySelectorAll(".pc.ov").forEach(x => x.classList.remove("ov"));

export function bindDrag() {
  document.addEventListener("dragstart", e => {
    const t = e.target.closest && e.target.closest("[data-drag]");
    if (!t) return;
    drag = +t.dataset.i;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "x");
  });

  document.addEventListener("dragover", e => {
    const tr = e.target.closest && e.target.closest(".pc[data-row]");
    if (drag != null && tr) { e.preventDefault(); clearOver(); tr.classList.add("ov"); }
  });

  document.addEventListener("drop", e => {
    const tr = e.target.closest && e.target.closest(".pc[data-row]");
    if (drag == null || !tr) return;
    e.preventDefault();
    const c = cur(), j = +tr.dataset.row, d = c.rows[j].d, [m] = c.rows.splice(drag, 1);
    m.d = d;
    const at = drag < j ? j - 1 : j;
    c.rows.splice(at, 0, m);
    S.pin = at; drag = null;
    render();
  });

  document.addEventListener("dragend", () => { drag = null; clearOver(); });
}
