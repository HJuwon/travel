// ▼ 구글 클라우드 API 키
//   - 사용 API: Maps JavaScript API, Places API (New), Routes API
//   - 브라우저에 노출되는 키이므로 반드시 "HTTP 리퍼러 제한"을 걸어 주세요.
//   - 키를 넣지 않으면 간이 지도로 동작해요.
export const API_KEY = "YOUR_API_KEY";

// ▼ Supabase (여럿이 같이 쓰기 + 입장 비밀번호)
//   - Supabase → Project Settings → API 의 Project URL 과 publishable(anon) key
//   - 둘 다 공개돼도 되는 값이에요. 데이터는 입장 비밀번호로 DB에서 보호돼요.
//   - ⚠ service_role / secret 키는 절대 넣지 마세요.
//   - 비워 두면 지금처럼 이 브라우저에만 저장돼요 (비밀번호 화면 없음).
export const SUPABASE_URL = "";
export const SUPABASE_KEY = "";
