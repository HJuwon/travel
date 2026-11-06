# ✈️ 여행 플래너

나라별로 여행 일정을 짜고, 여행 중에는 대시보드로 보는 웹앱입니다.
빌드 도구 없이 HTML, CSS, 바닐라 JS(ES 모듈)로 만들었고, 데이터는 브라우저 `localStorage`에 저장됩니다.

## 화면

### 일정 탭 · 계획 모드 (PC·태블릿에서 일정 짜기)
- **왼쪽 보관함**: 가고 싶은 곳을 모아 둡니다. 구글 장소 검색, 직접 추가, 카테고리 필터를 쓸 수 있습니다.
- **가운데 Day 칸**: 카드를 끌어다 놓아 일정에 넣고 순서를 바꿉니다. 마우스는 바로 잡히고, 터치에서는 길게 눌러 잡습니다.
  - 카드 사이에는 이동시간이 표시됩니다 (지도 키가 없으면 직선거리).
  - 구간마다 **길찾기 ↗** 링크가 있어 누르면 구글맵(휴대폰에선 앱)에서 그 구간 길찾기가 열립니다. 일본 대중교통처럼 API로 시간이 안 나오는 곳도 구글맵에서는 보이고, 링크라 요금이 들지 않습니다.
  - Day 칸 ⋯ 메뉴에서 Day를 삭제할 수 있고, 그 Day의 장소는 보관함으로 옮겨집니다.
- **오른쪽 지도**: 카테고리별 아이콘 마커와 동선을 보여 줍니다. Day 칩으로 하루만 볼 수 있습니다.
  - **내 장소 걸러 보기**: 지도 위 카테고리 칩(관광·식사·숙소…)을 누르면 보관함과 일정 중 그 종류만 남습니다.
  - **주변 찾기** (구글 지도 키 필요): 지도 위 음식점·카페·관광명소·쇼핑·숙소 버튼이나 검색어로 지금 보이는 지역의 장소를 찾아 네모 핀으로 띄웁니다. 핀을 눌러 평점·리뷰를 보고 **+ 보관함 / Day n**으로 바로 넣을 수 있고, 패널이 열리지 않아 계속 찾고 추가할 수 있습니다. 지도를 옮기면 "이 지역 다시 찾기"가 나옵니다.
- **상세 패널**: 카드를 누르면 열립니다. 종류·위치(보관함/Day)·필수/후보·비용·운영시간·입장료·꿀팁·메모를 편집하고, 구글 리뷰와 영업시간을 불러옵니다.

### 일정 탭 · 대시보드 모드 (여행 중에 보기)
- Day별 확정 일정, 지도, 후보 목록만 보여 줍니다.
- 여행 시작일을 넣어 두면 여행 중에는 **오늘 Day**가 자동으로 선택되고, Day별 날씨가 나옵니다.
- 휴대폰에서는 지도 → 그날 일정 → 후보 순서로 나옵니다.
- 장소마다 **길찾기 ↗**: 앞 장소에서 여기까지(첫 장소는 현재 위치에서) 구글맵 길찾기를 엽니다.

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

## 같이 쓰기: Supabase + 입장 비밀번호 (선택)

`js/config.js`의 Supabase 값을 채우면, 사이트에 들어올 때 **비밀번호 화면**이 먼저 나옵니다.
비밀번호를 한 번 맞게 입력한 기기는 다음부터 바로 들어와지고, 모두 같은 데이터를 보고 수정합니다.
다른 사람이 고친 내용은 새로고침하면 보이고, 동시에 고쳐서 충돌하면 알려 줍니다.
비워 두면 지금처럼 각자 브라우저에만 저장됩니다.

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 만듭니다. **Region은 Northeast Asia (Seoul)** 로 고르세요. 나중에 바꿀 수 없습니다.
2. 대시보드 → **SQL Editor**에 [`supabase/schema.sql`](supabase/schema.sql)을 통째로 붙여 넣고 Run 합니다.
3. 같은 파일 맨 아래 "비밀번호 설정" 문장의 주석(`--`)을 풀고, `여기에_비밀번호`를 원하는 비밀번호로 바꿔 그 문장만 실행합니다.
4. Project Settings → **API**의 Project URL과 publishable(anon) key를 `js/config.js`의 `SUPABASE_URL`, `SUPABASE_KEY`에 넣습니다.
   - 둘 다 공개돼도 되는 값입니다. 데이터는 비밀번호가 맞을 때만 DB 함수로 읽고 쓸 수 있습니다.
   - ⚠ `service_role` / secret 키는 절대 넣지 마세요.

