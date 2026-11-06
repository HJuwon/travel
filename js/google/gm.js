// 구글 지도 관련 객체를 모듈끼리 공유하기 위한 저장소
// (지도 키가 없으면 전부 null로 남고, 간이 지도로 대신 그려짐)
export const G = {
  map: null,     // google.maps.Map
  iw: null,      // InfoWindow (지도 위 관광지 아이콘 클릭용)
  Place: null,   // places.Place 클래스
  AME: null,     // AdvancedMarkerElement
  Route: null,   // routes.Route (이동시간)
  mk: {},        // 현재 마커들 (키 → 마커)
  lines: [],     // Day별 동선 Polyline
};
