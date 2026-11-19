// 오른쪽 패널 (휴대폰은 화면 전체): 장소 상세 · 장소 추가 · 여행 설정
import { S, UI, cur } from "../state.js";
import { CATS, STS, MODES } from "../constants.js";
import { $, esc, gq } from "../utils.js";
import { ic, cv } from "../icons.js";
import { G } from "../google/gm.js";
import { card } from "../google/map.js";
import { autofill } from "../google/places.js";
import { CURS } from "../fx.js";
import { renderAdd } from "./addpanel.js";

const tried = new WeakSet(); // 구글 정보 자동 불러오기를 이미 시도한 장소

export function renderDrawer() {
  const el = $("#drawer"), O = UI.open, A = UI.add, c = cur();
  if (!c) UI.set = false;
  const on = !!(O || A || UI.set);
  el.classList.toggle("on", on);
  $("#scrim").hidden = !on;
  if (A) { renderAdd(el); return; }               // 장소 추가
  if (UI.set) { renderSettings(el, c); return; }  // 여행 설정
  if (!O) { el.innerHTML = ""; return; }
  renderPlace(el, O.o, c);
}

// ----- 여행 설정: 이름 · 국기 · 통화 · 시작일 · 일수 · 기본 이동수단 · 삭제 -----
function renderSettings(el, c) {
  el.innerHTML = `<div class="dhd"><span class="ci" style="--c:var(--accent)">⚙</span><b class="atl">${esc(c.n)} 여행 설정</b><button class="x" data-a="close" aria-label="닫기">✕</button></div>
  <div class="dbody">
    <div class="row2">
      <label class="f" style="flex:0 0 76px">국기<input data-top="1" data-k="f" value="${esc(c.f)}"></label>
      <label class="f" style="flex:1">나라·여행 이름<input data-top="1" data-k="n" value="${esc(c.n)}"></label>
    </div>
    <label class="f">통화 <span class="mu">고르면 예산 탭 환율이 자동으로 들어와요</span><select data-top="1" data-k="code"><option value="" ${c.code ? "" : "selected"}>직접 입력 (${esc(c.cur)})</option>${CURS.map(([k, s, n]) => `<option value="${k}" ${k == c.code ? "selected" : ""}>${n} (${k} ${s})</option>`).join("")}</select></label>
    ${c.code ? "" : `<label class="f">통화 기호<input data-top="1" data-k="cur" value="${esc(c.cur)}" style="width:100px"></label>`}
    <label class="f">여행 시작일 <span class="mu">Day마다 날짜·날씨가 나와요</span><input type="date" data-top="1" data-k="start" value="${esc(c.start)}"></label>
    <div class="f">여행 일수
      <div class="stepper"><button class="btn" data-a="ndm" aria-label="하루 줄이기">−</button><b>${c.nd}일</b><button class="btn" data-a="ndp" aria-label="하루 늘리기">+</button></div>
      <span class="mu">줄이면 마지막 Day의 장소는 보관함으로 옮겨져요. 중간 Day를 지우려면 일정에서 그 Day의 ⋯ 메뉴를 쓰세요.</span>
    </div>
    <label class="f">기본 이동수단 <span class="mu">장소 사이 이동시간 계산. 구간마다 아이콘을 눌러 따로 바꿀 수 있어요</span><select data-set="mode">${Object.entries(MODES).map(([k, v]) => `<option value="${k}" ${S.mode == k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
  </div>
  <div class="dft"><button class="btn p" data-a="close">완료</button><button class="btn dg" data-a="delc">이 나라 삭제</button></div>`;
}

// ----- 장소 상세: 모든 정보 편집 · 보관함↔Day 이동 · 삭제 -----
function renderPlace(el, o, c) {
  const inWish = c.wish.includes(o), food = o.c == "식사";
  const f = (k, l, ph = "") => `<label class="f">${l}<input data-f="${k}" value="${esc(o[k])}" placeholder="${ph}"></label>`;
  const ta = (k, l, ph = "", min = 2) => `<label class="f">${l}<textarea data-f="${k}" rows="${Math.min(8, Math.max(min, String(o[k] || "").split("\n").length))}" placeholder="${ph}">${esc(o[k])}</textarea></label>`;
  const g = o.id && G.Place;

  el.innerHTML = `<div class="dhd" style="${cv(o.c)}"><span class="ci">${ic(o.c, 18)}</span><input data-f="p" value="${esc(o.p)}" placeholder="장소 이름" aria-label="장소 이름"><button class="x" data-a="close" aria-label="닫기">✕</button></div>
  <div class="dbody">
    ${o.sum ? `<p class="psum">${esc(o.sum)}</p>` : ""}
    <div class="f">종류<div class="segc">${CATS.map(x => `<button class="cf${o.c == x ? " on" : ""}" data-a="setc" data-c="${x}" style="${cv(x)}">${ic(x, 13)}${x}</button>`).join("")}</div></div>
    <div class="row3">
      <label class="f">위치<select data-f="at"><option value="0" ${inWish ? "selected" : ""}>보관함</option>${Array.from({ length: c.nd }, (_, k) => `<option value="${k + 1}" ${!inWish && o.d == k + 1 ? "selected" : ""}>Day ${k + 1}</option>`).join("")}</select></label>
      <label class="f">구분<select data-f="s">${STS.map(x => `<option ${x == (o.s || "필수") ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label class="f">예산(${esc(c.cur)})<input data-f="w" type="number" inputmode="decimal" value="${esc(o.w || 0)}"></label>
    </div>
    <h4 class="fg">운영·요금</h4>
    ${ta("hrs", "운영·입장 시간 (요일별)", "09:00~17:00", 3)}
    ${f("fee", "입장료", "무료 / 1,000엔")}
    ${food || o.price ? f("price", "가격대", "€10~20") : ""}
    ${food || o.brk ? f("brk", "브레이크타임", "15:00~17:00") : ""}
    ${f("pay", "결제", "카드 가능 / 현금만")}
    ${f("rsv", "예약", "예약 필요 / 현장 대기")}
    <h4 class="fg">메모</h4>
    ${food ? f("menu", "대표·인기 메뉴") : ""}
    ${f("dress", "복장 규정")}
    ${f("tip", "꿀팁 (추천 시간대 등)", "오전 9시 전 방문")}
    ${ta("sum", "한 줄 소개", "", 1)}
    ${ta("m", "메모")}
    ${inWish ? "" : `<label class="chk"><input type="checkbox" data-f="done" ${o.done ? "checked" : ""}> 다녀왔어요 <span class="mu">— 예산 탭 '실제 지출'에 들어가요</span></label>`}
    <div id="drev"></div>
  </div>
  <div class="dft">
    ${g ? `<button class="btn" data-a="hrs">영업시간 불러오기</button>` : ""}
    <a class="btn" target="_blank" rel="noopener" href="${gq(o)}">구글맵</a>
    ${/^https?:/.test(o.web || "") ? `<a class="btn" target="_blank" rel="noopener" href="${esc(o.web)}">공식 사이트</a>` : ""}
    <button class="btn dg" data-a="odel">삭제</button>
  </div>`;

  if (g) loadReviews(o);
  // 영업시간이 비어 있으면 자동으로 불러오기 (장소마다 한 번만)
  if (g && !o.hrs && !o.g2 && !tried.has(o)) { tried.add(o); autofill(new G.Place({ id: o.id }), o); }
}

// 구글 평점·리뷰 3개
async function loadReviews(o) {
  try {
    const p = new G.Place({ id: o.id });
    await p.fetchFields({ fields: ["rating", "userRatingCount", "reviews", "googleMapsURI"] });
    const el = $("#drev");
    if (!el || !UI.open || UI.open.o !== o) return;
    el.innerHTML = "";
    if (p.rating) el.appendChild(card(o.p, p));
  } catch (e) { console.error(e); }
}
