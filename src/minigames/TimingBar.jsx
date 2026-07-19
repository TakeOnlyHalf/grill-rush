/**
 * 타이밍 바 미니게임 (스텁)
 * TODO: 움직이는 게이지 + 클릭으로 Perfect/Good/Fail 판정
 */
export default function TimingBar({ onResult }) {
  return (
    <div className="minigame-card">
      <h4>Timing Bar</h4>
      <div className="timing-track" aria-hidden>
        <div className="timing-zone good" />
        <div className="timing-zone perfect" />
        <div className="timing-cursor" />
      </div>
      <button
        type="button"
        className="btn btn-small"
        onClick={() => onResult?.('good')}
      >
        멈추기 (스텁)
      </button>
    </div>
  )
}
