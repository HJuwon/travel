// data-a="..." 버튼·카드 클릭 처리
import { S, UI, cur, byKey, moveTo, removePlace } from "../state.js";
import { openAdd, commitAdd } from "../views/addpanel.js";
import { newPrep } from "../constants.js";
import { SEED } from "../seed.js";
import { todayDay, isPhone } from "../utils.js";
import { render } from "../render.js";
import { G } from "../google/gm.js";
import { fit, pick } from "../google/map.js";
import { loadHours } from "../google/places.js";
import { clearFound } from "../google/explore.js";
import { logout } from "../sync.js";
import { startEdit, addRow, finishEdit, cancelEdit, startDelete, toggleSel, doDelete } from "../views/prep.js";

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

// 준비 탭 목록이 비어 있으면 카드를 눌렀을 때 바로 새 항목 칸을 열어 줌
const source0 = (c, k) => c.prep[k] && c.prep[k].length;

function onClick(e) {
  if (e.target.closest("a[href]")) return; // 길찾기 등 링크는 그대로 열기
  if (e.target.matches("input,select,textarea")) return; // 입력칸·체크박스는 감싼 카드 동작을 일으키지 않음
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
    case "sel": S.sel = +b.dataset.i; Object.assign(UI, { open: null, sel: null, focus: 0, menu: null, catF: [], add: null }); cancelEdit(); UI.pd = null; clearFound(); render(); refit(); return;
    case "addc":
      S.cs.push({ n: "새 나라", f: "🏳️", cur: "$", rate: 0, nd: 3, tr: {}, rows: [], wish: [], prep: newPrep() });
      S.sel = S.cs.length - 1; S.tab = "plan"; Object.assign(UI, { mode: "plan", open: null, focus: 0, menu: "country" });
      break;
    case "sample": S.cs.push(SEED().cs[0]); S.sel = S.cs.length - 1; S.tab = "plan"; Object.assign(UI, { open: null, focus: 0, menu: null }); render(); refit(); return;
    case "logout": if (confirm("이 기기에서 나갈까요? 다시 들어오려면 비밀번호가 필요해요.")) logout(); return;
    case "delc":
      if (!confirm(c.n + " 계획을 통째로 삭제할까요?")) return;
      S.cs.splice(S.sel, 1); S.sel = Math.max(0, S.sel - 1); Object.assign(UI, { open: null, focus: 0, menu: null });
      break;
    case "tab": S.tab = b.dataset.t; UI.open = null; UI.add = null; cancelEdit(); UI.pd = null; window.scrollTo(0, 0); render(); refit(); return;
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
    case "fold": UI.fold[b.dataset.f] = !UI.fold[b.dataset.f]; render(); refit(); return;
    case "mapt": UI.mapOn = !UI.mapOn; render(); refit(); return;
    case "pin": pick(b.dataset.k); return;

    // ----- 장소 -----
    case "open": pick(b.dataset.k); return;
    case "cat": {   // 종류 필터 (여러 개 선택, 눌러서 켜고 끄기. 빈 값 = 초기화)
      const x = b.dataset.c;
      UI.catF = !x ? [] : UI.catF.includes(x) ? UI.catF.filter(y => y != x) : [...UI.catF, x];
      break;
    }
    case "lmode": { const o = byKey(b.dataset.k); if (o) o.tm = b.dataset.m; break; }  // 구간별 이동수단
    case "manual": openAdd(d); return;     // + 장소 추가 (그 Day로)
    case "wmanual": if (!c) return; openAdd(0); return; // + 직접 추가 (보관함으로)

    // ----- 상세 패널 -----
    case "close": UI.open = null; UI.add = null; break;
    case "adc": if (UI.add && UI.add.pv) UI.add.pv.c = b.dataset.c; break;
    case "addreset": if (UI.add) UI.add.pv = null; break;
    case "addgo": commitAdd(); return;
    case "setc": UI.open.o.c = b.dataset.c; break;
    case "hrs": loadHours(UI.open && UI.open.o); return;
    case "odel": {
      const o = UI.open && UI.open.o;
      if (!o || !confirm("'" + (o.p || "이름 없는 장소") + "' 을(를) 삭제할까요?")) return;
      removePlace(o); UI.open = null;
      break;
    }

    // ----- 준비 탭 -----
    // 카드 누르기 → 수정, [완료] → 반영, 휴지통 → 골라서 삭제 (views/prep.js)
    case "pedit": startEdit(b.dataset.pk, !(b.dataset.pk == "tr" || source0(c, b.dataset.pk))); break;
    case "padd": addRow(); break;
    case "pdone": finishEdit(); break;
    case "pcancel": cancelEdit(); break;
    case "pdel": startDelete(b.dataset.pk); break;
    case "psel": toggleSel(+b.dataset.i); break;
    case "pdelgo": if (!UI.pdSel.length || !confirm(UI.pdSel.length + "개를 " + (UI.pd == "tr" ? "비울까요?" : "삭제할까요?"))) return; doDelete(); break;

    default: return;
  }
  render();
}

export function bindActions() {
  document.addEventListener("click", onClick);
  // Esc로 패널·메뉴 닫기
  document.addEventListener("keydown", e => {
    if (e.key != "Escape" || !(UI.open || UI.menu || UI.add || UI.pe || UI.pd)) return;
    UI.open = null; UI.menu = null; UI.add = null; cancelEdit(); UI.pd = null; render();
  });
}
