// 날씨 탭: 시작일 기준 Day별 날씨 (Open-Meteo, 키 불필요)
//   - 오늘부터 16일 안의 날짜 → 실제 예보
//   - 그보다 먼(또는 지난) 날짜 → 그 달의 평년 날씨 (최근 5년 실제 기록 평균) + 옷차림 팁
//     여행이 다가와 예보 범위에 들어오면 자동으로 예보로 바뀜
import { S, cur } from "../state.js";
import { $, esc, hasXY } from "../utils.js";

// WMO 날씨 코드 → 아이콘
const WI = c => c == 0 ? "☀️" : c < 4 ? "⛅" : c < 50 ? "🌫️" : c < 60 ? "🌦️" : c < 70 ? "🌧️" : c < 80 ? "❄️" : c < 90 ? "🌦️" : "⛈️";
const RANGE = 16; // 예보 가능한 날 수 (오늘 포함)

const cache = {};
let ticket = 0; // 늦게 도착한 이전 요청 결과 무시용

const isoDate = t => t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
const dayDate = (c, d) => { const t = new Date(c.start + "T00:00:00"); t.setDate(t.getDate() + d - 1); return t; };
const today0 = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
const fmtMD = t => (t.getMonth() + 1) + "/" + t.getDate();

// ----- 평년 날씨: 위치별 12개월 (최근 5년 기록 평균), 기기에 저장 -----
const CKEY = "trip_clim";
let clim = {};
try { clim = JSON.parse(localStorage.getItem(CKEY)) || {}; } catch (e) {}
const climPending = {};

async function normals(la, lo) {
  const k = la.toFixed(1) + "," + lo.toFixed(1);
  if (clim[k]) return clim[k];
  if (!climPending[k]) climPending[k] = (async () => {
    const y = new Date().getFullYear();
    const u = "https://archive-api.open-meteo.com/v1/archive?latitude=" + la.toFixed(2) + "&longitude=" + lo.toFixed(2)
      + "&start_date=" + (y - 5) + "-01-01&end_date=" + (y - 1) + "-12-31"
      + "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto";
    try {
      const r = await fetch(u);
      if (!r.ok) throw 0;
      const D = (await r.json()).daily;
      const m = Array.from({ length: 12 }, () => ({ hi: 0, lo: 0, n: 0, rd: 0 }));
      D.time.forEach((t, i) => {
        const hi = D.temperature_2m_max[i], lo = D.temperature_2m_min[i];
        if (hi == null || lo == null) return;
        const x = m[+t.slice(5, 7) - 1];
        x.hi += hi; x.lo += lo; x.n++;
        if ((D.precipitation_sum[i] || 0) >= 1) x.rd++;
      });
      const out = m.map(x => x.n ? { hi: Math.round(x.hi / x.n), lo: Math.round(x.lo / x.n), rd: Math.round(x.rd / 5) } : null);
      clim[k] = out;
      try { localStorage.setItem(CKEY, JSON.stringify(clim)); } catch (e) {}
      return out;
    } catch (e) { return null; } finally { delete climPending[k]; }
  })();
  return climPending[k];
}

// 평균 기온 → 옷차림 팁
export function wear(hi, lo, rd) {
  const a = (hi + lo) / 2;
  const t = a >= 26 ? "반팔·반바지, 햇빛 가리개" : a >= 20 ? "반팔 + 얇은 겉옷" : a >= 15 ? "긴팔 + 얇은 외투" : a >= 10 ? "니트·가벼운 코트" : a >= 5 ? "코트·두꺼운 외투" : "패딩·목도리·장갑";
  const x = [t];
  if (hi - lo >= 9) x.push("일교차가 커서 겹쳐 입기");
  if (rd >= 10) x.push("비 오는 날이 많아 우산 필수");
  return x.join(" · ");
}

