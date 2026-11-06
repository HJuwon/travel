# ✈️ 여행 플래너

나라별로 여행 일정을 짜고, 여행 중에는 대시보드로 보는 웹앱입니다.
빌드 도구 없이 HTML, CSS, 바닐라 JS(ES 모듈)로 만들었고, 데이터는 브라우저 `localStorage`에 저장됩니다.

## 화면

### 일정 탭 · 계획 모드 (PC·태블릿에서 일정 짜기)
- **왼쪽 보관함**: 가고 싶은 곳을 모아 둡니다. 구글 장소 검색, 직접 추가, 카테고리 필터를 쓸 수 있습니다.
- **가운데 Day 칸**: 카드를 끌어다 놓아 일정에 넣고 순서를 바꿉니다. 마우스는 바로 잡히고, 터치에서는 길게 눌러 잡습니다.
  - 카드 사이에는 이동시간이 표시됩니다 (지도 키가 없으면 직선거리).
  - Day 칸 ⋯ 메뉴에서 Day를 삭제할 수 있고, 그 Day의 장소는 보관함으로 옮겨집니다.
- **오른쪽 지도**: 카테고리별 아이콘 마커와 동선을 보여 줍니다. Day 칩으로 하루만 볼 수 있습니다.
- **상세 패널**: 카드를 누르면 열립니다. 종류·위치(보관함/Day)·필수/후보·비용·운영시간·입장료·꿀팁·메모를 편집하고, 구글 리뷰와 영업시간을 불러옵니다.

### 일정 탭 · 대시보드 모드 (여행 중에 보기)
- Day별 확정 일정, 지도, 후보 목록만 보여 줍니다.
- 여행 시작일을 넣어 두면 여행 중에는 **오늘 Day**가 자동으로 선택되고, Day별 날씨가 나옵니다.
- 휴대폰에서는 지도 → 그날 일정 → 후보 순서로 나옵니다.

### 준비 · 예산 · 날씨 탭
| 탭 | 내용 |
|---|---|
| 준비 | 예약 정보, 비자·여권·보험, 준비물 체크리스트, 교통·결제 메모, 환율 계산기 |
| 예산 | 카테고리별 비용 합계와 원화 환산 (후보·보관함은 제외) |
| 날씨 | 여행 시작일 기준 Day별 예보 ([Open-Meteo](https://open-meteo.com/), 키 필요 없음) |

### 카테고리
관광 · 식사 · 숙소 · 교통 · 쇼핑 · 기타. 카드, 필터, 지도 마커, 예산 막대에서 같은 아이콘과 색을 씁니다.
구글에서 검색해 추가하면 장소 종류를 보고 카테고리를 자동으로 고릅니다.

## 실행

ES 모듈을 쓰기 때문에 `index.html`을 더블클릭(`file://`)하면 동작하지 않습니다. 로컬 서버로 열어 주세요.

```bash
python -m http.server 8000
```

또는

```bash
npx serve .
```

드래그 기능은 [SortableJS](https://github.com/SortableJS/Sortable)를 CDN(jsdelivr)에서 불러오므로 인터넷 연결이 필요합니다.

## 구글 지도 API 키 (선택)

키가 없으면 장소 검색이 꺼지고, 지도는 좌표만 찍는 **간이 지도**로 나옵니다. 나머지 기능은 모두 동작합니다.

1. Google Cloud Console에서 **Maps JavaScript API**, **Places API (New)**, **Routes API**를 사용 설정합니다.
2. API 키를 만들고 **HTTP 리퍼러 제한**을 겁니다. 예: `http://localhost:*/*`, `https://<github-아이디>.github.io/*`
3. `js/config.js`의 `API_KEY` 값을 바꿉니다.

> 브라우저에서 쓰는 키는 어차피 사용자에게 노출됩니다. 커밋 여부와 관계없이 리퍼러 제한은 꼭 걸어 주세요.

## 폴더 구조

```
index.html              뼈대 마크업
css/colors.css          🎨 모든 색 (라이트/다크, 카테고리 색). 색을 바꾸려면 이 파일만 고치면 됨
css/style.css           레이아웃·모양 (색은 colors.css 변수만 사용)
js/
  main.js               시작점 (이벤트 연결, 첫 렌더, 지도 스크립트 로드)
  config.js             API 키
  constants.js          카테고리, 이동수단, 기본 체크리스트
  icons.js              카테고리 아이콘·색, 구글 장소 종류 → 카테고리
  seed.js               예시 데이터 (일본 4일)
  state.js              저장 데이터 S, 화면 상태 UI, localStorage, 이전 데이터 변환
  utils.js              $, esc, won, 날짜·거리 계산 등
  colors.js             colors.css 값을 JS(구글 지도 동선)에서 읽는 도우미
  render.js             전체 화면 다시 그리기
  views/
    header.js           나라 메뉴, 탭, 계획/대시보드 전환
    board.js            계획 모드: 보관함 + Day 칸
    card.js             장소 카드
    drawer.js           장소 상세 패널
    dash.js             대시보드 모드
    mapview.js          지도에 올릴 점·선 계산, 간이 지도
    prep.js · budget.js · weather.js
  google/               구글 지도, 장소(Places), 이동시간(Routes)
  events/               클릭, 입력, 드래그(SortableJS)
```

## GitHub Pages 배포

저장소의 Settings → Pages에서 Branch를 `main` / `(root)`로 지정하면 `https://<아이디>.github.io/<저장소>/`에서 열립니다.
