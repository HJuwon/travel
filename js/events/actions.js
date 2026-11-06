// data-a="..." 버튼 클릭 처리
import { S, cur } from "../state.js";
import { DL, newPrep } from "../constants.js";
import { SEED } from "../seed.js";
import { hasXY } from "../utils.js";
import { render } from "../render.js";
import { G } from "../google/gm.js";
import { fit, choose, card } from "../google/map.js";
import { autofill, loadHours } from "../google/places.js";

// 삭제 모드에서 항목 선택/해제. 처리했으면 true
function toggleDeleteSelect(e) {
  if (!S.del) return false;
  const d = e.target.closest("[data-del]");
  if (!d) return false;
  const k = d.dataset.del;
  if (k.split(":")[0] == S.del) {
    if (S.dsel[k]) delete S.dsel[k]; else S.dsel[k] = 1;
    render();
  }
  return true;
}

// 선택 삭제 실행
function deleteSelected(c) {
  const ks = Object.keys(S.dsel), t = S.del;
  if (!ks.length) { alert("삭제할 항목을 먼저 눌러 선택해 주세요"); return false; }
  const ix = ks.map(k => +k.split(":")[1]).sort((x, y) => y - x); // 뒤에서부터 지워야 인덱스가 안 꼬임

  if (t == "day") {
    const n = c.rows.filter(r => ix.includes(r.d)).length;
    if (ix.length >= c.nd) { alert("Day는 최소 1개는 남겨야 해요"); return false; }
    if (!confirm("Day " + ix.slice().reverse().join(", ") + " 을(를) 삭제할까요?" + (n ? "\n(그 Day의 장소 " + n + "곳도 함께 삭제돼요)" : ""))) return false;
    c.rows = c.rows.filter(r => !ix.includes(r.d));
    c.rows.forEach(r => { r.d -= ix.filter(x => x < r.d).length; });
    c.nd -= ix.length;
    S.day = 0;
  } else {
    if (!confirm(DL[t] + " " + ix.length + "개를 삭제할까요?")) return false;
    if (t == "r") ix.forEach(i => c.rows.splice(i, 1));
    else if (t == "c") { ix.forEach(i => S.cs.splice(i, 1)); S.sel = Math.max(0, Math.min(S.sel, S.cs.length - 1)); }
    else ix.forEach(i => c.prep[t].splice(i, 1));
  }
  S.del = false; S.dsel = {}; S.pin = -1;
  return true;
}

// 위시에서 고른 장소들을 Day에 배치
function placeWish(c) {
  const ks = Object.keys(S.wsel).map(Number).sort((x, y) => x - y);
  if (!ks.length) return false;
  let d = S.wd || "1";
  if (d == "new") { c.nd++; d = c.nd; } else d = Math.min(+d, c.nd);
  const moved = ks.map(i => {
    const w = c.wish[i];
    return { p: w.p, id: w.id || "", la: w.la, lo: w.lo, c: w.c || "관광", w: 0, m: w.m || "", d, s: "필수" };
  });
  c.rows.push(...moved);
  c.wish = c.wish.filter((_, i) => !S.wsel[i]);
  S.wsel = {}; S.wd = String(d);
  S.wmsg = "Day " + d + "에 " + moved.length + "곳을 배치했어요"; S.wmd = d;
  if (G.Place) moved.forEach(r => { if (r.id) autofill(new G.Place({ id: r.id }), r); });
  return true;
}

