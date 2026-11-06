// 지도 초기화 · 마커/동선 그리기 · 화면 맞추기 · 정보창
import { G } from "./gm.js";
import { addPlace } from "./places.js";
import { legs } from "./routes.js";
import { S, cur, vis, nums } from "../state.js";
import { STC } from "../constants.js";
import { $, esc, hasXY } from "../utils.js";
import { render } from "../render.js";

export async function init() {
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");
  ({ AdvancedMarkerElement: G.AME, PinElement: G.PinEl } = await google.maps.importLibrary("marker"));
  const pl = await google.maps.importLibrary("places");
  G.Place = pl.Place;
  try { ({ Route: G.Route } = await google.maps.importLibrary("routes")); } catch (e) {}

  G.map = new Map($("#map"), { center: { lat: 30, lng: 20 }, zoom: 2, mapId: "DEMO_MAP_ID", streetViewControl: false, mapTypeControl: false, fullscreenControl: false });
  G.iw = new InfoWindow();

  // 검색창 (장소 자동완성)
  const pac = new pl.PlaceAutocompleteElement();
  const onSel = async e => { const pp = e.placePrediction; await addPlace(pp ? pp.toPlace() : e.place); };
  pac.addEventListener("gmp-select", onSel);
  pac.addEventListener("gmp-placeselect", onSel);
  $("#sw").appendChild(pac);

  // 지도 위 관광지 아이콘 클릭 → 정보창 + 추가 버튼
  G.map.addListener("click", async e => {
    if (!e.placeId) return;
    e.stop();
    try {
      const p = new G.Place({ id: e.placeId });
      await p.fetchFields({ fields: ["displayName", "location", "formattedAddress", "rating", "userRatingCount", "reviews", "googleMapsURI"] });
      const d = card(p.displayName, p), b = document.createElement("button");
      b.textContent = S.tab == "wish" ? "+ 위시에 추가" : "+ 일정에 추가";
      b.onclick = () => { G.iw.close(); addPlace(p); };
      d.appendChild(b);
      G.iw.setContent(d);
      G.iw.setPosition(p.location);
      G.iw.open({ map: G.map });
    } catch (err) { console.error(err); }
  });

  drawMarkers(true);
  legs();
}

// 정보창 내용 (평점·리뷰 3개)
export function card(name, p) {
  const d = document.createElement("div");
  d.className = "iw";
  let h = `<b>${esc(name)}</b>`;
  if (p && p.rating) h += `<div>⭐ ${p.rating} <span style="color:#777">(${p.userRatingCount || 0})</span></div>`;
  (p && p.reviews || []).slice(0, 3).forEach(v => {
    const t = String(v.text || "");
    h += `<div class="rv">⭐${v.rating} · ${esc(v.authorAttribution ? v.authorAttribution.displayName : "")}<br>${esc(t.length > 110 ? t.slice(0, 110) + "…" : t)}</div>`;
  });
  if (p && p.googleMapsURI) h += `<div style="margin-top:6px"><a target="_blank" rel="noopener" href="${p.googleMapsURI}">구글맵에서 리뷰 전체 보기</a></div>`;
  d.innerHTML = h;
  return d;
}

// 보이는 장소가 다 들어오게 지도 범위 맞추기
export function fit() {
  if (!G.map || !cur()) return;
  const v = S.tab == "wish" ? cur().wish.filter(hasXY).map(w => ({ r: w })) : vis().filter(o => hasXY(o.r));
  if (!v.length) return;
  if (v.length == 1) { G.map.setCenter({ lat: v[0].r.la, lng: v[0].r.lo }); G.map.setZoom(14); return; }
  const b = new google.maps.LatLngBounds();
  v.forEach(o => b.extend({ lat: o.r.la, lng: o.r.lo }));
  G.map.fitBounds(b, 60);
}

export function drawMarkers(doFit) {
  if (!G.map) return;
  Object.values(G.mk).forEach(m => m.map = null);
  G.mk = {};
  if (G.line) G.line.setMap(null);
  if (!cur()) return;

  // 위시 탭: 보라색 번호 마커
  if (S.tab == "wish") {
    cur().wish.forEach((w, i) => {
      if (!hasXY(w)) return;
      const pin = new G.PinEl({ glyph: String(i + 1), glyphColor: "#fff", background: S.wsel[i] ? "#e5484d" : "#7c5cff", borderColor: "#fff" });
      const m = new G.AME({ map: G.map, position: { lat: w.la, lng: w.lo }, content: pin.element, title: w.p });
      m.addListener("gmp-click", () => { G.iw.setContent(card(w.p, null)); G.iw.open({ map: G.map, anchor: m }); });
      G.mk["w" + i] = m;
    });
    if (doFit) fit();
    return;
  }

  // 일정 탭: 순서 번호 마커 + 동선
  const v = vis(), nm = nums(v);
  v.forEach((o, j) => {
    if (!hasXY(o.r)) return;
    const pin = new G.PinEl({ glyph: String(nm[j]), glyphColor: "#fff", background: o.i == S.pin ? "#e5484d" : (STC[o.r.s] || "#0b84e5"), borderColor: "#fff" });
    const m = new G.AME({ map: G.map, position: { lat: o.r.la, lng: o.r.lo }, content: pin.element, title: o.r.p });
    m.addListener("gmp-click", () => choose(o.i));
    G.mk[o.i] = m;
  });
  G.line = new google.maps.Polyline({
    map: G.map,
    path: v.filter(o => hasXY(o.r) && o.r.s != "후보").map(o => ({ lat: o.r.la, lng: o.r.lo })),
    strokeColor: "#0b84e5", strokeOpacity: .7, strokeWeight: 3,
  });
  if (doFit) fit();
}

// 장소 선택 → 카드 펼치기 + 지도 이동 + 리뷰 정보창
export async function choose(i) {
  S.pin = i;
  render();
  const r = cur().rows[i];
  if (!r || !G.map || !hasXY(r)) return;
  G.map.panTo({ lat: r.la, lng: r.lo });
  G.iw.setContent(card(r.p, null));
  G.iw.open({ map: G.map, anchor: G.mk[i] });
  if (r.id) {
    try {
      const p = new G.Place({ id: r.id });
      await p.fetchFields({ fields: ["rating", "userRatingCount", "reviews", "googleMapsURI"] });
      G.iw.setContent(card(r.p, p));
    } catch (err) { console.error(err); }
  }
}