// Day d의 날씨: 예보 { ic, hi, lo, rain } / 평년 { nm:1, mon, hi, lo, rd, from } / 안내 { msg }
export async function dayForecast(c, d, all) {
  const q = c.rows.find(r => r.d == d && hasXY(r)), ref = q || all[0];
  const t = dayDate(c, d), iso = isoDate(t);
  const base = { d, lab: t.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" }), place: ref ? (q ? q.p : "기준: " + ref.p) : "" };
  if (!ref) return Object.assign(base, { msg: "장소를 추가하면 날씨가 나와요" });

  const gap = Math.round((t - today0()) / 864e5);
  if (gap >= 0 && gap < RANGE) {
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
    } catch (e) { /* 예보 실패 → 평년으로 */ }
  }

  const N = await normals(ref.la, ref.lo), n = N && N[t.getMonth()];
  if (!n) return Object.assign(base, { msg: "날씨 정보를 불러오지 못했어요" });
  const from = new Date(t); from.setDate(from.getDate() - (RANGE - 1));
  return Object.assign(base, { nm: 1, mon: t.getMonth() + 1, ...n, from: gap >= RANGE ? fmtMD(from) : "" });
}

export async function renderWeather() {
  const el = $("#wxt"), c = cur();
  if (S.tab != "wx" || !c) return;
  const tk = ++ticket;

  const head = `<div class="card" style="margin-bottom:12px"><h3>📅 여행 시작일</h3><input type="date" data-top="1" data-k="start" value="${esc(c.start)}" style="width:auto"><p class="mu">시작일을 넣으면 Day별 날씨가 나와요. 여행 16일 전부터는 실제 예보, 그 전에는 그 달의 평년 날씨(최근 5년 평균)를 보여 줘요.</p></div>`;
  if (!c.start) { el.innerHTML = head; return; }
  el.innerHTML = head + `<div class="card mu">불러오는 중…</div>`;

  const all = c.rows.filter(hasXY);
  const out = await Promise.all(Array.from({ length: c.nd }, (_, k) => dayForecast(c, k + 1, all)));
  if (tk != ticket) return;

  // 평년 날씨 요약 (달·장소별 한 번씩) + 옷차림
  const seen = new Set(), sum = [];
  out.filter(o => o.nm).forEach(o => {
    const key = o.mon + "|" + o.hi + "|" + o.lo;
    if (seen.has(key)) return;
    seen.add(key);
    sum.push(`<div class="clim"><div class="cm"><b>${o.mon}월</b> <span class="mu">${esc(o.place.replace(/^기준: /, ""))} 근처</span></div>
      <div class="ct"><b>${o.hi}°</b> / ${o.lo}° <span class="mu">· 비 오는 날 월 ${o.rd}일쯤</span></div>
      <div class="cw">👕 ${esc(wear(o.hi, o.lo, o.rd))}</div></div>`);
  });
  const from = out.find(o => o.nm && o.from);
  const climCard = sum.length ? `<div class="card" style="margin-bottom:12px"><h3>📊 이맘때 평균 날씨</h3>${sum.join("")}
    <p class="mu">최근 5년 같은 달의 실제 기록 평균이에요.${from ? ` ${esc(from.from)}부터는 Day별 실제 예보로 바뀌어요.` : ""}</p></div>` : "";

  el.innerHTML = head + climCard + out.map(o => `<div class="card wd"><div><b>Day ${o.d}</b> <span class="mu">${esc(o.lab)}</span><div class="mu">${esc(o.place)}</div></div>${o.msg
    ? `<div class="mu" style="text-align:right">${esc(o.msg)}</div>`
    : o.nm
      ? `<div class="wr"><span class="mu">평년</span><b>${o.hi}°/${o.lo}°</b></div>`
      : `<div class="wr"><span class="wi">${o.ic}</span><b>${o.hi}°/${o.lo}°</b><span class="mu">☔ ${o.rain}%</span></div>`}</div>`).join("");
}
