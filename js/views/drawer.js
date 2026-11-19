// 오른쪽 패널 (휴대폰은 화면 전체): 장소 상세 · 장소 추가 · 여행 설정 · 구글 목록 불러오기
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
  if (!c) UI.set = UI.imp = false;
  const on = !!(O || A || UI.set || UI.imp);
  el.classList.toggle("on", on);
  $("#scrim").hidden = !on;
  if (A) { renderAdd(el); return; }               // 장소 추가
  if (UI.set) { renderSettings(el, c); return; }  // 여행 설정
  if (UI.imp) { renderImport(el, c); return; }    // 구글 목록 불러오기
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

// ----- 구글 목록 불러오기: 링크 저장 · 수정 · 다시 불러오기(새 장소만) -----
function renderImport(el, c) {
  const when = ms => { const d = new Date(ms); return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  const msg = i => UI.glMsg && UI.glMsg.i == i ? `<p class="glmsg${UI.glMsg.ok ? " ok" : ""}">${esc(UI.glMsg.t)}</p>` : "";
  const busy = UI.glBusy != null;
  el.innerHTML = `<div class="dhd"><span class="ci" style="--c:var(--accent)">🔗</span><b class="atl">구글 목록 불러오기</b><button class="x" data-a="close" aria-label="닫기">✕</button></div>
  <div class="dbody">
    <p class="mu" style="margin:0">구글 지도에서 목록 → <b>공유</b> → 링크 복사 후 붙여 넣으세요. 목록의 장소가 전부 보관함으로 들어와요.
      다시 불러오면 <b>새로 추가된 장소만</b> 들어와요 (Day로 옮겼거나 지운 장소는 다시 안 들어와요).</p>
    ${c.gl.map((e, i) => `<div class="glc">
      <div class="glh"><b>${esc(e.title || "구글 목록")}</b><span class="mu">${e.at ? when(e.at) + " · " + e.n + "곳" : "아직 안 불러옴"}</span></div>
      <input data-gl="url" data-i="${i}" value="${esc(e.url)}" aria-label="목록 링크 (고칠 수 있어요)">
      <div class="pact"><button class="btn p" data-a="glgo" data-i="${i}" ${busy ? "disabled" : ""}>${UI.glBusy == i ? "불러오는 중…" : "↻ 새 장소 불러오기"}</button><button class="btn dg" data-a="gldel" data-i="${i}">링크 삭제</button></div>
      ${msg(i)}
    </div>`).join("")}
    <label class="f">${c.gl.length ? "다른 목록 추가" : "목록 링크"}<input data-gl="new" placeholder="https://maps.app.goo.gl/…" inputmode="url" autocomplete="off"></label>
    <div><button class="btn p" data-a="gladd" ${busy ? "disabled" : ""}>확인</button></div>
    ${msg(-1)}
    <p class="mu" style="margin:0">⚠ '링크가 있는 사람 누구나 보기'로 공유한 목록만 돼요. 비공개 목록은 안 돼요.<br>구글이 공개한 기능이 아니라서 구글이 바꾸면 안 될 수 있어요. 이때도 다른 기능은 그대로예요.<br>목록을 불러올 때는 구글 요금이 안 나가요.</p>
  </div>
  <div class="dft"><button class="btn" data-a="close">닫기</button></div>`;
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
