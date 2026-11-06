// 시작점: 이벤트 연결 → 첫 화면 → (키가 있으면) 구글 지도 로드
import { API_KEY } from "./config.js";
import { $ } from "./utils.js";
import { render } from "./render.js";
import { init } from "./google/map.js";
import { bindActions } from "./events/actions.js";
import { bindInputs } from "./events/inputs.js";

bindActions();
bindInputs();

if (!API_KEY || API_KEY === "YOUR_API_KEY") {
  // 키가 없으면 검색 대신 안내, 지도는 간이 지도로
  $("#sw").innerHTML = `<div class="search">🔍 장소 검색은 지도 키가 필요해요<small>js/config.js의 API_KEY</small></div>`;
  render();
} else {
  render();
  window.gmInit = init; // 구글 스크립트가 로드되면 호출하는 콜백
  const s = document.createElement("script");
  s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(API_KEY) + "&v=weekly&loading=async&language=ko&libraries=places,marker,routes&callback=gmInit";
  s.async = true;
  document.head.appendChild(s);
}
