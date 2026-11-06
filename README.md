# ✈️ 여행 플래너

나라별로 여행 일정, 위시리스트, 준비물, 예산, 날씨를 한 화면에서 관리하는 웹앱입니다.
빌드 도구 없이 HTML, CSS, 바닐라 JS(ES 모듈)로 만들었고, 데이터는 브라우저 `localStorage`에 저장됩니다.

## 기능

| 탭 | 내용 |
|---|---|
| 📌 위시 | 가고 싶은 곳을 모아 두었다가 골라서 Day에 배치 |
| 🗺️ 일정 | Day별 장소 카드, 지도 마커와 동선, 카드 사이 이동시간, 드래그로 순서 변경, 영업시간 자동 채우기 |
| 🧳 준비 | 예약 정보, 비자·여권·보험, 준비물 체크리스트, 교통·결제 메모, 환율 계산기 |
| 💰 예산 | 종류별 비용 합계와 원화 환산 (후보 장소는 제외) |
| 🌤️ 날씨 | 여행 시작일 기준 Day별 예보 ([Open-Meteo](https://open-meteo.com/), 키 필요 없음) |

## 실행

ES 모듈을 쓰기 때문에 `index.html`을 더블클릭(`file://`)하면 동작하지 않습니다. 로컬 서버로 열어 주세요.

```bash
npx serve .
```

또는

```bash
python -m http.server 8000
```

VS Code를 쓴다면 Live Server 확장으로 열어도 됩니다.

## 구글 지도 API 키 (선택)

키가 없어도 지도를 뺀 나머지 기능은 모두 동작합니다.

1. Google Cloud Console에서 **Maps JavaScript API**, **Places API (New)**, **Routes API**를 사용 설정합니다.
2. API 키를 만들고 **HTTP 리퍼러 제한**을 겁니다. 예: `http://localhost:*/*`, `https://<github-아이디>.github.io/*`
3. `js/config.js`의 `API_KEY` 값을 바꿉니다.

> 브라우저에서 쓰는 키는 어차피 사용자에게 노출됩니다. 커밋 여부와 관계없이 리퍼러 제한은 꼭 걸어 주세요.

## 폴더 구조

```
index.html              뼈대 마크업
css/colors.css          🎨 모든 색 (라이트/다크). 색을 바꾸려면 이 파일만 고치면 됨
css/style.css           레이아웃·모양 (색은 colors.css 변수만 사용)
js/
  main.js               시작점 (이벤트 연결, 첫 렌더, 지도 스크립트 로드)
  colors.js             colors.css 값을 JS(지도 마커·동선)에서 읽는 도우미
  config.js             API 키
  constants.js          카테고리, 이동수단, 기본 체크리스트
  seed.js               예시 데이터 (일본 4일)
  state.js              상태 S, localStorage 저장, 이전 데이터 변환
  utils.js              $, esc, won, 거리 계산 등
  render.js             전체 화면 다시 그리기
  views/                탭과 영역별 화면 (header, days, plan, wish, delbar, prep, budget, weather)
  google/               지도, 장소(Places), 이동시간(Routes)
  events/               클릭, 입력, 드래그 처리
```

## GitHub Pages 배포

저장소의 Settings → Pages에서 Branch를 `main` / `(root)`로 지정하면 `https://<아이디>.github.io/<저장소>/`에서 열립니다.
