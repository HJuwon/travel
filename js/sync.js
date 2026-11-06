// Supabase 연동: 입장 비밀번호 · 불러오기 · 자동 저장 · 충돌 알림
//   - 비밀번호는 이 기기 localStorage에 기억 → 다음부터 바로 입장
//   - 바뀐 내용은 0.8초 뒤 자동 저장, 다른 사람 변경은 새로고침하면 반영
//   - DB 쪽 함수는 supabase/schema.sql 참고
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { sharedData, applyRemote, hooks } from "./state.js";
import { $, esc } from "./utils.js";

const PW_KEY = "trip_pw";
export const online = !!(SUPABASE_URL && SUPABASE_KEY);

let pw = null, version = 0, last = "", timer = 0, busy = false, status = "";

async function rpc(fn, args) {
  const r = await fetch(SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/rpc/" + fn, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) {
    const e = new Error((j && j.message) || r.statusText);
    e.badPw = !!j && (j.code == "28P01" || /bad password/.test(j.message || ""));
    throw e;
  }
  return j;
}

const body = () => JSON.stringify(sharedData());

export const savedPw = () => { try { return localStorage.getItem(PW_KEY); } catch (e) { return null; } };

// 비밀번호로 불러오기. 틀리면 err.badPw = true
export async function login(p) {
  const r = await rpc("load_trip", { p_pw: p });
  pw = p;
  try { localStorage.setItem(PW_KEY, p); } catch (e) {}
  version = r.version || 0;
  if (r.data && r.data.cs) { applyRemote(r.data); last = body(); }
  else last = "";                 // 서버가 비어 있으면 이 기기 데이터를 처음으로 올림
  hooks.afterSave = queue;
  setStatus("saved");
}

// 나가기: 비밀번호와 이 기기에 남은 여행 데이터 사본까지 지움
export function logout() {
  try { localStorage.removeItem(PW_KEY); localStorage.removeItem("trip"); } catch (e) {}
  location.reload();
}

/* ---------- 자동 저장 ---------- */
const LABEL = { saving: "저장 중…", saved: "✓ 저장됨", error: "⚠ 저장 실패 (눌러서 다시)", conflict: "⚠ 충돌" };
function setStatus(s) {
  status = s;
  const el = $("#sync");
  if (!el) return;
  el.hidden = false;
  el.dataset.s = s;
  el.textContent = LABEL[s] || "";
}

function queue() {
  if (body() === last) return;
  setStatus("saving");
  clearTimeout(timer);
  timer = setTimeout(push, 800);
}

async function push(force) {
  if (busy) { clearTimeout(timer); timer = setTimeout(push, 400); return; }
  const b = body();
  if (b === last && !force) { setStatus("saved"); return; }
  busy = true;
  try {
    const r = await rpc("save_trip", { p_pw: pw, p_data: JSON.parse(b), p_base: version });
    if (r.ok) { version = r.version; last = b; setStatus("saved"); }
    else { setStatus("conflict"); conflict(r.version); }
  } catch (e) {
    if (e.badPw) { alert("입장 비밀번호가 바뀌었어요. 새 비밀번호로 다시 들어와 주세요."); logout(); return; }
    setStatus("error");
  } finally { busy = false; }
  if (status == "saved" && body() !== last) queue(); // 저장하는 사이 또 바뀐 내용
}

// 다른 사람이 먼저 저장한 경우
function conflict(remoteVersion) {
  let bar = $("#syncbar");
  if (!bar) { bar = document.createElement("div"); bar.id = "syncbar"; bar.className = "syncbar"; document.body.appendChild(bar); }
  bar.innerHTML = `<span>다른 사람이 먼저 수정했어요.</span><button class="btn" data-sync="reload">새로고침 (내 변경 버림)</button><button class="btn p" data-sync="mine">내 것으로 덮어쓰기</button>`;
  bar.onclick = e => {
    const a = e.target.dataset && e.target.dataset.sync;
    if (a == "reload") location.reload();
    if (a == "mine") { bar.remove(); version = remoteVersion; push(true); }
  };
}

if (online) {
  document.addEventListener("click", e => { if (e.target.id == "sync" && (status == "error")) push(true); });
  // 저장 안 된 변경이 있으면 닫기 전에 확인
  window.addEventListener("beforeunload", e => {
    if (status == "saving" || status == "error" || status == "conflict") { e.preventDefault(); e.returnValue = ""; }
  });
}

/* ---------- 입장 화면 ---------- */
export function showGate(msg = "") {
  const el = document.createElement("div");
  el.className = "gate";
  el.innerHTML = `<form class="gbox">
    <div class="glogo">✈️</div>
    <h1>여행 플래너</h1>
    <p>공유받은 비밀번호를 입력하세요</p>
    <input type="password" autocomplete="current-password" placeholder="비밀번호" aria-label="비밀번호" required>
    <button class="btn p">입장</button>
    <p class="gerr" role="alert">${esc(msg)}</p>
  </form>`;
  document.body.appendChild(el);
  const form = el.querySelector("form"), input = el.querySelector("input"), btn = el.querySelector("button"), err = el.querySelector(".gerr");
  input.focus();
  return new Promise(resolve => {
    form.onsubmit = async e => {
      e.preventDefault();
      btn.disabled = true; btn.textContent = "확인 중…"; err.textContent = "";
      try {
        await login(input.value);
        el.remove();
        resolve();
      } catch (x) {
        err.textContent = x.badPw ? "비밀번호가 달라요" : "연결에 실패했어요. 잠시 후 다시 시도해 주세요.";
        btn.disabled = false; btn.textContent = "입장";
        input.select();
      }
    };
  });
}
