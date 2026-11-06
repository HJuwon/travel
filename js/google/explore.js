// 지도 위 "주변 찾기"
//   지금 보이는 지역에서 구글 장소를 종류(음식점·카페·관광명소…)나 검색어로 찾아
//   카테고리 아이콘 핀으로 띄우고, 핀을 눌러 보관함·Day에 바로 추가 (계속 찾고 추가 가능)
import { G } from "./gm.js";
import { addBtns, card, drawMarkers } from "./map.js";
import { UI, cur } from "../state.js";
import { esc, hav, toast } from "../utils.js";
import { ic, cv, guessCat } from "../icons.js";

// 종류 버튼 → 구글 장소 type, 표시할 카테고리
export const FIND = [
  { k: "음식점", c: "식사", t: ["restaurant"] },
  { k: "카페", c: "식사", t: ["cafe", "bakery"] },
  { k: "관광명소", c: "관광", t: ["tourist_attraction", "museum", "historical_landmark"] },
  { k: "쇼핑", c: "쇼핑", t: ["shopping_mall", "department_store", "market"] },
  { k: "숙소", c: "숙소", t: ["lodging"] },
];
const FIELDS = ["id", "displayName", "location", "types", "rating", "userRatingCount"];

let bar, mk = [], last = null; // last = { kind } 또는 { q }

export function setupExplore(el) {
  bar = document.createElement("div");
  bar.className = "explore";
  bar.innerHTML = `<form class="xq" role="search">
      <input type="search" placeholder="이 지역에서 찾기 (예: 라멘, 온천)" aria-label="이 지역에서 장소 찾기" enterkeyhint="search">
      <button aria-label="찾기">🔍</button>
    </form>
    <div class="xchips">${FIND.map((f, i) => `<button type="button" class="cf" data-x="${i}" style="${cv(f.c)}">${ic(f.c, 13)}${f.k}</button>`).join("")}
      <button type="button" class="cf xclr" data-x="clr" hidden>✕ 지우기</button></div>
    <button type="button" class="xagain" data-x="again" hidden>↻ 이 지역 다시 찾기</button>`;
  el.appendChild(bar);

  const input = bar.querySelector("input");
  bar.querySelector("form").onsubmit = e => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) { input.blur(); run({ q }); }
  };
  bar.onclick = e => {
    const x = e.target.closest("[data-x]");
    if (!x) return;
    const v = x.dataset.x;
    if (v == "clr") clearFound();
    else if (v == "again") run(last);
    else {
      const f = FIND[+v];
      // 같은 버튼 다시 누르면 끄기
      if (last && last.kind === f && mk.length) clearFound();
      else run({ kind: f });
    }
  };
  // 결과를 띄운 뒤 지도를 옮기면 "다시 찾기" 버튼
  const moved = () => { if (last) bar.querySelector(".xagain").hidden = false; };
  G.map.addListener("dragend", moved);
  G.map.addListener("zoom_changed", () => { if (mk.length) moved(); });
}

function state() {
  bar.querySelectorAll("[data-x]").forEach(b => {
    if (/^\d+$/.test(b.dataset.x)) b.classList.toggle("on", !!(last && last.kind === FIND[+b.dataset.x] && mk.length));
  });
  const clr = bar.querySelector(".xclr");
  clr.hidden = !mk.length;
  clr.textContent = "✕ " + mk.length + "곳 지우기";
  UI.found = mk.length;
}

export function clearFound() {
  mk.forEach(m => m.map = null);
  mk = [];
  last = null;
  if (!bar) return;
  bar.querySelector("input").value = "";
  bar.querySelector(".xagain").hidden = true;
  state();
  drawMarkers(); // 범례 갱신
}

async function run(s) {
  if (!s || !G.map || !G.map.getBounds()) return;
  const b = G.map.getBounds(), ctr = G.map.getCenter(), ne = b.getNorthEast();
  bar.querySelector(".xagain").hidden = true;
  bar.classList.add("busy");
  let places = [];
  try {
    if (s.kind) {
      const radius = Math.min(50000, Math.max(300, hav({ lat: ctr.lat(), lng: ctr.lng() }, { lat: ne.lat(), lng: ne.lng() }) * 1000));
      ({ places } = await G.Place.searchNearby({
        fields: FIELDS, locationRestriction: { center: ctr, radius }, includedTypes: s.kind.t,
        maxResultCount: 20, rankPreference: G.Rank ? G.Rank.POPULARITY : undefined, language: "ko",
      }));
    } else {
      ({ places } = await G.Place.searchByText({ textQuery: s.q, fields: FIELDS, locationRestriction: b, maxResultCount: 20, language: "ko" }));
    }
  } catch (e) {
    console.error(e);
    toast("검색하지 못했어요. 잠시 후 다시 해 보세요");
  }
  bar.classList.remove("busy");

  mk.forEach(m => m.map = null);
  mk = [];
  last = s;
  const c = cur(), mine = new Set(c ? [...c.rows, ...c.wish].map(o => o.id).filter(Boolean) : []);
  places.filter(p => p.location && !mine.has(p.id)).forEach(p => show(p, s.kind ? s.kind.c : guessCat(p.types)));
  if (!places.length) toast(s.kind ? "이 지역엔 " + s.kind.k + " 결과가 없어요" : "'" + s.q + "' 결과가 없어요. 지도를 옮겨 보세요");
  state();
  drawMarkers();
}

function show(p, cat) {
  const pin = document.createElement("div");
  pin.className = "fpin";
  pin.style.cssText = cv(cat);
  pin.innerHTML = `<b>${ic(cat, 14)}</b><span>${esc(p.displayName)}</span>`;
  const m = new G.AME({ map: G.map, position: p.location, content: pin, title: p.displayName, zIndex: -1 });
  m.addListener("gmp-click", () => open(p, m));
  mk.push(m);
}

// 결과 핀 → 정보창 (평점·리뷰 + 보관함/Day 추가)
async function open(p, m) {
  const d = card(p.displayName, p);
  G.iw.setContent(d);
  G.iw.open({ map: G.map, anchor: m });
  addBtns(d, p, () => {
    m.map = null;
    mk = mk.filter(x => x !== m);
    state();
  });
  try {
    await p.fetchFields({ fields: ["reviews", "googleMapsURI", "formattedAddress"] });
    const full = card(p.displayName, p);
    d.replaceChildren(...full.childNodes, ...[...d.querySelectorAll(".iwadd")]);
  } catch (e) {}
}
