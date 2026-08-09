<div align="center">

![Images](https://github.com/TakeOnlyHalf/grill-rush/blob/main/public/images/logo.webp)

### *그릴 위의 2초가 모든 걸 결정한다.*

**계란 2초, 베이컨 3초, 스테이크 8초 — 올린 순서와 꺼내는 순서가 다르다.**

![React 18](https://img.shields.io/badge/React-18-61dafb)
![PixiJS 8](https://img.shields.io/badge/PixiJS-8-e72264)
![TypeScript](https://img.shields.io/badge/Lang-TypeScript-3178c6)
![Vite](https://img.shields.io/badge/Build-Vite-646cff)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-222)

<br/>

<sub>20일 동안 낡은 푸드트럭을 최고의 맛집으로 만드는 그릴 경영 시뮬레이션</sub>

[**▶ 지금 플레이**](https://TakeOnlyHalf.github.io/grill-rush/) · 설치 없음 · 브라우저 즉시 실행

`NAN 2026 · NHN Game × AI Hackathon 예선 사전 과제`

</div>

---

## 무슨 게임인가

푸드트럭 게임은 많다. 대부분 버튼을 누르면 요리가 나온다.

**Grill Rush에서 요리는 기다림이다.** 그릴 위에 재료를 올리면 게이지가 차오른다.
70~90% 구간에서 꺼내면 Perfect, 100%를 넘기면 **태워서 재료가 사라진다.**
문제는 재료마다 익는 속도가 다르다는 것이다.

```
🥚 계란 2초    🥓 베이컨 3초    🌽 옥수수 4초    🥩 패티 5초    🍗 치킨 6초    🥩 스테이크 8초
```

계란과 스테이크를 동시에 올리면, 스테이크가 40%일 때 계란은 이미 타기 직전이다.
3슬롯에 서로 다른 재료가 올라가 있고, 손님 3명이 줄 서 있고, 인내심 게이지가 줄어들고 있다.
**머릿속이 콜 스택처럼 쌓인다.**

Day 1은 여유롭다. Day 15에는 6슬롯에 재료가 꽉 차고, 러시아워 이벤트가 터진다.

---

## 왜 점점 재밌어지는가

### 처음엔 노가다다

Day 1~5. 재료 하나하나 직접 올리고, 직접 꺼내고, 직접 서빙한다. 눈과 손이 쉴 틈이 없다.

### 그리고 자동화를 산다

| 업그레이드 | 효과 |
|---|---|
| 🍳 주방 확장 Lv.1~3 | 동시 조리 슬롯 3 → 4 → 5 → 6 |
| 🤖 조리 보조 Lv.1~3 | Perfect 구간 재료를 자동 회수 (9초 → 8초 → 7초 쿨타임) |
| ⏱️ 타이머 알람 | Perfect 구간 진입 시 알림 |
| 🔥 화력 강화 | 전 재료 조리 시간 −20% |

**처음엔 손이 바쁘고, 나중엔 머리가 바쁘다.** 뭘 먼저 사고, 어디서 팔고, 얼마에 팔지 — 그릴 위의 판단이 경영 판단으로 확장된다.

---

## 하루의 구조

```
  준비                    영업 (75초)              정산              성장
  ─────────────────────────────────────────────────────────────────────
  위치 선택               손님 등장                매출·비용 계산     업그레이드 구매
  메뉴 구성 (최대 4개)     재료 → 그릴 → 서빙       리뷰 ★1~5        신메뉴 해금
  재료 매입               인내심 소진 시 이탈       명성 증감          → 다음 날
  가격 설정
```

이 사이클이 **20일** 반복된 뒤, 누적 자금·명성으로 5가지 엔딩이 갈린다.

---

## 핵심 시스템

### 그릴 — 게이지 판정

```
 ░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓█████████████░░░░░
 │     덜 익음      │    Good    │  Perfect!  │위험│태움
 0%               40%          70%          90% 100%
```

100%를 넘기면 재료가 소멸한다. 동시에 여러 재료가 제각기 다른 속도로 차오른다.

### 위치 — 어디서 팔 것인가

| 장소 | 유동인구 | 자릿세 | 주 고객 | 해금 |
|---|:---:|:---:|---|---|
| 🏢 오피스 거리 | 80 | ₩15,000 | 직장인 — 가격 둔감 | 시작 |
| 🎓 대학가 | 90 | ₩10,000 | 학생 — 가격 민감 | 시작 |
| 🌳 공원 앞 | 70 | ₩12,000 | 가족 — 인내심 높음 | Day 5 |
| 🌙 야시장 | 100 | ₩25,000 | 관광객 — 팁 후함 | Day 10 |
| 🎪 축제 광장 | 120 | ₩30,000 | 혼합 — 경쟁 치열 | Day 15 |

### 가격 — 얼마에 팔 것인가

싸게 팔면 리뷰↑ 명성↑ 수익↓. 비싸게 팔면 수익↑ 악평↑ 손님↓.
학생한테 비싸게 받으면 이탈하고, 관광객은 비싸도 팁을 얹는다.
**장소 × 고객층 × 가격이 맞물려야 수익이 난다.**

### 이벤트 — 매일 변수가 생긴다

| Day | 이벤트 | 효과 |
|:---:|---|---|
| 3 | 첫 리뷰어 방문 | 리뷰 평점 ×2 반영 |
| 7 | 거리 축제 | 축제 광장 해금 · 유동인구 ×2 |
| 14 | 러시아워 | 손님 스폰율 ×1.8 폭주 |
| 20 | 푸드트럭 대회 | 최종 이벤트 → 엔딩 분기 |

날씨도 매일 바뀐다. 맑음(×1.0) · 흐림(×0.9) · 비(×0.7) · 눈(×0.6) · 쾌청(×1.2).

---

## 엔딩

| | 조건 | |
|---|---|---|
| 🏆 전설의 트럭 | 명성 80↑ · 자금 ₩500,000↑ | 도시 최고의 푸드트럭으로 등극 |
| 🌟 인기 맛집 | 명성 60↑ · 자금 ₩300,000↑ | 매일 줄 서는 인기 트럭 |
| 😊 동네 단골집 | 명성 40↑ · 자금 ₩100,000↑ | 소소하지만 확실한 맛집 |
| 😰 근근이 생존 | 자금 > 0 | 힘들었지만 포기하지 않았다 |
| 💀 폐업 | 자금 ≤ 0 | …다음엔 잘 될 거야 |

---

## 아키텍처

```
  React 18 (UI 레이어)                    PixiJS 8 (게임 레이어)
  ─────────────────────                   ─────────────────────
  페이즈 라우팅 · HUD                       거리 씬 · 캐릭터 스프라이트
  상점 / 메뉴 / 매입 UI                     그릴 보드 · 게이지 렌더
  GameContext (useReducer)                  판정 연출 · 애니메이션
        │                                        │
        └──────────── 공유 상태 ──────────────────┘
                   src/types/game.ts
```

전투(영업) 중 DOM 리렌더를 최소화하기 위해 **게임플레이 렌더는 PixiJS**, **UI·상태는 React**로 분리했다.

### 외부 에셋

| 자산 | 조달 |
|---|---|
| 캐릭터 스프라이트 · 배경 · 음식 일러스트 · UI | AI 생성 (이미지) |
| 효과음 (SFX) | AI 기반 WAV 합성 (FM · Karplus-Strong · 마스터링) |
| BGM | AI 작곡 |
| 폰트 | 시스템 폰트 스택 |

---

## 기술 스택

| | |
|---|---|
| 프레임워크 | **React 18** + **TypeScript** — 페이즈 라우팅 · 상태 관리 |
| 게임 렌더 | **PixiJS 8** — 거리 씬 · 그릴 미니게임 · 스프라이트 연출 |
| 상태 관리 | `useReducer` + `Context` — 외부 라이브러리 0개 |
| 사운드 | **Howler.js** — 효과음 · BGM 재생 |
| 디자인 시스템 | **Storybook 10** — 컴포넌트 카탈로그 · 토큰 관리 |
| 빌드 | **Vite** — `base: '/grill-rush/'` GitHub Pages 대응 |
| 배포 | **GitHub Actions** → GitHub Pages 자동 배포 |

---

## 실행

```bash
git clone https://github.com/TakeOnlyHalf/grill-rush
cd grill-rush && npm install && npm run dev
```

의존성 설치 후 바로 플레이 가능. API 키 불필요.

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 미리보기 (`/grill-rush/` base) |
| `npm run typecheck` | TypeScript 검사 |
| `npm run storybook` | Storybook (포트 6006) |

---

## 소스 구조

```
src/
├── App.tsx                 # 페이즈 라우팅
├── state/                  # GameContext · gameReducer · formulas
├── phases/                 # Title · Story · Prep · Open · Settle · Night · Ending
├── components/             # HUD · GrillBoard · CustomerQueue · CookingMinigame …
├── pixi/                   # PixiStage · scenes/ · sprites/
├── grill/                  # 그릴 슬롯 로직 · 자동 회수 · 업그레이드 연산
├── minigames/              # TimingBar · SequenceMatch · RapidTap
├── data/                   # menus · locations · upgrades · events · customers (JSON)
├── audio/                  # BGM 컨트롤러 · SFX
├── ui/                     # Button · Panel · tokens · VisualNovel
├── utils/                  # customerSpawner · weather · reviewGenerator · saveGame
└── types/                  # game.ts · story.ts
```

---

<div align="center">

**Team TakeOnlyHalf** · 3인 참가 · 2026

</div>
