// 구글 지도: 초기화 · 카테고리 마커/동선 · 범위 맞추기 · 장소 고르기
import { G } from "./gm.js";
import { addPlace } from "./places.js";
import { setupExplore } from "./explore.js";
import { legs } from "./routes.js";
import { S, UI, cur, byKey } from "../state.js";
import { $, esc, hasXY, toast } from "../utils.js";
import { color } from "../colors.js";
import { render } from "../render.js";
import { mapData, pinHTML, renderMapHead, drawMini } from "../views/mapview.js";

export async function init() {
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");
  ({ AdvancedMarkerElement: G.AME } = await google.maps.importLibrary("marker"));
  const pl = await google.maps.importLibrary("places");
  G.Place = pl.Place;
  G.PAC = pl.PlaceAutocompleteElement;
  G.Rank = pl.SearchNearbyRankPreference;
  try { ({ Route: G.Route } = await google.maps.importLibrary("routes")); } catch (e) {}

  const el = $("#map");
  el.classList.remove("mini");
  el.innerHTML = "";
  G.map = new Map(el, { center: { lat: 30, lng: 20 }, zoom: 2, mapId: "DEMO_MAP_ID", streetViewControl: false, mapTypeControl: false, fullscreenControl: false });
  G.iw = new InfoWindow();
  setupExplore(el); // 지도 위 "주변 찾기"


  // 지도 위 관광지 아이콘 클릭 → 정보창 + 추가 버튼
  G.map.addListener("click", async e => {
    if (!e.placeId) return;
    e.stop();
    try {
      const p = new G.Place({ id: e.placeId });
      await p.fetchFields({ fields: ["displayName", "location", "formattedAddress", "rating", "userRatingCount", "reviews", "googleMapsURI"] });
      const d = card(p.displayName, p);
      addBtns(d, p);
      G.iw.setContent(d);
      G.iw.setPosition(p.location);
      G.iw.open({ map: G.map });
    } catch (err) { console.error(err); }
  });

  render();
  fit();
  legs();
}

// 평점·리뷰 카드 (정보창, 상세 패널 공용)
export function card(name, p) {
  const d = document.createElement("div");
  d.className = "iw";
  let h = `<b>${esc(name)}</b>`;
  if (p && p.rating) h += `<div>⭐ ${p.rating} <span class="muted">(${p.userRatingCount || 0})</span></div>`;
  (p && p.reviews || []).slice(0, 3).forEach(v => {
    const t = String(v.text || "");
    h += `<div class="rv">⭐${v.rating} · ${esc(v.authorAttribution ? v.authorAttribution.displayName : "")}<br>${esc(t.length > 110 ? t.slice(0, 110) + "…" : t)}</div>`;
  });
  if (p && p.googleMapsURI) h += `<div style="margin-top:6px"><a target="_blank" rel="noopener" href="${p.googleMapsURI}">구글맵에서 리뷰 전체 보기</a></div>`;
  d.innerHTML = h;
  return d;
}

// 정보창 아래 "+ 보관함 / Day 1 / Day 2 …" 버튼. 추가해도 패널은 안 열고 알림만 (계속 찾고 추가)
export function addBtns(box, p, done) {
  const c = cur();
  if (!c) return;
  const row = document.createElement("div");
  row.className = "iwadd";
  const add = (label, day) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = async () => {
      G.iw.close();
      await addPlace(p, day, false);
      toast("✓ " + (p.displayName || "장소") + " → " + (day ? "Day " + day : "보관함"));
      if (done) done();
    };
    row.appendChild(b);
  };
  add("+ 보관함", 0);
  for (let d = 1; d <= c.nd; d++) add("Day " + d, d);
  box.appendChild(row);
}

// 지도 영역을 지금 화면(계획/대시보드) 쪽으로 옮기기
export function placeMap() {
  const slot = $(UI.mode == "dash" ? "#dslot" : "#pslot"), el = $("#map");
  if (el.parentNode !== slot) {
    slot.appendChild(el);
    if (G.map) setTimeout(() => { google.maps.event.trigger(G.map, "resize"); fit(); }, 60);
  }
}

// 마커·동선 다시 그리기
export function drawMarkers() {
  if (S.tab != "plan") return;
  const { pts, lines } = mapData();
  renderMapHead(pts);
  if (!G.map) { drawMini($("#map"), pts, lines); return; }

  Object.values(G.mk).forEach(m => m.map = null);
  G.mk = {};
  G.lines.forEach(l => l.setMap(null));
  G.lines = [];

  pts.forEach(p => {
    const t = document.createElement("div");
    t.innerHTML = pinHTML(p);
    const pin = t.firstElementChild;
    pin.removeAttribute("data-a"); // 클릭은 아래 gmp-click으로만 처리 (중복 방지)
    const m = new G.AME({ map: G.map, position: { lat: p.o.la, lng: p.o.lo }, content: pin, title: p.o.p, zIndex: p.wish ? 0 : 1 });
    m.addListener("gmp-click", () => pick(p.key));
    G.mk[p.key] = m;
  });
  lines.forEach(L => {
    if (L.length > 1) G.lines.push(new google.maps.Polyline({ map: G.map, path: L.map(o => ({ lat: o.la, lng: o.lo })), strokeColor: color("route"), strokeOpacity: .8, strokeWeight: 3 }));
  });
}

// 보이는 장소가 다 들어오게 범위 맞추기
export function fit() {
  if (!G.map) return;
  const { pts } = mapData();
  const P = pts.filter(p => !p.wish).length ? pts.filter(p => !p.wish) : pts;
  if (!P.length) return;
  if (P.length == 1) { G.map.setCenter({ lat: P[0].o.la, lng: P[0].o.lo }); G.map.setZoom(14); return; }
  const b = new google.maps.LatLngBounds();
  P.forEach(p => b.extend({ lat: p.o.la, lng: p.o.lo }));
  G.map.fitBounds(b, 60);
}

export function panTo(o) {
  if (G.map && o && hasXY(o)) G.map.panTo({ lat: o.la, lng: o.lo });
}

// 카드·마커·후보를 눌렀을 때
//   계획 모드 → 상세 패널 열기 / 대시보드 → 지도에서 강조
export function pick(k) {
  const o = byKey(k);
  if (!o) return;
  if (UI.mode == "dash") {
    UI.sel = UI.sel == k ? null : k;
    if (UI.sel && k[0] == "r") UI.focus = o.d;
    render();
    if (UI.sel) panTo(o);
    return;
  }
  UI.add = null;
  UI.open = { o };
  render();
  panTo(o);
}
