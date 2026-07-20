import TimingBar from '../minigames/TimingBar'
import SequenceMatch from '../minigames/SequenceMatch'
import RapidTap from '../minigames/RapidTap'

/**
 * 조리 미니게임 컨테이너
 * TODO: 주문에 따라 타입 선택, 그릴 슬롯 게이지 시스템으로 교체 가능
 */
export default function CookingMinigame() {
  return (
    <div className="panel cooking-area">
      <h3>조리 미니게임</h3>
      <p className="muted">MVP: TimingBar (PixiJS) · 확장: Sequence / RapidTap</p>
      <div className="minigame-slots">
        <TimingBar />
        <SequenceMatch />
        <RapidTap />
      </div>
      <p className="todo-note">
        TODO: 그릴 게이지(0~100% 구간) 기반 멀티슬롯 조리로 확장
      </p>
    </div>
  )
}
