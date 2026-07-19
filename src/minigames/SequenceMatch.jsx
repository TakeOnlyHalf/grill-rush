/**
 * 순서 맞추기 미니게임 (스텁)
 * TODO: 재료 아이콘을 올바른 순서로 탭
 */
export default function SequenceMatch({ onResult }) {
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
