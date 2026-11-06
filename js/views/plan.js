// 일정 탭: 장소 카드 목록 + 펼친 상세 편집 칸
import { S, cur, vis, nums } from "../state.js";
import { CATS, STS } from "../constants.js";
import { $, esc, won, hasXY, gq } from "../utils.js";

export function renderPlan() {
  const c = cur();
  if (!c) { $("#sheet").innerHTML = ""; return; }
  const v = vis(), dm = S.del, nm = nums(v);
  let h = "";

  v.forEach((o, j) => {
    const r = o.r, i = o.i, n = v[j + 1], sel = i == S.pin && !dm;

    // 전체 보기일 때 Day 머리글 + 그날 비용 합계
    if (!S.day && (j == 0 || v[j - 1].r.d != r.d)) {
      const tot = c.rows.filter(x => x.d == r.d && x.s != "후보").reduce((a, x) => a + (+x.w || 0), 0);
      h += `<div class="dh"><b>Day ${r.d}</b><span>${won(tot)} ${esc(c.cur)}</span></div>`;
    }

    h += `<div class="stop"><div class="bd ${r.s == "후보" ? "op" : ""}">${nm[j]}</div><div class="pc${sel ? " sel" : ""}${S.dsel["r:" + i] ? " sl" : ""}" data-row="${i}" data-del="r:${i}">
<div class="ph"><span class="nm" tabindex="0" draggable="${dm ? "false" : "true"}" data-drag="1" data-a="pin" data-i="${i}" title="눌러서 상세 열기 · 끌어서 순서 변경">${esc(r.p) || "(이름 없음)"} ${sel ? "▾" : "▸"}</span><a class="go" target="_blank" rel="noopener" href="${gq(r)}">구글맵</a></div>
<div class="meta"><span class="tg">${esc(r.s || "필수")}</span><span class="tg">${esc(r.c)}</span>${r.w ? `<span class="tg m">${won(r.w)} ${esc(c.cur)}</span>` : ""}${r.hrs ? `<span class="tg">🕘 ${esc(String(r.hrs).split("\n")[0].slice(0, 26))}</span>` : ""}</div>${sel ? detail(r, i) : ""}</div></div>`;

    // 다음 장소까지 이동 구간 (google/routes.js가 내용을 채움)
    if (n && n.r.d == r.d && r.s != "후보" && n.r.s != "후보" && hasXY(r) && hasXY(n.r)) {
      h += `<div class="lg" id="lg${i}">↓</div>`;
    }
  });

  $("#sheet").innerHTML = `<div class="lbox">${v.length ? h : '<div class="empty">위 검색창에서 장소를 검색하거나,<br>지도의 관광지 아이콘을 눌러 추가해 보세요.</div>'}<div class="acts"><button class="p" data-a="manual">+ 장소 직접 추가</button><span class="mu">장소 이름을 누르면 상세 칸이 열려요</span></div></div>`;
}

function detail(r, i) {
  const f = (k, l, ph) => `<label>${l}<input data-k="${k}" data-i="${i}" value="${esc(r[k])}" placeholder="${ph}"></label>`;
  const ta = (k, l, ph) => `<label style="grid-column:1/-1">${l}<textarea data-k="${k}" data-i="${i}" rows="${Math.min(8, Math.max(1, String(r[k] || "").split("\n").length))}" placeholder="${ph}">${esc(r[k])}</textarea></label>`;
  const food = r.c == "식사";
  return `<div class="ed"><div class="g4"><label>Day<input data-k="d" data-i="${i}" type="number" min="1" value="${r.d}"></label>
<label>구분<select data-k="s" data-i="${i}">${STS.map(x => `<option ${x == (r.s || "필수") ? "selected" : ""}>${x}</option>`).join("")}</select></label>
<label>종류<select data-k="c" data-i="${i}">${CATS.map(x => `<option ${x == r.c ? "selected" : ""}>${x}</option>`).join("")}</select></label>
<label>비용(${esc(cur().cur)})<input data-k="w" data-i="${i}" type="number" value="${esc(r.w)}"></label></div>
<div class="g3">${f("p", "📍 장소명", "")}${f("fee", "💴 입장료", "무료 / 1,000엔")}${ta("hrs", "🕘 운영·입장 시간 (요일별)", "09:00~17:00")}${food ? f("brk", "🍽️ 브레이크타임", "15:00~17:00") + f("menu", "🍜 대표·인기 메뉴", "") : ""}${f("dress", "👔 복장 규정", "")}${f("tip", "💡 꿀팁 (추천 시간대 등)", "오전 9시 전 방문")}${f("m", "📝 메모", "")}</div>
<div class="bt"><button class="ic" data-a="mv" data-dir="-1" data-i="${i}" title="위로">↑</button><button class="ic" data-a="mv" data-dir="1" data-i="${i}" title="아래로">↓</button>${r.id ? `<button data-a="hrs" data-i="${i}">구글에서 영업시간 불러오기</button>` : ""}${/^https?:/.test(r.web || "") ? ` <a target="_blank" rel="noopener" href="${esc(r.web)}">공식 사이트</a>` : ""}<button data-a="tow" data-i="${i}">📌 위시로 보내기</button><button class="dl" data-a="delr" data-i="${i}">🗑 장소 삭제</button></div></div>`;
}
