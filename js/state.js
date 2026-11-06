// 앱 상태(S) · localStorage 저장/불러오기 · 이전 데이터 변환
import { SEED } from "./seed.js";
import { newPrep } from "./constants.js";

const KEY = "trip";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
}

let s = load();
if (!s || !s.cs || (s.v != 2 && !s.cs.some(c => c.rows && c.rows.length))) s = SEED();

// 화면 전용 상태는 매번 초기화
s.v = 2; s.del = false; s.menu = false; s.dsel = {}; s.wsel = {}; s.wmsg = "";
s.sel = s.sel || 0; s.pin = -1; s.tab = s.tab || "plan"; s.day = s.day || 0; s.mode = s.mode || "TRANSIT";

// 예전 버전 데이터 보정
s.cs.forEach(c => {
  c.wish = c.wish || [];
  c.rate = c.rate || 0;
  c.nd = c.nd || 3;
  c.rows.forEach(r => { r.d = r.d || 1; if (r.s == "변경가능") r.s = "후보"; });
  c.tr = c.tr || {};
  c.prep = c.prep || newPrep();
});

export const S = s;

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
}

// 현재 선택한 나라
export const cur = () => S.cs[S.sel];

// 지금 화면에 보이는 장소들 (Day 필터 · 후보 숨김 적용, 원래 인덱스 i 유지)
export const vis = () => cur().rows
  .map((r, i) => ({ r, i }))
  .filter(o => (!S.day || o.r.d == S.day) && !(S.hc && o.r.s == "후보"))
  .sort((a, b) => a.r.d - b.r.d || a.i - b.i);

// Day별 번호 (후보는 "?")
export const nums = v => {
  let n = 0, pd = 0;
  return v.map(o => {
    if (o.r.d != pd) { pd = o.r.d; n = 0; }
    return o.r.s == "후보" ? "?" : ++n;
  });
};
