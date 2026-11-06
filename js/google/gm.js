// 구글 지도 관련 객체를 모듈끼리 공유하기 위한 저장소
// (지도 키가 없으면 전부 null로 남고, 나머지 기능은 그대로 동작)
export const G = {
  map: null,     // google.maps.Map
  iw: null,      // InfoWindow
  Place: null,   // places.Place 클래스
  AME: null,     // AdvancedMarkerElement
  PinEl: null,   // PinElement
  Route: null,   // routes.Route (이동시간)
  mk: {},        // 현재 마커들
  line: null,    // 동선 Polyline
};
