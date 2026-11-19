// 일정 탭: 위쪽 Day 칩으로 고르고, Day별 장소를 세로 목록으로
//   - 장소 줄을 누르면 아래에 [길찾기 · 지도 · 다녀옴 · 편집] 펼침
//   - 끌어서 순서 바꾸기, 다른 Day 칩이나 다른 Day 목록으로 끌어 옮기기, 보관함에서 끌어오기
//   - 장소 사이: 이동수단(눌러서 바꾸기) · 이동시간 · 구글맵 길찾기
import { S, UI, cur, dayRows, shown, nums, catOn } from "../state.js";
import { MODES } from "../constants.js";
import { $, esc, won, hasXY, dayLabel, dirURL, todayDay } from "../utils.js";
import { ic, cv } from "../icons.js";
import { pcard, meta } from "./card.js";
import { sortable, chipDrop } from "../events/drag.js";
import { dayForecast } from "./weather.js";

// ----- 보관함 -----
export function renderWish() {
  const c = cur(), el = $("#wishlist");
  if (!c) { el.innerHTML = $("#wcount").textContent = ""; return; }
  $("#wcount").textContent = c.wish.length || "";
  el.innerHTML = c.wish.map((w, i) => pcard(w, "w" + i, null, c.cur, !catOn(w.c))).join("")
    + (c.wish.length ? "" : `<div class="empty">가고 싶은 곳을 모아 두는 곳이에요.<br>여기 모은 장소를 Day로 끌어다 일정에 넣어요.</div>`);
  sortable(el);
}

// ----- 맨 위 줄: 제목 · 기간 · 버튼 -----
function bar(c) {
  const range = c.start ? `${dayLabel(c, 1)} ~ ${dayLabel(c, c.nd)} · ${c.nd}일` : `${c.nd}일`;
  return `<div class="ttl"><h2>${esc(c.f)} ${esc(c.n)}</h2><span class="sub">${range}</span></div>`
    + `<span class="sp"></span>`
    + (c.start ? "" : `<button class="sbtn hl" data-a="set">📅 시작일 정하기</button>`)
    + `<button class="sbtn wbtn${UI.wishOn ? " on" : ""}" data-a="wisht" aria-pressed="${!!UI.wishOn}">📥 보관함${c.wish.length ? ` <i>${c.wish.length}</i>` : ""}</button>`
    + `<button class="sbtn${S.hc ? " on" : ""}" data-a="hc" aria-pressed="${!!S.hc}" title="'후보'로 표시한 장소 숨기기">${S.hc ? "후보 숨김" : "후보 보임"}</button>`
    + (UI.mapOn ? "" : `<button class="sbtn" data-a="mapt">🗺 지도 열기</button>`)
    + `<button class="sbtn" data-a="set" aria-label="여행 설정">⚙<span class="lbl"> 설정</span></button>`;
}

// ----- Day 칩 (누르면 그 Day만, 장소를 끌어다 놓으면 그 Day로 옮김) -----
function chips(c) {
  const t = todayDay(c);
  let h = `<button class="dchip${UI.focus == 0 ? " on" : ""}" data-a="focus" data-d="0">전체</button>`;
  for (let d = 1; d <= c.nd; d++) {
    const n = c.rows.filter(r => r.d == d && r.s != "후보").length;
    h += `<button class="dchip${UI.focus == d ? " on" : ""}${t == d ? " today" : ""}" data-a="focus" data-d="${d}" data-drop="${d}" title="${n}곳 · 장소를 끌어다 놓으면 Day ${d}로 옮겨요"><b>Day ${d}</b><small>${t == d ? "오늘" : dayLabel(c, d).replace(/\s*\(.*\)/, "") || n + "곳"}</small></button>`;
  }
  return h + `<button class="dchip add" data-a="addday" title="Day 추가">+ Day</button>`;
}

// 장소 줄을 펼쳤을 때 보이는 정보 (구글에서 자동으로 들어온 것 포함)
function info(r, cu) {
  const L = [
    r.hrs && ["⏰", String(r.hrs).split("\n")[0]],
    r.brk && ["☕", "브레이크 " + r.brk],
    r.fee && ["🎫", r.fee],
    r.price && ["💰", "가격대 " + r.price],
    r.pay && ["💳", r.pay],
    r.rsv && ["📅", r.rsv],
    r.w && ["🧾", "예산 " + esc(cu) + won(r.w)],
    r.tip && ["💡", r.tip],
  ].filter(Boolean);
  return L.length ? `<ul class="pinfo">${L.map(([i, t]) => `<li><span aria-hidden="true">${i}</span>${esc(t)}</li>`).join("")}</ul>` : "";
}

