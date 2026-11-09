// 환율: 통화 목록 + 자동 환율 (ExchangeRate-API 무료 공개 주소, 키 불필요, 하루 1번 갱신)
//   https://www.exchangerate-api.com/docs/free  (출처 표시 필요 → 예산 탭 환율 카드에 표시)

// [코드, 기호, 이름, 이 통화를 쓰는 나라 이름들(자동 추정용)]
export const CURS = [
  ["JPY", "¥", "일본 엔", ["일본"]],
  ["USD", "$", "미국 달러", ["미국", "괌", "사이판", "하와이"]],
  ["EUR", "€", "유로", ["프랑스", "독일", "이탈리아", "스페인", "포르투갈", "네덜란드", "오스트리아", "그리스", "벨기에", "핀란드", "아일랜드", "크로아티아"]],
  ["CNY", "¥", "중국 위안", ["중국"]],
  ["TWD", "NT$", "대만 달러", ["대만"]],
  ["HKD", "HK$", "홍콩 달러", ["홍콩"]],
  ["MOP", "MOP$", "마카오 파타카", ["마카오"]],
  ["THB", "฿", "태국 바트", ["태국"]],
  ["VND", "₫", "베트남 동", ["베트남"]],
  ["PHP", "₱", "필리핀 페소", ["필리핀"]],
  ["SGD", "S$", "싱가포르 달러", ["싱가포르"]],
  ["MYR", "RM", "말레이시아 링깃", ["말레이시아"]],
  ["IDR", "Rp", "인도네시아 루피아", ["인도네시아", "발리"]],
  ["GBP", "£", "영국 파운드", ["영국"]],
  ["CHF", "CHF", "스위스 프랑", ["스위스"]],
  ["AUD", "A$", "호주 달러", ["호주"]],
  ["NZD", "NZ$", "뉴질랜드 달러", ["뉴질랜드"]],
  ["CAD", "C$", "캐나다 달러", ["캐나다"]],
  ["MNT", "₮", "몽골 투그릭", ["몽골"]],
  ["CZK", "Kč", "체코 코루나", ["체코"]],
  ["HUF", "Ft", "헝가리 포린트", ["헝가리"]],
  ["TRY", "₺", "튀르키예 리라", ["튀르키예", "터키"]],
];
export const curOf = code => CURS.find(x => x[0] == code);

// 통화 코드가 없으면 나라 이름 → 기호 순서로 추정
export function guessCode(c) {
  const byName = CURS.find(x => x[3].some(n => (c.n || "").includes(n)));
  if (byName) return byName[0];
  const bySym = CURS.find(x => x[1] == c.cur);
  return bySym ? bySym[0] : "";
}

const KEY = "trip_fx", TTL = 6 * 3600 * 1000; // 6시간마다 다시 확인 (원본은 하루 1번 갱신)
let mem = {};
try { mem = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
const pending = {};

// 1 code = ? 원.  { rate, at(갱신 시각 ms) } 또는 null
export async function liveRate(code) {
  if (!code) return null;
  const m = mem[code];
  if (m && Date.now() - m.got < TTL) return m;
  if (!pending[code]) pending[code] = (async () => {
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/" + code);
      const j = await r.json();
      if (j.result != "success" || !j.rates || !j.rates.KRW) throw 0;
      mem[code] = { rate: j.rates.KRW, at: j.time_last_update_unix * 1000, got: Date.now() };
      try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {}
      return mem[code];
    } catch (e) {
      return m || null; // 실패하면 예전 값이라도
    } finally { delete pending[code]; }
  })();
  return pending[code];
}

// 화면에 보일 환율 숫자 (작은 통화는 소수점 더)
export const fmtRate = r => r >= 100 ? Math.round(r).toLocaleString("ko-KR") : r >= 1 ? (+r.toFixed(2)).toString() : (+r.toFixed(4)).toString();
