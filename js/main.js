// 시작점: 이벤트 연결 → 첫 화면 → (키가 있으면) 구글 지도 로드
import { API_KEY } from "./config.js";
import { $ } from "./utils.js";
import { render } from "./render.js";
import { init } from "./google/map.js";
import { bindActions } from "./events/actions.js";
import { bindInputs } from "./events/inputs.js";
import { bindDrag } from "./events/drag.js";

bindActions();
bindInputs();
bindDrag();
render();

if (!API_KEY || API_KEY === "YOUR_API_KEY") {
  $("#warn").innerHTML = '<div class="warn"><b>js/config.js</b>의 <b>API_KEY</b>에 구글 지도 API 키를 넣으면 지도가 켜져요.</div>';
} else {
  window.gmInit = init; // 구글 스크립트가 로드되면 호출하는 콜백
  const s = document.createElement("script");
  s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(API_KEY) + "&v=weekly&loading=async&language=ko&libraries=places,marker,routes&callback=gmInit";
  s.async = true;
  document.head.appendChild(s);
}