function onClick(e) {
  if (toggleDeleteSelect(e)) return;

  // ⋯ 메뉴 바깥 클릭 → 메뉴 닫기
  if (S.menu && !e.target.closest(".mn,[data-a=menu]") && !e.target.closest("[data-a]")) { S.menu = false; render(); return; }

  const b = e.target.closest("[data-a]");
  if (!b) return;
  const a = b.dataset.a, c = cur();
  if (a != "menu" && S.menu) { S.menu = false; if (a == "delday" || a == "delc" || a == "addday") render(); }

  switch (a) {
    // ----- 나라 · 탭 · Day -----
    case "sel": S.sel = +b.dataset.i; S.pin = -1; S.day = 0; S.dsel = {}; S.wsel = {}; render(); fit(); return;
    case "tab":
      S.tab = b.dataset.t; S.wmsg = ""; window.scrollTo(0, 0); render();
      if (G.map) { google.maps.event.trigger(G.map, "resize"); setTimeout(fit, 60); }
      return;
    case "day": S.day = +b.dataset.d; S.pin = -1; render(); fit(); return;
    case "addday": c.nd++; S.day = c.nd; break;
    case "addc":
      S.cs.push({ n: "새 나라", f: "🏳️", cur: "$", rate: 0, nd: 3, tr: {}, rows: [], wish: [], prep: newPrep() });
      S.sel = S.cs.length - 1; S.pin = -1; S.day = 0; S.tab = "plan";
      break;
    case "delc":
      if (!confirm(c.n + " 계획을 삭제할까요?")) return;
      S.cs.splice(S.sel, 1); S.sel = Math.max(0, S.sel - 1); S.pin = -1; S.day = 0;
      break;
    case "sample": S.cs.push(SEED().cs[0]); S.sel = S.cs.length - 1; S.pin = -1; S.day = 0; S.tab = "plan"; break;
    case "delday": {
      const n = S.day;
      if (!n) { alert("삭제할 Day를 위에서 먼저 선택해 주세요"); return; }
      if (c.nd <= 1) { alert("Day는 최소 1개는 남겨야 해요"); return; }
      const k = c.rows.filter(r => r.d == n).length;
      if (!confirm("Day " + n + "를 삭제할까요?" + (k ? "\n(장소 " + k + "곳도 함께 삭제돼요)" : ""))) return;
      c.rows = c.rows.filter(r => r.d != n);
      c.rows.forEach(r => { if (r.d > n) r.d--; });
      c.nd--; S.day = 0; S.pin = -1;
      break;
    }
    case "menu": S.menu = S.menu == b.dataset.m ? false : b.dataset.m; break;
    case "hc": S.hc = !S.hc; S.pin = -1; break;
    case "view":
      S.view = b.dataset.v; render();
      if (G.map) setTimeout(() => { google.maps.event.trigger(G.map, "resize"); fit(); }, 60);
      return;

    // ----- 일정 장소 -----
    case "pin":
      if (S.pin == +b.dataset.i) { S.pin = -1; if (G.iw) G.iw.close(); render(); return; }
      choose(+b.dataset.i);
      return;
    case "manual": c.rows.push({ p: "", id: "", la: null, lo: null, c: "관광", w: 0, m: "", d: S.day || 1, s: "필수" }); S.pin = c.rows.length - 1; break;
    case "delr": {
      const q = c.rows[+b.dataset.i];
      if (!confirm("'" + (q.p || "이름 없는 장소") + "' 장소를 삭제할까요?")) return;
      c.rows.splice(+b.dataset.i, 1); S.pin = -1;
      break;
    }
    case "mv": { // 같은 Day 안에서 위/아래로
      const i = +b.dataset.i, dir = +b.dataset.dir, d = c.rows[i].d;
      let j = i + dir;
      while (j >= 0 && j < c.rows.length && c.rows[j].d != d) j += dir;
      if (j >= 0 && j < c.rows.length) { [c.rows[i], c.rows[j]] = [c.rows[j], c.rows[i]]; S.pin = j; }
      break;
    }
    case "hrs": loadHours(+b.dataset.i); return;
    case "tow": { // 일정 → 위시
      const i = +b.dataset.i, q = c.rows[i];
      c.wish.push({ p: q.p, id: q.id || "", la: q.la, lo: q.lo, c: q.c, m: q.m || "" });
      c.rows.splice(i, 1); S.pin = -1;
      break;
    }

    // ----- 준비 탭 -----
    case "add": c.prep.bk.push({ t: "항공", n: "", d: "", no: "" }); break;
    case "del": c.prep[b.dataset.l].splice(+b.dataset.i, 1); break;

    // ----- 삭제 모드 -----
    case "delmode": S.del = b.dataset.t; S.dsel = {}; S.pin = -1; break;
    case "delcancel": S.del = false; S.dsel = {}; break;
    case "delgo": if (!deleteSelected(c)) return; break;

    // ----- 위시 -----
    case "wclear": S.wsel = {}; break;
    case "wall": {
      const all = c.wish.every((_, i) => S.wsel[i]);
      S.wsel = {};
      if (!all) c.wish.forEach((_, i) => S.wsel[i] = 1);
      break;
    }
    case "wdel": {
      const w = c.wish[+b.dataset.i];
      if (!confirm("‘" + (w.p || "이름 없는 장소") + "’ 을(를) 위시에서 삭제할까요?")) return;
      c.wish.splice(+b.dataset.i, 1); S.wsel = {};
      break;
    }
    case "wmanual": {
      const n = prompt("장소 이름");
      if (!n || !n.trim()) return;
      c.wish.push({ p: n.trim(), id: "", la: null, lo: null, c: "관광", m: "" });
      break;
    }
    case "wpan": {
      const w = c.wish[+b.dataset.i];
      if (G.map && hasXY(w)) {
        G.map.panTo({ lat: w.la, lng: w.lo }); G.map.setZoom(15);
        G.iw.setContent(card(w.p, null)); G.iw.setPosition({ lat: w.la, lng: w.lo }); G.iw.open({ map: G.map });
      }
      return;
    }
    case "gotoday": S.tab = "plan"; S.day = +b.dataset.d || 0; S.wmsg = ""; S.pin = -1; render(); fit(); return;
    case "wplace": if (!placeWish(c)) return; break;
  }
  render();
}

export function bindActions() {
  document.addEventListener("click", onClick);
}
