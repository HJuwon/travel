// 상태가 바뀔 때마다 화면을 다시 그림 + 저장
import { S, UI, cur, save } from "./state.js";
import { $ } from "./utils.js";
import { renderHeader } from "./views/header.js";
import { renderWish, renderBoard } from "./views/board.js";
import { renderDash } from "./views/dash.js";
import { renderDrawer } from "./views/drawer.js";
import { renderPrep } from "./views/prep.js";
import { renderBudget } from "./views/budget.js";
import { renderWeather } from "./views/weather.js";
import { placeMap, drawMarkers } from "./google/map.js";
import { legs } from "./google/routes.js";

// 상세 패널을 뺀 나머지 (패널에서 입력 중일 때 포커스가 안 날아가게)
export function renderMain() {
  const c = cur(), plan = S.tab == "plan";
  // 열린 장소가 지워졌으면 패널 닫기
  if (UI.open && !(c && (c.rows.includes(UI.open.o) || c.wish.includes(UI.open.o)))) UI.open = null;

  renderHeader();
  $("#planner").hidden = !(plan && UI.mode == "plan");
  $("#dash").hidden = !(plan && UI.mode == "dash");
  $("#prep").hidden = S.tab != "prep";
  $("#bud").hidden = S.tab != "bud";
  $("#wxt").hidden = S.tab != "wx";
  $("#planner").classList.toggle("mapon", UI.mapOn);

  if (plan) {
    placeMap();
    if (UI.mode == "plan") { renderWish(); renderBoard(); } else renderDash();
    drawMarkers();
    legs();
  }
  renderPrep();
  renderBudget();
  renderWeather();
  save();
}

export function render() {
  renderMain();
  renderDrawer();
}
