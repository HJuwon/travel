// Day 칸 카드 사이 이동시간 (키 없으면 직선거리만 표시)
//   한 번 계산한 구간은 이 기기(localStorage)에 저장해 두고 다시 요청하지 않음
//   → 장소나 순서, 이동수단이 바뀐 구간만 Routes API 호출 (요금·할당량 절약)
import { G } from "./gm.js";
import { S, UI, cur, dayRows, shown } from "../state.js";
import { MODES } from "../constants.js";
import { $, hasXY, hav, fmtT } from "../utils.js";

const KEY = "trip_routes", MAX = 600;
// 값: [durationMillis, distanceMeters] 또는 0 (경로 없음. 예: 일본 대중교통)
let cache = {};
try { cache = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}

function store() {
  const ks = Object.keys(cache);
  if (ks.length > MAX) ks.slice(0, ks.length - MAX).forEach(k => delete cache[k]); // 오래된 것부터 정리
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) {}
}

const pending = {}; // 같은 구간을 동시에 두 번 요청하지 않게

async function route(k, A, B) {
  if (k in cache) return cache[k];
  if (!pending[k]) pending[k] = (async () => {
    try {
      const rs = await G.Route.computeRoutes({ origin: A, destination: B, travelMode: S.mode, fields: ["durationMillis", "distanceMeters"] });
      const r = rs.routes && rs.routes[0];
      cache[k] = r ? [r.durationMillis, r.distanceMeters] : 0;
      store();
      return cache[k];
    } catch (e) {
      return null; // 할당량 초과·네트워크 오류는 저장하지 않음 (다음에 다시 시도)
    } finally { delete pending[k]; }
  })();
  return pending[k];
}

export async function legs() {
  const c = cur();
  if (S.tab != "plan" || UI.mode != "plan" || !c) return;
  const mode = S.mode;
  for (let d = 1; d <= c.nd; d++) {
    const v = shown(dayRows(d));
    for (let j = 0; j < v.length - 1; j++) {
      const a = v[j].r, b = v[j + 1].r;
      if (a.s == "후보" || b.s == "후보" || !hasXY(a) || !hasXY(b)) continue;

      const id = "#lg" + v[j].i + " .lt", A = { lat: a.la, lng: a.lo }, B = { lat: b.la, lng: b.lo };
      const k = [a.la, a.lo, b.la, b.lo, mode].join();
      if ($(id)) $(id).textContent = "↓ 직선 " + hav(A, B).toFixed(1) + "km";
      if (!G.Route) continue;

      const r = await route(k, A, B);
      if (r && $(id)) $(id).textContent = "↓ " + MODES[mode].split(" ")[0] + " " + fmtT(r[0]) + " · " + (r[1] / 1000).toFixed(1) + "km";
    }
  }
}
