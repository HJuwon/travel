// Day 칸 카드 사이 이동시간 (키 없으면 직선거리만 표시)
import { G } from "./gm.js";
import { S, UI, cur, dayRows, shown } from "../state.js";
import { MODES } from "../constants.js";
import { $, hasXY, hav, fmtT } from "../utils.js";

const cache = {};

export async function legs() {
  const c = cur();
  if (S.tab != "plan" || UI.mode != "plan" || !c) return;
  for (let d = 1; d <= c.nd; d++) {
    const v = shown(dayRows(d));
    for (let j = 0; j < v.length - 1; j++) {
      const a = v[j].r, b = v[j + 1].r;
      if (a.s == "후보" || b.s == "후보" || !hasXY(a) || !hasXY(b)) continue;

      const id = "#lg" + v[j].i, A = { lat: a.la, lng: a.lo }, B = { lat: b.la, lng: b.lo };
      const k = [a.la, a.lo, b.la, b.lo, S.mode].join();
      if ($(id)) $(id).textContent = "↓ 직선 " + hav(A, B).toFixed(1) + "km";
      if (!G.Route) continue;

      try {
        if (!cache[k]) {
          const rs = await G.Route.computeRoutes({ origin: A, destination: B, travelMode: S.mode, fields: ["durationMillis", "distanceMeters"] });
          cache[k] = rs.routes[0];
        }
        const r = cache[k];
        if ($(id)) $(id).textContent = "↓ " + MODES[S.mode].split(" ")[0] + " " + fmtT(r.durationMillis) + " · " + (r.distanceMeters / 1000).toFixed(1) + "km";
      } catch (e) {}
    }
  }
}
