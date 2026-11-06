// 날씨 탭: 시작일 기준 Day별 예보 (Open-Meteo, 키 불필요)
import { S, cur } from "../state.js";
import { $, esc, hasXY } from "../utils.js";

// WMO 날씨 코드 → 아이콘
const WI = c => c == 0 ? "☀️" : c < 4 ? "⛅" : c < 50 ? "🌫️" : c < 60 ? "🌦️" : c < 70 ? "🌧️" : c < 80 ? "❄️" : c < 90 ? "🌦️" : "⛈️";

const cache = {};
let ticket = 0; // 늦게 도착한 이전 요청 결과 무시용

const isoDate = t => t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");

export async function dayForecast(c, d, all) {
  const q = c.rows.find(r => r.d == d && hasXY(r)), ref = q || all[0];
  const t = new Date(c.start + "T00:00:00");
  t.setDate(t.getDate() + d - 1);
  const iso = isoDate(t);
  const base = { d, lab: t.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" }), place: ref ? (q ? q.p : "기준: " + ref.p) : "" };
  if (!ref) return Object.assign(base, { msg: "장소를 추가하면 날씨가 나와요" });

  const u = "https://api.open-meteo.com/v1/forecast?latitude=" + ref.la + "&longitude=" + ref.lo
    + "&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=" + iso + "&end_date=" + iso;
  try {
    if (!cache[u]) {
      const r = await fetch(u);
      if (!r.ok) throw 0;
      cache[u] = (await r.json()).daily;
    }
    const w = cache[u];
    return Object.assign(base, { ic: WI(w.weathercode[0]), hi: Math.round(w.temperature_2m_max[0]), lo: Math.round(w.temperature_2m_min[0]), rain: w.precipitation_probability_max[0] || 0 });
  } catch (e) {
    return Object.assign(base, { msg: "예보 없음 (오늘부터 약 16일 이내만 가능)" });
  }
}

export async function renderWeather() {
  const el = $("#wxt"), c = cur();
  if (S.tab != "wx" || !c) return;
  const tk = ++ticket;

  const head = `<div class="card" style="margin-bottom:12px"><h3>📅 여행 시작일</h3><input type="date" data-top="1" data-k="start" value="${esc(c.start)}" style="width:auto"><p class="mu">시작일을 넣으면 Day별 날씨가 나와요. 예보는 오늘부터 약 16일 이내 날짜만 가능해요.</p></div>`;
  if (!c.start) { el.innerHTML = head; return; }
  el.innerHTML = head + `<div class="card mu">불러오는 중…</div>`;

  const all = c.rows.filter(hasXY);
  const out = await Promise.all(Array.from({ length: c.nd }, (_, k) => dayForecast(c, k + 1, all)));
  if (tk != ticket) return;

  el.innerHTML = head + out.map(o => `<div class="card wd"><div><b>Day ${o.d}</b> <span class="mu">${esc(o.lab)}</span><div class="mu">${esc(o.place)}</div></div>${o.msg
    ? `<div class="mu" style="text-align:right">${esc(o.msg)}</div>`
    : `<div class="wr"><span class="wi">${o.ic}</span><b>${o.hi}°/${o.lo}°</b><span class="mu">☔ ${o.rain}%</span></div>`}</div>`).join("");
}
