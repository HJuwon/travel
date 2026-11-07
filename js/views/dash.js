// 대시보드 모드: 여행 중에 보는 화면 — Day별 확정 일정 + 지도 + 후보
import { S, UI, cur } from "../state.js";
import { $, esc, hasXY, dayLabel, dirURL } from "../utils.js";
import { ic, cv } from "../icons.js";
import { dayForecast } from "./weather.js";

const line = r => String(r.tip || r.hrs || r.m || r.c).split("\n")[0];

export function renderDash() {
  const c = cur();
  if (!c) { $("#ddays").innerHTML = `<div class="empty">나라를 추가해 보세요</div>`; $("#cands").innerHTML = ""; return; }

  let h = "";
  for (let d = 1; d <= c.nd; d++) {
    const L = c.rows.filter(r => r.d == d && r.s != "후보");
    h += `<div class="dc${UI.focus == d ? " focus" : ""}" data-a="focus" data-d="${d}">
      <div class="dch"><div><b>Day ${d}</b><small>${dayLabel(c, d)}</small></div><div class="wx" data-wxd="${d}"></div></div>
      <ul class="tl">${L.map((r, j) => `<li style="${cv(r.c)}"><span class="ci">${ic(r.c, 15)}</span><div class="t"><b>${j + 1}. ${esc(r.p) || "(이름 없음)"}</b><small>${esc(line(r))}</small></div>${hasXY(r) ? `<a class="gdir" href="${dirURL(j && hasXY(L[j - 1]) ? L[j - 1] : null, r, j && L[j - 1].tm || S.mode)}" target="_blank" rel="noopener" title="${j ? "앞 장소에서" : "현재 위치에서"} 여기까지 구글맵 길찾기">길찾기 ↗</a>` : ""}</li>`).join("") || `<li class="empty">아직 장소가 없어요</li>`}</ul>
      <div class="dcf"><span>${L.length}곳</span><button data-a="edit" data-d="${d}">계획에서 편집 →</button></div>
    </div>`;
  }
  $("#ddays").innerHTML = h;
  $("#dash").classList.toggle("oneday", UI.focus > 0); // 휴대폰에선 고른 Day만

  // 후보: Day 칸에 '후보'로 넣어 둔 장소들
  const C = c.rows.map((r, i) => ({ r, i })).filter(o => o.r.s == "후보").sort((a, b) => a.r.d - b.r.d);
  $("#ccount").textContent = C.length + "곳";
  $("#cands").innerHTML = C.map(o => `<li class="${UI.sel == "r" + o.i ? "sel" : ""}" data-a="pin" data-k="r${o.i}" style="${cv(o.r.c)}"><span class="ci">${ic(o.r.c, 15)}</span><div class="t"><b>${esc(o.r.p) || "(이름 없음)"}</b><small>${esc(line(o.r))}</small></div><span class="dtag">Day ${o.r.d}</span></li>`).join("")
    || `<li class="empty">후보가 없어요. 계획에서 장소의 구분을 '후보'로 바꾸면 여기 모여요.</li>`;

  if (c.start) fillWeather(c);
}

// 시작일이 있으면 Day 카드에 날씨 채우기 (예보 가능한 날짜만)
function fillWeather(c) {
  const all = c.rows.filter(hasXY);
  for (let d = 1; d <= c.nd; d++) {
    dayForecast(c, d, all).then(o => {
      const el = document.querySelector(`[data-wxd="${d}"]`);
      if (el && !o.msg) el.innerHTML = `<span>${o.ic}</span>${o.hi}° / ${o.lo}° · ☔${o.rain}%`;
    });
  }
}
