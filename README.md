# Grill Rush — 푸드트럭 타이쿤

도시 곳곳을 누비며 메뉴를 구성하고, 손님을 요리로 사로잡아 최고의 푸드트럭을 만드는 경영 시뮬레이션 게임.

## 기술 스택

- React 18 + Vite — UI·페이즈 라우팅·게임 상태
- **PixiJS 8** — 거리 뷰·미니게임·스프라이트/연출 등 게임플레이 렌더
- Howler.js (효과음·BGM)
- Storybook 10 (디자인 시스템 / 컴포넌트 카탈로그)
- GitHub Pages (`gh-pages`)

## 렌더 역할 분담

전반적인 게임 비주얼·인터랙션은 **PixiJS**로 구성합니다.

| 레이어 | 담당 | 위치 |
| --- | --- | --- |
| React | 페이즈 화면, HUD, 상점/메뉴 UI, `GameContext` 상태 | `src/phases/`, `src/components/`, `src/state/` |
| PixiJS | 거리 씬, 조리 미니게임, 애니메이션·판정 연출 | `src/pixi/` |

- 공통 마운트: `src/pixi/PixiStage.jsx` (`Application` 생명주기)
- 씬 팩토리: `src/pixi/scenes/*` (`createStreetScene`, `createTimingBarScene` …)
- 새 연출/미니게임은 HTML Canvas를 직접 쓰지 말고 Pixi 씬으로 추가하세요.

## 게임 흐름 (베이스)

```
타이틀 → 준비 → 영업 → 정산 → 성장(야간) → … → 엔딩
```

페이즈는 `state.phase`로 라우팅됩니다. 각 화면의 `TODO` 주석이 이후 구현 포인트입니다.

## 시작하기

```bash
npm install
npm run dev
```

## GitHub Pages

배포 URL: https://TakeOnlyHalf.github.io/grill-rush/

`main`에 push하면 GitHub Actions가 자동으로 빌드·배포합니다.

1. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정
2. `main`에 머지/푸시 (또는 Actions에서 `Deploy to GitHub Pages` 수동 실행)

로컬에서 배포 결과만 확인하려면:

```bash
npm run build
npm run preview
```

`preview`는 빌드된 `/grill-rush/` base로 서빙됩니다.

## Storybook (디자인 통일)

```bash
npm run storybook
```

- **Design System** — 컬러/타이포 토큰, `Button`, `Panel`
- **Game** — HUD, LocationPicker 등 실제 게임 컴포넌트
- 공통 스타일: `src/styles/game.css` (preview에서 전역 로드)
- 토큰 소스: `src/ui/tokens.js` ↔ CSS `:root` 변수 동기화

새 UI는 `src/ui/` 공통 컴포넌트를 우선 사용하고, 스토리를 함께 추가하세요.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 미리보기 |
| `npm run storybook` | Storybook (포트 6006) |
| `npm run build-storybook` | Storybook 정적 빌드 |
| `npm run deploy` | GitHub Pages 수동 배포 (`gh-pages`, 보통 Actions 사용) |

## 소스 구조

핵심 진입점은 `src/App.jsx`, 상태는 `src/state/`, Pixi 게임 레이어는 `src/pixi/` 입니다.
