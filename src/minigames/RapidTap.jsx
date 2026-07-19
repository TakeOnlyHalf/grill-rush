/**
 * 연타 미니게임 (스텁)
 * TODO: 제한 시간 내 N회 클릭
 */
export default function RapidTap({ onResult }) {
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
