import locations from '../data/locations.json'
import { useGame } from '../state/GameContext'
import { estimateCustomers } from '../state/formulas'

/** 참고 UI와 동일한 표시 순서 */
const DISPLAY_ORDER = ['park', 'office', 'festival', 'campus', 'night_market'] as const

interface LocationSelectStripProps {
  selectedId: string | null
  onSelect: (locationId: string) => void
}

export default function LocationSelectStrip({
  selectedId,
  onSelect,
}: LocationSelectStripProps) {
  const { state } = useGame()

  const ordered = DISPLAY_ORDER.map((id) => locations.find((l) => l.id === id)!).filter(
    Boolean,
  )

  return (
    <div className="loc-strip" role="listbox" aria-label="영업 장소">
      {ordered.map((loc) => {
        const unlocked = state.unlockedLocations.includes(loc.id)
        const selected = selectedId === loc.id
        const estimated = estimateCustomers(loc.id, state.weather, state.fame)

        return (
          <button
            key={loc.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-disabled={!unlocked}
            disabled={!unlocked}
            className={[
              'loc-card',
              selected ? 'is-selected' : '',
              !unlocked ? 'is-locked' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => unlocked && onSelect(loc.id)}
          >
            <span className="loc-card-crest" aria-hidden>
              {selected ? '👑' : unlocked ? loc.icon : '🔒'}
            </span>

            <span className="loc-card-thumb" aria-hidden>
              <span className="loc-card-thumb-emoji">{loc.icon}</span>
            </span>

            <span className="loc-card-name">{loc.name}</span>

            {unlocked ? (
              <span className="loc-card-meta">
                <small>피크 {loc.peakHours}</small>
                <small>예상 {estimated}명</small>
              </span>
            ) : (
              <span className="loc-card-lock">Day {loc.unlockDay} 해금</span>
            )}

            {selected && <span className="loc-card-glow" aria-hidden />}
          </button>
        )
      })}
    </div>
  )
}
