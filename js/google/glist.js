// 구글 지도 공유 목록 → 보관함
//   서버 함수 /api/glist 가 링크를 읽어 장소 목록을 돌려줌 (구글 장소 API 요금 없음)
//   - 처음 불러오면 목록의 장소가 전부 보관함으로
//   - 다시 불러오면 이 링크로 전에 가져온 장소는 건너뛰고 새 장소만
//     (Day로 옮겼거나 지운 장소도 다시 안 들어옴)
//   c.gl = [{ url, title, keys: [가져온 장소 키…], at: 마지막으로 불러온 시각, n: 목록 장소 수 }]
import { UI, cur, save } from "../state.js";
import { hasXY, toast } from "../utils.js";
import { render } from "../render.js";

// 장소 이름으로 종류 추측 (목록에는 종류 정보가 없어서)
const CAT = [
  [/카페|커피|coffee|cafe|café|스타벅스|starbucks|베이커리|bakery|빵|제과|팡|디저트|아이스크림|젤라또|gelato|라멘|라면|ramen|스시|sushi|식당|레스토랑|restaurant|trattoria|osteria|pizzeria|피자|bistro|비스트로|이자카야|야키|우동|소바|돈카츠|규카츠|버거|bar\b|와인|맥주|pub/i, "식사"],
  [/호텔|hotel|호스텔|hostel|료칸|ryokan|게스트하우스|inn\b|리조트|resort/i, "숙소"],
  [/역$|역\s|station|공항|airport|터미널|terminal|항구|port\b/i, "교통"],
  [/쇼핑|몰|mall|백화점|돈키호테|유니클로|uniqlo|지유|gu\b|아울렛|outlet|마켓|market|시장|스토어|store|shop/i, "쇼핑"],
];
const catOf = n => (CAT.find(([re]) => re.test(n)) || [0, "관광"])[1];

// 같은 장소인지 알아보는 키
const keyOf = x => x.id || x.ftid || x.p + "@" + (+x.la).toFixed(4) + "," + (+x.lo).toFixed(4);
const same = (o, x) => (x.id && o.id == x.id) || (x.ftid && o.gf == x.ftid)
  || (o.p == x.p && hasXY(o) && Math.abs(o.la - x.la) < 5e-4 && Math.abs(o.lo - x.lo) < 5e-4);

export async function importList(i) {
  const c = cur(), e = c && c.gl[i];
  if (!e || UI.glBusy != null) return;
  UI.glBusy = i; UI.glMsg = null;
  render();
  try {
    const r = await fetch("/api/glist?url=" + encodeURIComponent(e.url));
    const j = await r.json().catch(() => null);
    if (!j) throw new Error(r.status == 404 ? "이 기능은 배포된 사이트(Vercel)에서만 동작해요" : "서버 응답을 읽지 못했어요 (" + r.status + ")");
    if (!r.ok || j.error) throw new Error(j.error || "불러오지 못했어요 (" + r.status + ")");

    if (j.title) e.title = j.title;
    const all = [...c.rows, ...c.wish];
    let add = 0, skip = 0;
    j.places.forEach(x => {
      const k = keyOf(x), old = e.keys.includes(k) || all.some(o => same(o, x));
      if (!e.keys.includes(k)) e.keys.push(k);
      if (old) { skip++; return; }
      c.wish.push({ p: x.p, id: x.id || "", gf: x.ftid || "", la: x.la, lo: x.lo, c: catOf(x.p), w: 0, m: x.note || "", addr: x.addr || "" });
      add++;
    });
    e.at = Date.now(); e.n = j.places.length;
    UI.glMsg = { i, ok: 1, t: add ? `✓ 새 장소 ${add}곳을 보관함에 넣었어요` + (skip ? ` (전에 가져온 ${skip}곳은 건너뜀)` : "") : `새 장소가 없어요 (목록 ${j.places.length}곳 모두 전에 가져왔어요)` };
    if (add) { UI.wishOn = true; toast(UI.glMsg.t); }
  } catch (err) {
    UI.glMsg = { i, t: "⚠ " + err.message };
  }
  UI.glBusy = null;
  save();
  render();
}

// 새 링크 저장 후 바로 불러오기
export function addList(url) {
  const c = cur();
  url = String(url || "").trim();
  if (!c || !url) return false;
  if (!/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.|maps\.)?google\.[a-z.]+\/maps)/i.test(url)) { UI.glMsg = { i: -1, t: "⚠ 구글 지도 목록 링크(https://maps.app.goo.gl/…)를 넣어 주세요" }; return false; }
  c.gl.push({ url, title: "", keys: [], at: 0, n: 0 });
  importList(c.gl.length - 1);
  return true;
}
