// Vercel 서버 함수: 구글 지도 "공유 목록" 링크 → 장소 목록 (이름·주소·좌표·구글 ID)
//   GET /api/glist?url=https://maps.app.goo.gl/...
//
//   ⚠ 구글이 공개한 API가 아니에요. 구글 지도 웹페이지가 내부적으로 쓰는 주소(entitylist/getlist)를 읽어요.
//     (참고: github.com/ForceGT/gmaps-list-export, github.com/anupamchugh/gmaps-list)
//     구글이 형식을 바꾸면 고장 날 수 있어요. 그때는 앱에 "불러오지 못했어요"만 뜨고 다른 기능은 그대로예요.
//   - 링크가 있는 사람이 볼 수 있게 공유된 목록만 돼요 (비공개 목록은 로그인이 필요해서 안 됨)
//   - 구글 장소 API를 부르지 않아서 요금이 없어요
//   - 보안: 구글 지도 주소만 요청하고, 짧은 링크의 리다이렉트도 하나하나 구글 주소인지 확인 (SSRF 방지)
//           이 사이트 화면에서 온 요청만 받음 (다른 사이트·브라우저에서 이 주소를 가져다 쓰지 못하게)

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const SHORT = ["maps.app.goo.gl", "goo.gl"];
// google.com, google.co.kr, google.com.au, google.it … (www. / maps. 포함). google.ab.cd 같은 남의 도메인은 안 됨
const GOOGLE = /^(www\.|maps\.)?google\.(com|co\.[a-z]{2}|com\.[a-z]{2}|[a-z]{2})$/;

const isShort = u => SHORT.includes(u.hostname) && (u.hostname != "goo.gl" || u.pathname.startsWith("/maps"));
const isGoogle = u => u.protocol == "https:" && GOOGLE.test(u.hostname);

function fail(res, code, msg) {
  res.status(code).json({ error: msg });
}

async function get(url, opt = {}) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
  try {
    return await fetch(url, { redirect: "manual", signal: ctl.signal, headers: { "user-agent": UA, "accept-language": "ko-KR,ko;q=0.9" }, ...opt });
  } finally { clearTimeout(t); }
}

// 짧은 링크 → 실제 구글 지도 주소 (리다이렉트를 최대 5번, 매번 주소 확인)
async function resolve(u) {
  for (let i = 0; i < 5 && isShort(u); i++) {
    const r = await get(u.href);
    const loc = r.headers.get("location");
    if (!loc) throw Object.assign(new Error("짧은 링크를 열 수 없어요"), { code: 404 });
    u = new URL(loc, u);
    if (!isShort(u) && !isGoogle(u)) throw Object.assign(new Error("구글 지도 링크가 아니에요"), { code: 400 });
  }
  return u;
}

// 주소에서 목록 ID 찾기: .../data=!4m3!11m2!2s<ID>!3e3  또는  /placelists/list/<ID>
function listId(u) {
  const s = decodeURIComponent(u.href);
  const m = s.match(/!11m\d+!2s([A-Za-z0-9_-]{10,})/) || s.match(/placelists\/list\/([A-Za-z0-9_-]{10,})/) || s.match(/!2s([A-Za-z0-9_-]{16,})!3e3/);
  return m && m[1];
}

