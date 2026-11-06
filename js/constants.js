// 앱 전체에서 쓰는 고정값

export const CATS = ["관광", "식사", "숙소", "교통", "쇼핑", "기타"];

export const MODES = { TRANSIT: "🚇 대중교통", WALKING: "🚶 도보", DRIVING: "🚗 자동차" };

// 구분: 필수 / 후보 (후보는 번호·동선·예산에서 빠짐)
export const STS = ["필수", "후보"];
export const STC = { "필수": "#0b84e5", "후보": "#9db0c2" };

// 준비 탭 기본 체크리스트
export const CHK0 = ["여권", "충전기·보조배터리", "멀티 어댑터", "상비약", "세면도구", "현지 결제 카드", "옷·신발", "우산"];
export const DOC0 = ["여권 유효기간 6개월 이상", "비자·전자입국허가(ETA)", "입국신고서·세관신고", "여행자보험 가입", "국제운전면허증", "로밍·유심·eSIM"];
export const newPrep = (bk = []) => ({
  chk: CHK0.map(t => ({ t, x: 0 })),
  docs: DOC0.map(t => ({ t, x: 0 })),
  bk,
});

// 삭제 모드 이름
export const DL = { r: "장소", day: "Day", c: "나라", bk: "예약", docs: "서류", chk: "준비물" };
