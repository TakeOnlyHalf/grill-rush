# Grill Rush — 푸드트럭 타이쿤

도시 곳곳을 누비며 메뉴를 구성하고, 손님을 요리로 사로잡아 최고의 푸드트럭을 만드는 경영 시뮬레이션 게임.

## 기술 스택

- React 18 + Vite
- HTML/CSS + Canvas (미니게임)
- Howler.js (효과음·BGM)
- Storybook 10 (디자인 시스템 / 컴포넌트 카탈로그)
- GitHub Pages (`gh-pages`)

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
| `npm run deploy` | GitHub Pages 배포 |

## 소스 구조

자세한 기획은 `claude.md`를 참고하세요. 핵심 진입점은 `src/App.jsx`, 상태는 `src/state/` 입니다.
