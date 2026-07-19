# Grill Rush — 푸드트럭 타이쿤

도시 곳곳을 누비며 메뉴를 구성하고, 손님을 요리로 사로잡아 최고의 푸드트럭을 만드는 경영 시뮬레이션 게임.

## 기술 스택

- React 18 + Vite
- HTML/CSS + Canvas (미니게임)
- Howler.js (효과음·BGM)
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

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 미리보기 |
| `npm run deploy` | GitHub Pages 배포 |

## 소스 구조

자세한 기획은 `claude.md`를 참고하세요. 핵심 진입점은 `src/App.jsx`, 상태는 `src/state/` 입니다.
