/**
 * Grill Rush 디자인 토큰 — Cozy Pastel
 * CSS 변수는 src/styles/game.css 의 :root 와 동기화할 것
 */

export type ColorToken = {
  value: string
  css: string
  usage: string
}

/**
 * Default 팔레트 — 전역 게임 UI (Prep / Open / Settle / Night / 공통 컴포넌트)
 * 따뜻한 파스텔: 살구·코랄·크림·민트
 */
export const colors: Record<string, ColorToken> = {
  bg: { value: '#f6ebe0', css: 'var(--bg)', usage: '앱 배경' },
  bgPanel: { value: '#fff7ee', css: 'var(--bg-panel)', usage: '패널·카드 표면' },
  bgPanel2: { value: '#ffe8d4', css: 'var(--bg-panel-2)', usage: 'HUD·강조 표면' },
  text: { value: '#4a3728', css: 'var(--text)', usage: '본문' },
  muted: { value: '#8b735f', css: 'var(--muted)', usage: '보조 텍스트' },
  accent: { value: '#ef8a5a', css: 'var(--accent)', usage: '메인 코랄·선택' },
  accent2: { value: '#f4b06a', css: 'var(--accent-2)', usage: '살구·호버·보조 강조' },
  secondary: { value: '#8ecfbb', css: 'var(--secondary)', usage: '민트·세이지' },
  gold: { value: '#e6c35c', css: 'var(--gold)', usage: '돈·보상' },
  ok: { value: '#6fbf9a', css: 'var(--ok)', usage: '성공·조리 완료' },
  warning: { value: '#f0a060', css: 'var(--warning)', usage: '경고·타기 직전' },
  border: { value: '#e5d0bc', css: 'var(--border)', usage: '테두리' },
  danger: { value: '#d98484', css: 'var(--danger)', usage: '실패·탄 상태' },
  info: { value: '#9bc4e2', css: 'var(--info)', usage: '정보·파스텔 블루' },
  berry: { value: '#e8a0ad', css: 'var(--berry)', usage: '딸기 핑크 강조' },
  disabled: { value: '#d9cfc4', css: 'var(--disabled)', usage: '비활성' },
  cream: { value: '#fff4e6', css: 'var(--cream)', usage: '크림·아이보리' },
  lantern: { value: '#f0bc6a', css: 'var(--lantern)', usage: '따뜻한 앰버 글로우' },
  woodDeep: { value: '#c4956a', css: 'var(--wood-deep)', usage: '밝은 우드 딥' },
  woodMid: { value: '#dfb58a', css: 'var(--wood-mid)', usage: '밝은 우드 미드' },
  chalk: { value: '#efe6dc', css: 'var(--chalk)', usage: '따뜻한 베이지 표면' },
}

/**
 * Story / outdoor 팔레트 — Visual Novel·낮 거리 (같은 파스텔 계열, 하늘 기운)
 */
export const dayColors: Record<string, ColorToken> = {
  sky: { value: '#a8d4f0', css: 'var(--day-sky)', usage: '하늘' },
  skySoft: { value: '#d4eaf5', css: 'var(--day-sky-soft)', usage: '밝은 하늘' },
  ocean: { value: '#7eb3d9', css: 'var(--day-ocean)', usage: '바다·깊은 블루' },
  seafoam: { value: '#8ecfbb', css: 'var(--day-seafoam)', usage: '민트 틸' },
  seafoamDeep: { value: '#6fb8a6', css: 'var(--day-seafoam-deep)', usage: '틸 딥' },
  ink: { value: '#4a3728', css: 'var(--day-ink)', usage: '본문 (Default text와 동일)' },
  muted: { value: 'rgba(74, 55, 40, 0.55)', css: 'var(--day-muted)', usage: '보조 텍스트' },
  panel: { value: 'rgba(255, 247, 238, 0.9)', css: 'var(--day-panel)', usage: '대사창 패널' },
  panelEdge: { value: 'rgba(239, 138, 90, 0.35)', css: 'var(--day-panel-edge)', usage: '패널 테두리' },
  frost: { value: '#fff7ee', css: 'var(--day-frost)', usage: '밝은 크림 표면' },
  cobble: { value: '#e0d4c8', css: 'var(--day-cobble)', usage: '뉴트럴 베이지' },
  leaf: { value: '#6fbf9a', css: 'var(--day-leaf)', usage: '세이지·성공' },
  roof: { value: '#e08a70', css: 'var(--day-roof)', usage: '테라코타·코랄' },
}

/** 조리 상태 색 — Open 미니게임 등 */
export const cookColors: Record<string, ColorToken> = {
  idle: { value: '#e8ddd0', css: 'var(--cook-idle)', usage: '대기·조리 전' },
  cooking: { value: '#f4b06a', css: 'var(--cook-cooking)', usage: '조리 중' },
  done: { value: '#6fbf9a', css: 'var(--cook-done)', usage: '조리 완료' },
  warning: { value: '#ef8a5a', css: 'var(--cook-warning)', usage: '타기 직전' },
  burnt: { value: '#b88878', css: 'var(--cook-burnt)', usage: '탄·실패' },
}

export const radius = {
  small: { value: '8px', css: 'var(--radius-sm)' },
  default: { value: '12px', css: 'var(--radius)' },
  large: { value: '16px', css: 'var(--radius-lg)' },
  pill: { value: '999px', css: 'var(--radius-pill)' },
}

export const shadow = {
  small: {
    value: '0 2px 6px rgba(74, 55, 40, 0.08)',
    css: 'var(--shadow-sm)',
  },
  medium: {
    value: '0 6px 18px rgba(74, 55, 40, 0.1)',
    css: 'var(--shadow-md)',
  },
}

export const motion = {
  fast: { value: '140ms', css: 'var(--motion-fast)' },
  normal: { value: '200ms', css: 'var(--motion-normal)' },
}

export const typography = {
  font: {
    value: "'Segoe UI', 'Malgun Gothic', sans-serif",
    css: 'var(--font)',
  },
  titleMenu: {
    value: "'Gowun Batang', 'Malgun Gothic', serif",
    css: 'var(--font-title-menu)',
  },
}
