// data-a="..." 버튼·카드 클릭 처리
import { S, UI, cur, moveTo, removePlace } from "../state.js";
import { newPrep } from "../constants.js";
import { SEED } from "../seed.js";
import { todayDay, isPhone } from "../utils.js";
import { render } from "../render.js";
import { G } from "../google/gm.js";
import { fit, pick } from "../google/map.js";
import { loadHours } from "../google/places.js";

// 지도 크기가 바뀌는 전환 뒤에 다시 맞추기
const refit = () => setTimeout(() => { if (G.map) google.maps.event.trigger(G.map, "resize"); fit(); }, 60);

function deleteDay(c, n) {
  if (c.nd <= 1) { alert("Day는 최소 1개는 남겨야 해요"); return false; }
  const k = c.rows.filter(r => r.d == n).length;
  if (!confirm("Day " + n + "를 삭제할까요?" + (k ? "\n(이 Day의 장소 " + k + "곳은 보관함으로 옮겨져요)" : ""))) return false;
  c.rows.filter(r => r.d == n).forEach(r => moveTo(r, 0));
  c.rows.forEach(r => { if (r.d > n) r.d--; });
  c.nd--;
  UI.focus = 0;
  return true;
}

function onClick(e) {
  // 메뉴 바깥을 누르면 메뉴 닫기 (누른 버튼 동작은 계속 진행)
  if (UI.menu && !e.target.closest(".mn") && !e.target.closest("[data-a=menu]")) {
    UI.menu = null;
    if (!e.target.closest("[data-a]")) { render(); return; }
  }

  const b = e.target.closest("[data-a]");
  if (!b) return;
  const a = b.dataset.a, c = cur(), d = +b.dataset.d || 0;

  switch (a) {
    // ----- 상단 -----
    case "menu": UI.menu = UI.menu == b.dataset.m ? null : b.dataset.m; break;
    case "sel": S.sel = +b.dataset.i; Object.assign(UI, { open: null, sel: null, focus: 0, menu: null, catF: "" }); render(); refit(); return;
    case "addc":
      S.cs.push({ n: "새 나라", f: "🏳️", cur: "$", rate: 0, nd: 3, tr: {}, rows: [], wish: [], prep: newPrep() });
      S.sel = S.cs.length - 1; S.tab = "plan"; Object.assign(UI, { mode: "plan", open: null, focus: 0, menu: "country" });
      break;
    case "sample": S.cs.push(SEED().cs[0]); S.sel = S.cs.length - 1; S.tab = "plan"; Object.assign(UI, { open: null, focus: 0, menu: null }); render(); refit(); return;
    case "delc":
      if (!confirm(c.n + " 계획을 통째로 삭제할까요?")) return;
      S.cs.splice(S.sel, 1); S.sel = Math.max(0, S.sel - 1); Object.assign(UI, { open: null, focus: 0, menu: null });
      break;
    case "tab": S.tab = b.dataset.t; UI.open = null; window.scrollTo(0, 0); render(); refit(); return;
    case "mode":
      UI.mode = b.dataset.m; UI.sel = null; UI.open = null; UI.mapOn = false;
      if (UI.mode == "dash") UI.focus = todayDay(c) || (isPhone() ? 1 : 0); // 여행 중이면 오늘 Day
      render(); refit(); return;

    // ----- Day · 지도 -----
    case "focus": UI.focus = UI.focus == d ? 0 : d; UI.sel = null; render(); fit(); return;
    case "edit": UI.mode = "plan"; UI.focus = d; render(); refit(); return;
    case "addday": c.nd++; break;
    case "delday": UI.menu = null; if (!deleteDay(c, d)) { render(); return; } break;
    case "hc": S.hc = !S.hc; break;
    case "mapt": UI.mapOn = !UI.mapOn; render(); refit(); return;
    case "pin": pick(b.dataset.k); return;

    // ----- 장소 -----
    case "open": pick(b.dataset.k); return;
    case "cat": UI.catF = b.dataset.c; break;
    case "manual": {
      const o = { p: "", id: "", la: null, lo: null, c: "관광", w: 0, m: "", d, s: "필수" };
      c.rows.push(o); UI.open = { o };
      break;
    }
    case "wmanual": {
      if (!c) return;
      const n = prompt("장소 이름");
      if (!n || !n.trim()) return;
      const o = { p: n.trim(), id: "", la: null, lo: null, c: "관광", m: "", w: 0 };
      c.wish.push(o); UI.open = { o };
      break;
    }

    // ----- 상세 패널 -----
    case "close": UI.open = null; break;
    case "setc": UI.open.o.c = b.dataset.c; break;
    case "hrs": loadHours(UI.open && UI.open.o); return;
    case "odel": {
      const o = UI.open && UI.open.o;
      if (!o || !confirm("'" + (o.p || "이름 없는 장소") + "' 을(를) 삭제할까요?")) return;
      removePlace(o); UI.open = null;
      break;
    }

    // ----- 준비 탭 -----
    case "add": c.prep.bk.push({ t: "항공", n: "", d: "", no: "" }); break;
    case "del": c.prep[b.dataset.l].splice(+b.dataset.i, 1); break;

    default: return;
  }
  render();
}

export function bindActions() {
  document.addEventListener("click", onClick);
  // Esc로 패널·메뉴 닫기
  document.addEventListener("keydown", e => {
    if (e.key != "Escape" || !(UI.open || UI.menu)) return;
    UI.open = null; UI.menu = null; render();
  });
}
