// 대시보드 모드: 여행 중에 보는 화면 — Day별 확정 일정 + 지도 + 후보
import { S, UI, cur } from "../state.js";
import { $, esc, hasXY, dayLabel, dirURL } from "../utils.js";
import { ic, cv } from "../icons.js";
import { dayForecast } from "./weather.js";

const line = r => String(r.tip || r.hrs || r.m || r.c).split("\n")[0];

// 일정 한 줄: 누르면 아래에 [길찾기 · 지도에서 보기 · 자세히] 펼침
function row(c, o, prev, j) {
  const r = o.r, k = "r" + o.i, open = UI.dm == k;
  let h = `<li class="dr${open ? " open" : ""}${UI.sel == k ? " sel" : ""}" data-a="dm" data-k="${k}" style="${cv(r.c)}" aria-expanded="${open}"><span class="ci">${ic(r.c, 15)}</span><div class="t"><b>${j + 1}. ${esc(r.p) || "(이름 없음)"}</b><small>${esc(line(r))}</small></div><span class="more" aria-hidden="true">${open ? "▴" : "▾"}</span></li>`;
  if (open) {
    const from = prev && hasXY(prev) ? prev : null;
    h += `<li class="dact">`
      + (hasXY(r) ? `<a class="btn" href="${dirURL(from, r, (from && from.tm) || S.mode)}" target="_blank" rel="noopener">🧭 길찾기 <small>${from ? "앞 장소에서" : "지금 위치에서"}</small></a>` : "")
      + (hasXY(r) ? `<button class="btn" data-a="pin" data-k="${k}">📍 지도에서 보기</button>` : "")
      + `<button class="btn" data-a="dopen" data-k="${k}">자세히</button></li>`;
  }
  return h;
}

export function renderDash() {
  const c = cur();
  if (!c) { $("#ddays").innerHTML = `<div class="empty">나라를 추가해 보세요</div>`; $("#cands").innerHTML = ""; return; }

  let h = "";
  for (let d = 1; d <= c.nd; d++) {
    const L = c.rows.map((r, i) => ({ r, i })).filter(o => o.r.d == d && o.r.s != "후보");
    h += `<div class="dc${UI.focus == d ? " focus" : ""}" data-a="focus" data-d="${d}">
      <div class="dch"><div><b>Day ${d}</b><small>${dayLabel(c, d) || L.length + "곳"}</small></div><div class="wx" data-wxd="${d}"></div>
        <button class="sm dedit" data-a="edit" data-d="${d}" title="계획에서 편집" aria-label="Day ${d} 계획에서 편집">✎</button></div>
      <ul class="tl">${L.map((o, j) => row(c, o, j ? L[j - 1].r : null, j)).join("") || `<li class="empty">아직 장소가 없어요</li>`}</ul>
    </div>`;
  }
  $("#ddays").innerHTML = h;
  $("#dash").classList.toggle("oneday", UI.focus > 0); // 휴대폰에선 고른 Day만

  // 후보: Day 칸에 '후보'로 넣어 둔 장소들
  const C = c.rows.map((r, i) => ({ r, i })).filter(o => o.r.s == "후보").sort((a, b) => a.r.d - b.r.d);
  $("#ccount").textContent = C.length + "곳";
  $("#cands").innerHTML = C.map(o => `<li class="${UI.sel == "r" + o.i ? "sel" : ""}" data-a="pin" data-k="r${o.i}" style="${cv(o.r.c)}" title="${esc(line(o.r))}"><span class="ci">${ic(o.r.c, 13)}</span><div class="t"><b>${esc(o.r.p) || "(이름 없음)"}</b></div><span class="dtag">Day ${o.r.d}</span></li>`).join("")
    || `<li class="empty">시간이 남을 때 갈 곳을 계획에서 '후보'로 표시하면 여기 모여요.</li>`;

  if (c.start) fillWeather(c);
}

// 시작일이 있으면 Day 카드에 날씨 채우기 (예보 가능한 날짜만)
function fillWeather(c) {
  const all = c.rows.filter(hasXY);
  for (let d = 1; d <= c.nd; d++) {
    dayForecast(c, d, all).then(o => {
      const el = document.querySelector(`[data-wxd="${d}"]`);
      if (!el || o.msg) return;
      el.innerHTML = o.nm
        ? `<small class="mu">평년</small>${o.hi}° / ${o.lo}°`            // 아직 예보 범위 밖 → 그 달 평균
        : `<span>${o.ic}</span>${o.hi}° / ${o.lo}° · ☔${o.rain}%`;
    });
  }
}