// 일정의 장소 한 줄
function row(c, o, no, prev) {
  const r = o.r, k = "r" + o.i, open = UI.dm == k, cand = r.s == "후보";
  let h = `<div class="pcard prow${cand ? " cand" : ""}${open ? " open" : ""}${r.done ? " done" : ""}" data-a="dm" data-k="${k}" tabindex="0" style="${cv(r.c)}" aria-expanded="${open}">`
    + `<span class="ci">${ic(r.c)}</span>`
    + `<div class="cb"><b>${esc(r.p) || "(이름 없음)"}</b><small>${meta(r, c.cur)}</small></div>`
    + (r.done ? `<span class="okm" title="다녀왔어요">✓</span>` : "")
    + `<span class="no">${no}</span>`;
  if (open) {
    const from = prev && hasXY(prev) ? prev : null;
    h += `<div class="pmore">${info(r, c.cur)}<div class="pact">`
      + (hasXY(r) ? `<a class="btn" href="${dirURL(from, r, (from && from.tm) || S.mode)}" target="_blank" rel="noopener">🧭 길찾기 <small>${from ? "앞 장소에서" : "지금 위치에서"}</small></a>` : "")
      + (hasXY(r) ? `<button class="btn" data-a="mapgo" data-k="${k}">📍 지도</button>` : "")
      + `<button class="btn${r.done ? " on" : ""}" data-a="done" data-k="${k}" aria-pressed="${!!r.done}" title="예산 탭 '실제 지출'에 들어가요">${r.done ? "✓ 다녀옴" : "다녀왔어요"}</button>`
      + `<button class="btn" data-a="dopen" data-k="${k}">✎ 편집</button>`
      + `</div></div>`;
  }
  return h + `</div>`;
}

function day(c, d) {
  const all = dayRows(d), vis = shown(all), nm = nums(vis);
  const must = vis.filter(o => o.r.s != "후보");
  const cost = must.reduce((a, o) => a + (+o.r.w || 0), 0);

  let h = `<section class="day${UI.focus == d ? " focus" : ""}" id="day${d}">
    <header class="dh">
      <button class="dt" data-a="focus" data-d="${d}" title="이 Day만 보기"><b>Day ${d}</b><span>${dayLabel(c, d)}</span></button>
      <span class="wx" data-wxd="${d}"></span>
      <span class="dcost">${must.length}곳${cost ? " · " + esc(c.cur) + won(cost) : ""}</span>
      <button class="sm" data-a="menu" data-m="day${d}" aria-label="Day ${d} 메뉴" aria-haspopup="true">⋯</button>
      ${UI.menu == "day" + d ? `<div class="mn"><button data-a="manual" data-d="${d}">+ 장소 추가</button><button class="dg" data-a="delday" data-d="${d}">Day ${d} 삭제</button></div>` : ""}
    </header>
    <div class="drop" data-d="${d}">`;

  all.forEach(o => {
    const j = vis.indexOf(o);
    if (j < 0) return; // 숨긴 후보
    let prev = null;
    for (let q = j - 1; q >= 0; q--) if (vis[q].r.s != "후보") { prev = vis[q].r; break; }
    h += row(c, o, nm[j], o.r.s == "후보" ? null : prev);
    // 다음 장소까지 이동 구간 (google/routes.js가 시간을 채움)
    const n = vis[j + 1];
    if (n && o.r.s != "후보" && n.r.s != "후보" && hasXY(o.r) && hasXY(n.r)) {
      const m = o.r.tm || S.mode, K = Object.keys(MODES), nx = K[(K.indexOf(m) + 1) % K.length];
      h += `<div class="leg" id="lg${o.i}"><button class="lm" data-a="lmode" data-k="r${o.i}" data-m="${nx}" title="${MODES[m].slice(2)} · 눌러서 ${MODES[nx].slice(2)}로" aria-label="이동수단 ${MODES[m].slice(2)}, 눌러서 바꾸기">${MODES[m].split(" ")[0]}</button><span class="lt">…</span><a class="gdir" href="${dirURL(o.r, n.r, m)}" target="_blank" rel="noopener" title="구글맵에서 이 구간 길찾기">길찾기 ↗</a></div>`;
    }
  });
  if (!vis.length) h += `<div class="dempty">아직 장소가 없어요</div>`;

  return h + `</div><button class="addc" data-a="manual" data-d="${d}">+ 장소 추가</button></section>`;
}

export function renderPlan() {
  const c = cur();
  if (!c) {
    $("#bar").innerHTML = $("#dchips").innerHTML = "";
    $("#days").innerHTML = `<div class="empty big">위의 나라 메뉴에서 나라를 추가하거나 예시를 불러와 보세요</div>`;
    return;
  }
  if (UI.focus > c.nd) UI.focus = 0;
  $("#bar").innerHTML = bar(c);
  $("#dchips").innerHTML = chips(c);
  const ds = UI.focus ? [UI.focus] : Array.from({ length: c.nd }, (_, i) => i + 1);
  $("#days").innerHTML = ds.map(d => day(c, d)).join("");
  document.querySelectorAll("#days .drop").forEach(sortable);
  document.querySelectorAll("#dchips [data-drop]").forEach(chipDrop);
  if (c.start) fillWeather(c, ds);
}

// 시작일이 있으면 Day 머리에 날씨 (예보 범위 밖이면 그 달 평년)
function fillWeather(c, ds) {
  const all = c.rows.filter(hasXY);
  ds.forEach(d => dayForecast(c, d, all).then(o => {
    const el = document.querySelector(`[data-wxd="${d}"]`);
    if (!el || o.msg) return;
    el.innerHTML = o.nm
      ? `<small>평년</small> ${o.hi}°/${o.lo}°`
      : `${o.ic} ${o.hi}°/${o.lo}° <small>☔${o.rain}%</small>`;
  }));
}
