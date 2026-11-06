// ▼ 구글 클라우드 API 키 → js/keys.js 에서 읽어요 (GitHub에는 올리지 않음)
//   - 사용 API: Maps JavaScript API, Places API (New), Routes API
//   - 로컬: js/keys.js 파일에  export const API_KEY = "AIza...";  (.gitignore 됨)
//   - Vercel: 환경 변수 GOOGLE_MAPS_API_KEY → 배포할 때 scripts/vercel-build.js 가 keys.js 를 만듦
//   - 브라우저에 노출되는 키이므로 반드시 "HTTP 리퍼러 제한"을 걸어 주세요.
//   - keys.js 가 없으면 간이 지도로 동작해요.
export const API_KEY = await import("./keys.js").then(m => m.API_KEY || "", () => "");

// ▼ Supabase (여럿이 같이 쓰기 + 입장 비밀번호)
//   - Supabase → Project Settings → API 의 Project URL 과 publishable(anon) key
//   - 둘 다 공개돼도 되는 값이에요. 데이터는 입장 비밀번호로 DB에서 보호돼요.
//   - ⚠ service_role / secret 키는 절대 넣지 마세요.
//   - 비워 두면 지금처럼 이 브라우저에만 저장돼요 (비밀번호 화면 없음).
export const SUPABASE_URL = "https://mqmcipkmvvrhevavmihw.supabase.co";
export const SUPABASE_KEY = "sb_publishable_wx-7_HtuX7JcLfVHyZY5Yg_5wr4jWMk";
