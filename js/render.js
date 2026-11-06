// 상태(S)가 바뀔 때마다 전체 화면을 다시 그림 + 저장
import { S, save } from "./state.js";
import { $ } from "./utils.js";
import { renderCountries, renderHeader } from "./views/header.js";
import { renderDays } from "./views/days.js";
import { renderDelbar } from "./views/delbar.js";
import { renderPlan } from "./views/plan.js";
import { renderWish } from "./views/wish.js";
import { renderPrep } from "./views/prep.js";
import { renderBudget } from "./views/budget.js";
import { renderWeather } from "./views/weather.js";
import { drawMarkers } from "./google/map.js";
import { legs } from "./google/routes.js";

export function render() {
  renderCountries();
  renderHeader();
  renderDelbar();
  renderDays();
  document.body.classList.toggle("delm", !!S.del);

  // 탭별로 보일 영역
  $("#plan").hidden = !(S.tab == "plan" || S.tab == "wish");
  $("#sheet").hidden = S.tab == "wish";
  $("#wish").hidden = S.tab != "wish";
  $("#prep").hidden = S.tab != "prep";
  $("#bud").hidden = S.tab != "bud";
  $("#wxt").hidden = S.tab != "wx";
  $("#plan").className = "pl";
  document.querySelectorAll(".vt button").forEach(x => x.classList.toggle("on", x.dataset.v == (S.view || "list")));

  renderPlan();
  renderWish();
  renderPrep();
  renderBudget();
  drawMarkers();
  legs();
  renderWeather();
  save();
}