// ----- 응답(JSON 배열) 해석: 구조가 조금 바뀌어도 버티도록 모양으로 찾음 -----
const isNum = x => typeof x == "number" && isFinite(x);
// [null, null, 위도, 경도] 모양 찾기
function coords(x, depth = 0) {
  if (!Array.isArray(x) || depth > 4) return null;
  for (let i = 0; i + 1 < x.length; i++) {
    const a = x[i], b = x[i + 1];
    if (isNum(a) && isNum(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180 && (a % 1 || b % 1) && x.slice(0, i).every(v => v == null)) return [a, b];
  }
  for (const y of x) { const c = coords(y, depth + 1); if (c) return c; }
  return null;
}
// 문자열 모으기
function strings(x, out = [], depth = 0) {
  if (typeof x == "string") out.push(x);
  else if (Array.isArray(x) && depth < 6) x.forEach(y => strings(y, out, depth + 1));
  return out;
}
// 장소 하나: [?, [.. 주소 .. [null,null,lat,lng] ..], "이름", "메모", ...]
const isPlace = e => Array.isArray(e) && typeof e[2] == "string" && e[2].trim() && Array.isArray(e[1]) && coords(e[1]);

// 장소들이 들어 있는 배열 = 장소 모양 원소가 가장 많은 배열
function findPlaces(x, best = { n: 0, a: null }, depth = 0) {
  if (!Array.isArray(x) || depth > 6) return best;
  const n = x.filter(isPlace).length;
  if (n > best.n) { best.n = n; best.a = x; }
  x.forEach(y => findPlaces(y, best, depth + 1));
  return best;
}

function parse(data) {
  const root = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;
  const arr = findPlaces(root).a || [];
  const places = arr.filter(isPlace).map(e => {
    const [la, lo] = coords(e[1]);
    const ss = strings(e[1]);
    const id = ss.find(s => /^ChIJ[\w-]{10,}$/.test(s)) || "";          // 구글 Place ID (있으면)
    const ftid = ss.find(s => /^0x[0-9a-f]+:0x[0-9a-f]+$/i.test(s)) || ""; // 구글 내부 장소 번호
    const addr = typeof e[1][4] == "string" ? e[1][4] : (ss.find(s => s.length > 8 && /\d/.test(s) && !/^0x|^ChIJ|^https?:/.test(s)) || "");
    return { p: e[2].trim(), la, lo, id, ftid, addr, note: typeof e[3] == "string" ? e[3] : "" };
  });
  // 목록 이름: 장소 배열 바깥의 짧은 문자열 중 첫 번째
  const title = (Array.isArray(root) ? root : []).find(s => typeof s == "string" && s.length < 80 && !/^[\w-]{16,}$/.test(s)) || "";
  return { title, places };
}

// 이 사이트에서 보낸 요청인지 (브라우저가 붙이는 Sec-Fetch-Site / Origin / Referer 로 확인)
function sameSite(req) {
  const h = req.headers, host = String(h["x-forwarded-host"] || h.host || "").toLowerCase();
  const site = h["sec-fetch-site"];
  if (site) return site == "same-origin";
  const from = h.origin || h.referer;
  try { return !!from && new URL(from).host.toLowerCase() == host; } catch (e) { return false; }
}

module.exports = async (req, res) => {
  res.setHeader("cache-control", "no-store");
  if (req.method != "GET") return fail(res, 405, "GET만 돼요");
  if (!sameSite(req)) return fail(res, 403, "이 사이트에서만 쓸 수 있어요");
  let u;
  try { u = new URL(String(req.query.url || "").trim()); } catch (e) { return fail(res, 400, "링크 형식이 올바르지 않아요"); }
  if (!isShort(u) && !isGoogle(u)) return fail(res, 400, "구글 지도 링크(maps.app.goo.gl 또는 google.com/maps)만 넣을 수 있어요");

  try {
    u = await resolve(u);
    const id = listId(u);
    if (!id) return fail(res, 400, "목록 링크가 아니에요. 구글 지도에서 목록 → 공유로 받은 링크를 넣어 주세요");

    const api = "https://www.google.com/maps/preview/entitylist/getlist?authuser=0&hl=ko&gl=kr&pb="
      + encodeURIComponent("!1m4!1s" + id + "!2e1!3m1!1e1!2e2!3e2!4i500!16b1");
    const r = await get(api);
    if (r.status == 403 || r.status == 401) return fail(res, 403, "비공개 목록이라 읽을 수 없어요. 구글 지도에서 목록을 '링크 공유'로 바꿔 주세요");
    if (!r.ok) return fail(res, 502, "구글에서 목록을 받지 못했어요 (" + r.status + ")");
    const text = (await r.text()).replace(/^\)\]\}'\s*/, "");
    let data;
    try { data = JSON.parse(text); } catch (e) { return fail(res, 502, "구글 응답 형식이 바뀌어서 읽지 못했어요"); }
    const out = parse(data);
    if (!out.places.length) return fail(res, 404, "목록에서 장소를 찾지 못했어요. 비공개이거나 빈 목록일 수 있어요");
    res.status(200).json({ id, ...out });
  } catch (e) {
    if (e.name == "AbortError") return fail(res, 504, "구글 응답이 너무 늦어요. 잠시 뒤 다시 시도해 주세요");
    return fail(res, e.code || 500, e.code ? e.message : "불러오는 중 오류가 났어요");
  }
};
