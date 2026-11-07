// 앱 상태 · localStorage 저장/불러오기 · 이전 데이터 변환
//   S  : 저장되는 데이터 (나라, 일정, 보관함, 준비물 …)
//   UI : 화면 상태 (저장 안 함 — 새로고침하면 초기화)
import { SEED } from "./seed.js";
import { newPrep } from "./constants.js";

const KEY = "trip";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
}

let s = load();
if (!s || !s.cs || (s.v != 2 && !s.cs.some(c => c.rows && c.rows.length))) s = SEED();

s.v = 2;
s.sel = s.sel || 0;
s.mode = s.mode || "TRANSIT";                       // 이동시간 계산 수단
if (!["plan", "prep", "bud", "wx"].includes(s.tab)) s.tab = "plan"; // 예전 '위시' 탭 → 일정
// 예전 버전에서 쓰던 화면 상태 정리
["del", "menu", "dsel", "wsel", "wmsg", "wmd", "wd", "pin", "day", "view"].forEach(k => delete s[k]);

// 예전 버전 데이터 보정
function fix(c) {
  c.rows = c.rows || [];
  c.wish = c.wish || [];
  c.rate = c.rate || 0;
  c.nd = c.nd || 3;
  c.rows.forEach(r => { r.d = r.d || 1; if (r.s == "변경가능") r.s = "후보"; });
  c.tr = c.tr || {};
  c.prep = c.prep || newPrep();
}
s.cs.forEach(fix);

export const S = s;

// 같이 쓰는 데이터 = 나라 목록(cs). 선택한 탭·나라 같은 건 기기마다 따로.
export const sharedData = () => ({ v: S.v, cs: S.cs });
export function applyRemote(data) {
  S.cs = data.cs || [];
  S.cs.forEach(fix);
  if (S.sel >= S.cs.length) S.sel = 0;
}

// 저장 직후 호출할 함수 (sync.js가 서버 저장을 연결)
export const hooks = { afterSave: null };

export const UI = {
  mode: "plan",   // 일정 탭 안: "plan"(계획) | "dash"(대시보드)
  focus: 1,       // 지도에 보여줄 Day (0 = 전체)
  open: null,     // 상세 패널에 열린 장소 { o: 장소 객체 }
  sel: null,      // 대시보드에서 강조한 장소 키 ("r3")
  catF: [],       // 내 장소 카테고리 필터 — 여러 개 선택 (보관함 목록 + 지도). 비어 있으면 전부
  fold: {},       // 휴대폰 대시보드에서 접은 구역 { map, days, cands }
  pe: null,       // 준비 탭에서 수정 중인 항목 키 ("bk0" | "docs2" | "tr" | "fx" …)
  add: null,      // 장소 추가 패널 { d: 0=보관함|Day, pv: 고른 장소 미리보기, busy }
  found: 0,       // 지도에 떠 있는 주변 검색 결과 수
  menu: null,     // 열린 메뉴 ("country" | "day2" …)
  mapOn: false,   // 태블릿·폰에서 지도 패널 열림
};

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  if (hooks.afterSave) hooks.afterSave();
}

// 현재 선택한 나라
export const cur = () => S.cs[S.sel];

// 카드 키 ↔ 장소 객체 ("r3" = 일정 3번째, "w0" = 보관함 0번째)
export const byKey = k => {
  const c = cur();
  if (!c || !k) return null;
  return (k[0] == "w" ? c.wish : c.rows)[+k.slice(1)] || null;
};

// 한 Day의 장소들 (원래 인덱스 i 유지)
export const dayRows = d => cur().rows.map((r, i) => ({ r, i })).filter(o => o.r.d == d);

// 카테고리 필터에 걸리는지 (필터가 비어 있으면 전부 통과)
export const catOn = c => !UI.catF.length || UI.catF.includes(c);

// 후보 숨기기 적용
export const shown = list => list.filter(o => !(S.hc && o.r.s == "후보"));

// Day 안의 번호 (후보는 "?")
export const nums = v => {
  let n = 0;
  return v.map(o => o.r.s == "후보" ? "?" : ++n);
};

// 장소를 보관함(0) 또는 Day(d)로 옮기기
export function moveTo(o, d) {
  const c = cur();
  c.rows = c.rows.filter(x => x !== o);
  c.wish = c.wish.filter(x => x !== o);
  if (!d) { c.wish.push(o); return; }
  o.d = d; o.s = o.s || "필수"; o.w = o.w || 0;
  c.rows.push(o);
}

// 장소 삭제
export function removePlace(o) {
  const c = cur();
  c.rows = c.rows.filter(x => x !== o);
  c.wish = c.wish.filter(x => x !== o);
}
