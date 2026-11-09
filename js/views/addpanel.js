// 장소 추가 패널: 검색(자동완성) → 고른 장소 미리보기(영업시간 자동 불러옴) → [추가] 눌러야 추가
//   + 검색이 안 되는 곳은 이름만 입력해서 추가
import { UI, cur } from "../state.js";
import { CATS } from "../constants.js";
import { $, esc, toast } from "../utils.js";
import { ic, cv, guessCat } from "../icons.js";
import { G } from "../google/gm.js";
import { fmtHours } from "../google/places.js";
import { panTo } from "../google/map.js";
import { render } from "../render.js";

let ac = null; // 자동완성 입력 요소 (다시 그려도 같은 요소를 계속 씀)

function searchEl() {
  if (!G.Place || !G.PAC) return null;
  if (!ac) {
    ac = new G.PAC();
    const onSel = e => { const pp = e.placePrediction; startPick(pp ? pp.toPlace() : e.place); };
    ac.addEventListener("gmp-select", onSel);
    ac.addEventListener("gmp-placeselect", onSel);
  }
  return ac;
}

// d = 0 이면 보관함, 1 이상이면 그 Day에 넣을 장소를 고르는 패널 열기
export function openAdd(d = 0) {
  UI.open = null;
  UI.add = { d, pv: null, busy: false };
  const s = searchEl();
  if (s) {
    try { s.value = ""; } catch (e) {}
    try { if (G.map && G.map.getBounds()) s.locationBias = G.map.getBounds(); } catch (e) {}
  }
  render();
  setTimeout(() => { try { (searchEl() || $("[data-ad=name]")).focus(); } catch (e) {} }, 80);
}

// 검색 결과를 골랐을 때: 정보를 불러와 미리보기만 보여 줌 (아직 추가 안 됨)
export async function startPick(place) {
  if (!UI.add) UI.add = { d: 0, pv: null, busy: false };
  const A = UI.add;
  UI.open = null;
  A.busy = true;
  render();
  try {
    await place.fetchFields({ fields: ["displayName", "location", "formattedAddress", "types", "rating", "userRatingCount", "regularOpeningHours", "websiteUri", "priceLevel"] });
    const pv = { p: place.displayName, id: place.id, la: place.location.lat(), lo: place.location.lng(), c: guessCat(place.types), w: 0, m: "" };
    const f = fmtHours(place.regularOpeningHours);
    if (f) { pv.hrs = f.text; if (f.brk) pv.brk = f.brk; }
    if (place.websiteUri) pv.web = place.websiteUri;
    if (String(place.priceLevel).indexOf("FREE") > -1) pv.fee = "무료";
    A.pv = pv;
    A.x = { addr: place.formattedAddress || "", rating: place.rating, n: place.userRatingCount };
  } catch (e) {
    console.error(e);
    toast("장소 정보를 불러오지 못했어요");
  }
  A.busy = false;
  if (UI.add === A) render();
}

// [추가] 버튼
export function commitAdd() {
  const A = UI.add, c = cur();
  if (!A || !c) return;
  const inp = $("[data-ad=name]");
  const name = ((inp && inp.value) || (A.pv && A.pv.p) || "").trim();
  if (!name) { toast("장소를 검색하거나 이름을 입력하세요"); return; }
  const o = A.pv ? { ...A.pv, p: name } : { p: name, id: "", la: null, lo: null, c: "관광", w: 0, m: "" };
  if (A.d) { o.d = A.d; o.s = "필수"; c.rows.push(o); } else c.wish.push(o);
  UI.add = null;
  render();
  toast("✓ " + name + " → " + (A.d ? "Day " + A.d : "보관함"));
  panTo(o);
}

export function renderAdd(el) {
  const A = UI.add, c = cur(), pv = A.pv, x = A.x || {};
  const dest = `<label class="f">추가할 위치<select data-ad="at"><option value="0" ${A.d ? "" : "selected"}>보관함</option>${Array.from({ length: c.nd }, (_, k) => `<option value="${k + 1}" ${A.d == k + 1 ? "selected" : ""}>Day ${k + 1}</option>`).join("")}</select></label>`;

  let body = "";
  if (A.busy) body += `<div class="empty">장소 정보를 불러오는 중…</div>`;
  else if (pv) {
    body += `<div class="pv" style="${cv(pv.c)}">
      ${x.addr ? `<div class="mu">${esc(x.addr)}</div>` : ""}
      ${x.rating ? `<div>⭐ ${x.rating} <span class="mu">(${x.n || 0})</span></div>` : ""}
      <div class="segc" style="margin-top:8px">${CATS.map(k => `<button class="cf${pv.c == k ? " on" : ""}" data-a="adc" data-c="${k}" style="${cv(k)}">${ic(k, 13)}${k}</button>`).join("")}</div>
      <div class="f" style="margin-top:8px">영업시간 (자동)<div class="hrs">${pv.hrs ? esc(pv.hrs) : "구글에 영업시간 정보가 없어요"}</div></div>
      ${pv.brk ? `<div class="mu">브레이크타임 ${esc(pv.brk)}</div>` : ""}
    </div>
    <button class="btn" data-a="addreset" style="align-self:flex-start">다른 장소 검색</button>`;
  } else {
    body += `<div class="f">장소 검색<div id="addsearch" class="sw">${G.Place ? "" : `<div class="search">🔍 검색은 지도 키가 필요해요<small>js/keys.js의 API_KEY</small></div>`}</div></div>`
      + (G.map ? `<button class="btn xmapb" data-a="xmap">🗺 지도에서 둘러보며 찾기 <small>음식점·카페·명소…</small></button>` : "");
  }

  el.innerHTML = `<div class="dhd"><span class="ci" style="--c:var(--accent)">＋</span><b class="atl">장소 추가</b><button class="x" data-a="close" aria-label="닫기">✕</button></div>
  <div class="dbody addb">
    ${body}
    <label class="f">${pv ? "이름" : "검색이 안 되면 이름만 직접 입력"}<input data-ad="name" placeholder="장소 이름" value="${esc(pv ? pv.p : "")}"></label>
    ${dest}
    <p class="mu" style="margin:0">아래 [추가]를 눌러야 일정에 들어가요.</p>
  </div>
  <div class="dft"><button class="btn p" data-a="addgo">추가</button><button class="btn" data-a="close">취소</button></div>`;

  const slot = $("#addsearch"), s = searchEl();
  if (slot && s) slot.appendChild(s);
}
