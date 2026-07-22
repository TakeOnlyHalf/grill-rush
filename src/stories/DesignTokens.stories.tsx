import { colors, dayColors, radius, typography } from '../ui/tokens'
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
              border: light
                ? '1px solid var(--day-panel-edge)'
                : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              background: light ? 'var(--day-frost)' : 'var(--bg-panel)',
              color: light ? 'var(--day-ink)' : 'var(--text)',
            }}
          >
            <div
              style={{
                height: 64,
                background: token.value,
                borderBottom: light
                  ? '1px solid rgba(91, 176, 176, 0.25)'
                  : undefined,
              }}
            />
            <div style={{ padding: '0.5rem 0.65rem', fontSize: 13 }}>
              <strong>{name}</strong>
              <div
                style={{
                  color: light ? 'var(--day-muted)' : 'var(--muted)',
                  wordBreak: 'break-all',
                }}
              >
                {token.value}
              </div>
              <div
                style={{
                  color: light ? 'var(--day-muted)' : 'var(--muted)',
                  fontSize: 12,
                }}
              >
                {token.usage}
              </div>
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
          'Grill Rush 디자인 토큰. Default(낮/Story)와 Night(그릴/타이틀) 팔레트를 분리합니다. CSS는 `game.css` `:root`와 동기화.',
      },
    },
  },
}

export const DefaultColors = {
  name: 'Colors (Default)',
  render: () => (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius)',
        background: 'linear-gradient(180deg, var(--day-sky), var(--day-sky-soft))',
      }}
    >
      <ColorGrid title="Default — Story / day_street" palette={dayColors} light />
    </div>
  ),
}

export const NightColors = {
  name: 'Colors (Night)',
  render: () => <ColorGrid title="Night — Grill / Title" palette={colors} />,
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
          color: 'var(--cream)',
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
