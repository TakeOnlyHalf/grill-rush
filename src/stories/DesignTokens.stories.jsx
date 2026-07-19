import { colors, radius, typography } from '../ui/tokens.js'

export default {
  title: 'Design System/Tokens',
  parameters: {
    docs: {
      description: {
        component:
          'Grill Rush 디자인 토큰. CSS 변수는 `src/styles/game.css`의 `:root`와 맞춥니다.',
      },
    },
  },
}

export const Colors = {
  render: () => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <h2 style={{ margin: 0 }}>Colors</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {Object.entries(colors).map(([name, token]) => (
          <div
            key={name}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              background: 'var(--bg-panel)',
            }}
          >
            <div style={{ height: 64, background: token.value }} />
            <div style={{ padding: '0.5rem 0.65rem', fontSize: 13 }}>
              <strong>{name}</strong>
              <div style={{ color: 'var(--muted)' }}>{token.value}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{token.usage}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
}

export const Typography = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <h2 style={{ margin: 0 }}>Typography</h2>
      <p style={{ margin: 0, color: 'var(--muted)' }}>font: {typography.font.value}</p>
      <p className="title-brand" style={{ margin: 0, fontSize: '2.5rem' }}>
        Grill Rush
      </p>
      <h2 style={{ margin: 0 }}>준비 페이즈</h2>
      <p style={{ margin: 0 }}>본문 텍스트 — 손님을 요리로 사로잡아라.</p>
      <p className="muted" style={{ margin: 0 }}>
        보조 텍스트 / TODO 힌트
      </p>
    </div>
  ),
}

export const Radius = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
      <div
        style={{
          width: 80,
          height: 80,
          background: 'var(--accent)',
          borderRadius: radius.default.value,
        }}
      />
      <div>
        <strong>default</strong>
        <div style={{ color: 'var(--muted)' }}>{radius.default.value}</div>
      </div>
    </div>
  ),
}
