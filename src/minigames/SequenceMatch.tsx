export interface SequenceMatchProps {
  onResult?: (grade: string) => void
}

/** 순서 맞추기 미니게임 (스텁) */
export default function SequenceMatch({ onResult }: SequenceMatchProps) {
  return (
    <div className="minigame-card">
      <h4>Sequence</h4>
      <p className="muted">재료 순서 탭 — 미구현</p>
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
