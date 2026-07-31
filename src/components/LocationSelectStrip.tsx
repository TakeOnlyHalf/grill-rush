import type { CSSProperties } from 'react'
import locations from '../data/locations.json'
import { useGame } from '../state/GameContext'
import { estimateCustomers } from '../state/formulas'
import type { LocationAnchors } from '../pixi/scenes/PrepLocationScene'

/** 참고 UI와 동일한 표시 순서 */
const DISPLAY_ORDER = ['park', 'office', 'festival', 'campus', 'night_market'] as const

interface LocationSelectStripProps {
  selectedId: string | null
  onSelect: (locationId: string) => void
  anchors?: LocationAnchors | null
}

export default function LocationSelectStrip({
  selectedId,
  onSelect,
  anchors = null,
}: LocationSelectStripProps) {
  const { state } = useGame()

  const ordered = DISPLAY_ORDER.map((id) => locations.find((l) => l.id === id)!).filter(
    Boolean,
  )

  const ready = Boolean(anchors && DISPLAY_ORDER.every((id) => anchors[id]))

  return (
    <div
      className={`loc-strip${ready ? ' is-ready' : ''}`}
      role="listbox"
      aria-label="영업 장소"
      aria-hidden={!ready}
    >
      {ordered.map((loc, index) => {
        const unlocked = state.unlockedLocations.includes(loc.id)
        const selected = selectedId === loc.id
        const estimated = estimateCustomers(loc.id, state.weather, state.fame)
        const anchor = anchors?.[loc.id]
        if (!anchor) return null

        return (
          <button
            key={loc.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-disabled={!unlocked}
            aria-expanded={selected}
            disabled={!unlocked || !ready}
            tabIndex={ready ? undefined : -1}
            className={[
              'loc-card',
              selected ? 'is-selected' : '',
              !unlocked ? 'is-locked' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={
              {
                '--loc-x': `${anchor.xPct}%`,
                '--loc-y': `${anchor.yPct}%`,
                '--float-delay': `${0.35 + index * 0.12}s`,
              } as CSSProperties
            }
            onClick={() => unlocked && ready && onSelect(loc.id)}
          >
            <span className="loc-card-crest" aria-hidden>
              {selected ? '👑' : unlocked ? loc.icon : '🔒'}
            </span>

            <span className="loc-card-thumb" aria-hidden>
              <span className="loc-card-thumb-emoji">{loc.icon}</span>
            </span>

            <span className="loc-card-name">{loc.name}</span>

            {!unlocked && (
              <span className="loc-card-lock">Day {loc.unlockDay} 해금</span>
            )}

            {unlocked && (
              <span className="loc-card-details">
                <span className="loc-card-details-inner">
                  <span className="loc-card-desc">{loc.description}</span>
                  <span className="loc-card-stats">
                    <span>피크 {loc.peakHours}</span>
                    <span>예상 {estimated}명</span>
                    <span>자릿세 ₩{loc.rentCost.toLocaleString('ko-KR')}</span>
                    <span>경쟁 노점 {loc.competition}곳</span>
                  </span>
                </span>
              </span>
            )}

            <span className="loc-card-stem" aria-hidden />
            {selected && <span className="loc-card-glow" aria-hidden />}
          </button>
        )
      })}
    </div>
  )
}
