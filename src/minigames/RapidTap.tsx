export interface RapidTapProps {
  onResult?: (grade: string) => void
}

/** 연타 미니게임 (스텁) */
export default function RapidTap({ onResult }: RapidTapProps) {
  return (
    <div className="minigame-card">
      <h4>Rapid Tap</h4>
      <p className="muted">연타 굽기 — 미구현</p>
      <button
        type="button"
        className="btn btn-small"
        onClick={() => onResult?.('normal')}
      >
        스킵 (스텁)
      </button>
    </div>
  )
}
