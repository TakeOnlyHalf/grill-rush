import { colors, dayColors, cookColors, radius, shadow, typography } from '../ui/tokens'
import type { ColorToken } from '../ui/tokens'

function ColorGrid({
  title,
  palette,
  light,
}: {
  title: string
  palette: Record<string, ColorToken>
  light?: boolean
}) {
  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {Object.entries(palette).map(([name, token]) => (
          <div
            key={name}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              background: light ? 'var(--day-frost)' : 'var(--bg-panel)',
              color: 'var(--text)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                height: 64,
                background: token.value,
                borderBottom: '1px solid var(--border)',
              }}
            />
            <div style={{ padding: '0.5rem 0.65rem', fontSize: 13 }}>
              <strong>{name}</strong>
              <div style={{ color: 'var(--muted)', wordBreak: 'break-all' }}>{token.value}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{token.usage}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default {
  title: 'Design System/Tokens',
  parameters: {
    docs: {
      description: {
        component:
          'Grill Rush Cozy Pastel 토큰. Default는 전역 게임 UI, Story는 VN/거리용. CSS `:root`와 동기화됩니다.',
      },
    },
  },
}

export const DefaultColors = {
  name: 'Colors (Default)',
  render: () => (
    <ColorGrid title="Default — Cozy Pastel (전역 UI)" palette={colors} />
  ),
}

export const StoryColors = {
  name: 'Colors (Story)',
  render: () => (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius)',
        background: 'linear-gradient(180deg, var(--day-sky), var(--day-sky-soft))',
      }}
    >
      <ColorGrid title="Story — Outdoor / day_street" palette={dayColors} light />
    </div>
  ),
}

export const CookColors = {
  name: 'Colors (Cook)',
  render: () => <ColorGrid title="Cook states — 조리 상태" palette={cookColors} />,
}

export const Typography = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <h2 style={{ margin: 0 }}>Typography</h2>
      <p style={{ margin: 0, color: 'var(--muted)' }}>UI: {typography.font.value}</p>
      <p style={{ margin: 0, color: 'var(--muted)' }}>
        Title menu: {typography.titleMenu.value}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-title-menu)',
          fontSize: '1.5rem',
          color: 'var(--text)',
          letterSpacing: '0.12em',
        }}
      >
        이어서 하기 · 처음부터 · 옵션
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
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {Object.entries(radius).map(([name, token]) => (
        <div key={name} style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: 'var(--accent)',
              borderRadius: token.value,
              boxShadow: 'var(--shadow-sm)',
            }}
          />
          <strong>{name}</strong>
          <div style={{ color: 'var(--muted)' }}>{token.value}</div>
        </div>
      ))}
    </div>
  ),
}

export const Shadow = {
  render: () => (
    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
      {Object.entries(shadow).map(([name, token]) => (
        <div
          key={name}
          style={{
            width: 120,
            height: 80,
            borderRadius: 'var(--radius)',
            background: 'var(--bg-panel)',
            boxShadow: token.value,
            display: 'grid',
            placeItems: 'center',
            border: '1px solid var(--border)',
          }}
        >
          {name}
        </div>
      ))}
    </div>
  ),
}