비밀번호를 바꾸려면 3번 문장을 새 비밀번호로 다시 실행하면 됩니다. 모든 기기가 로그아웃되고 새 비밀번호를 다시 입력해야 합니다.
각 기기에서는 나라 메뉴 → **이 기기에서 나가기**로 비밀번호와 저장된 사본을 지울 수 있습니다.

## Vercel 배포

1. [vercel.com](https://vercel.com)에 GitHub 계정으로 가입하고, Add New → Project → 이 저장소를 Import 합니다.
2. Framework Preset은 **Other**로 둡니다. 빌드 설정은 `vercel.json`에 들어 있어 따로 건드리지 않아도 됩니다.
3. **Environment Variables**에 `GOOGLE_MAPS_API_KEY` = 구글 지도 키를 넣고 Deploy 합니다.
   - 배포할 때 `scripts/vercel-build.js`가 이 값으로 `js/keys.js`를 만듭니다. 키는 GitHub 저장소에 올라가지 않습니다.
   - 키를 나중에 넣거나 바꿨다면 Deployments → 최근 배포 ⋯ → **Redeploy** 해야 반영됩니다.
4. 이후 `main`에 push할 때마다 자동으로 배포됩니다.

`vercel.json`에 서울 리전(`icn1`)을 지정해 두었습니다. 화면 파일은 Vercel의 전 세계 CDN에서 나가고, 데이터는 서울 Supabase와 직접 주고받습니다.
구글 지도 키를 쓴다면 HTTP 리퍼러 제한에 Vercel 주소(`https://<프로젝트>.vercel.app/*`)도 추가하세요.

## 구글 지도 API 키 (선택)

키가 없으면 장소 검색이 꺼지고, 지도는 좌표만 찍는 **간이 지도**로 나옵니다. 나머지 기능은 모두 동작합니다.

1. Google Cloud Console에서 **Maps JavaScript API**, **Places API (New)**, **Routes API**를 사용 설정합니다.
2. API 키를 만들고 **HTTP 리퍼러 제한**을 겁니다. 예: `http://localhost:8765/*`, `https://<프로젝트>.vercel.app/*`
3. 키는 GitHub에 올리지 않습니다.
   - 로컬: `js/keys.js` 파일을 만들고 `export const API_KEY = "AIza...";` 를 적습니다 (`.gitignore`에 들어 있음).
   - Vercel: 환경 변수 `GOOGLE_MAPS_API_KEY` (위 Vercel 배포 3번).
   - `keys.js`가 없는 곳(GitHub Pages 등)에서는 간이 지도로 동작합니다.

> 브라우저에서 쓰는 키는 어차피 사이트 방문자에게 보입니다. 리퍼러 제한은 꼭 걸어 주세요.

## 폴더 구조

```
index.html              뼈대 마크업
css/colors.css          🎨 모든 색 (라이트/다크, 카테고리 색). 색을 바꾸려면 이 파일만 고치면 됨
css/style.css           레이아웃·모양 (색은 colors.css 변수만 사용)
js/
  main.js               시작점 (이벤트 연결, 첫 렌더, 지도 스크립트 로드)
  config.js             Supabase 주소·키, 구글 지도 키 읽기
  keys.js               구글 지도 키 (Git에 안 올림, Vercel에서는 배포 때 생성)
  sync.js               Supabase 연동: 입장 비밀번호, 불러오기, 자동 저장, 충돌 알림
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
  google/               구글 지도, 장소(Places), 이동시간(Routes), 주변 찾기(explore.js)
  events/               클릭, 입력, 드래그(SortableJS)
supabase/schema.sql     DB 테이블, 비밀번호 확인, 읽기/쓰기 함수
vercel.json             Vercel 설정 (서울 리전, 빌드 명령)
scripts/vercel-build.js 배포 때 환경 변수로 js/keys.js 생성
```

## GitHub Pages 배포

저장소의 Settings → Pages에서 Branch를 `main` / `(root)`로 지정하면 `https://<아이디>.github.io/<저장소>/`에서 열립니다.
