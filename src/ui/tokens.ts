/**
 * Grill Rush 디자인 토큰
 * CSS 변수는 src/styles/game.css 의 :root 와 동기화할 것
 */

export type ColorToken = {
  value: string
  css: string
  usage: string
}

/** 기본(그릴/타이틀) 팔레트 — 웜 우드·앰버 */
export const colors: Record<string, ColorToken> = {
  bg: { value: '#1a1410', css: 'var(--bg)', usage: '앱 배경' },
  bgPanel: { value: '#2a211c', css: 'var(--bg-panel)', usage: '패널' },
  bgPanel2: { value: '#342820', css: 'var(--bg-panel-2)', usage: 'HUD / 강조 패널' },
  text: { value: '#f3e8d8', css: 'var(--text)', usage: '본문' },
  muted: { value: '#a89078', css: 'var(--muted)', usage: '보조 텍스트' },
  accent: { value: '#e85d04', css: 'var(--accent)', usage: '강조 (주)' },
  accent2: { value: '#f48c06', css: 'var(--accent-2)', usage: '강조 (부) / 버튼' },
  ok: { value: '#2a9d8f', css: 'var(--ok)', usage: '성공 / Perfect' },
  border: { value: '#4a3b30', css: 'var(--border)', usage: '테두리' },
  danger: { value: '#c1121f', css: 'var(--danger)', usage: '위험 / 태움' },
  woodDeep: { value: '#2a1a10', css: 'var(--wood-deep)', usage: '타이틀 나무 간판' },
  woodMid: { value: '#4a3220', css: 'var(--wood-mid)', usage: '나무 결 하이라이트' },
  cream: { value: '#f4e6c8', css: 'var(--cream)', usage: '간판·로고 크림 글씨' },
  lantern: { value: '#e8a54b', css: 'var(--lantern)', usage: '랜턴 앰버 글로우' },
  chalk: { value: '#1e2420', css: 'var(--chalk)', usage: '칠판 배경' },
}

/**
 * Default(Day) 팔레트 — Story / Prep / day_street 톤
 * Design System/Story·Prep 와 `.phase-story`, `.phase-prep`에서 사용
 */
export const dayColors: Record<string, ColorToken> = {
  sky: { value: '#78c1f3', css: 'var(--day-sky)', usage: '하늘·스테이지 폴백' },
  skySoft: { value: '#c5dde8', css: 'var(--day-sky-soft)', usage: '밝은 하늘·그라데이션' },
  ocean: { value: '#4a90c8', css: 'var(--day-ocean)', usage: '바다·깊은 블루' },
  seafoam: { value: '#5bb0b0', css: 'var(--day-seafoam)', usage: '트럭 틸·강조' },
  seafoamDeep: { value: '#4a9e9e', css: 'var(--day-seafoam-deep)', usage: '틸 그라데이션 하단' },
  ink: { value: '#2c3a4a', css: 'var(--day-ink)', usage: '본문·자막 글씨' },
  muted: { value: 'rgba(44, 58, 74, 0.55)', css: 'var(--day-muted)', usage: '보조 텍스트' },
  panel: { value: 'rgba(255, 255, 255, 0.82)', css: 'var(--day-panel)', usage: '대사창 패널' },
  panelEdge: { value: 'rgba(91, 176, 176, 0.55)', css: 'var(--day-panel-edge)', usage: '대사창 테두리' },
  frost: { value: '#f9f9f9', css: 'var(--day-frost)', usage: '프로스티 화이트' },
  cobble: { value: '#d1d5db', css: 'var(--day-cobble)', usage: '돌바닥·뉴트럴' },
  leaf: { value: '#3d8b5a', css: 'var(--day-leaf)', usage: '나뭇잎 그린' },
  roof: { value: '#c45c3e', css: 'var(--day-roof)', usage: '지붕 테라코타' },
}

export const radius = {
  default: { value: '10px', css: 'var(--radius)' },
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
