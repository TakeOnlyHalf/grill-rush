/**
 * Grill Rush 디자인 토큰
 * CSS 변수는 src/styles/game.css 의 :root 와 동기화할 것
 */
export const colors = {
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
}

export const radius = {
  default: { value: '10px', css: 'var(--radius)' },
}

export const typography = {
  font: {
    value: "'Segoe UI', 'Malgun Gothic', sans-serif",
    css: 'var(--font)',
  },
}
