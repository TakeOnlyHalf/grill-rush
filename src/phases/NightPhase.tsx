import UpgradeShop from '../components/UpgradeShop'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { getWeatherEmoji, getWeatherLabel } from '../utils/weather'
import events from '../data/events.json'

/**
 * 야간 / 성장 페이즈
 * TODO: 메뉴 해금, 트럭 커스터마이징, 이벤트 연출
 */
export default function NightPhase() {
  const { state, dispatch } = useGame()
  const isLastDay = state.day >= state.maxDays
  const tomorrowEvent = events.find((e) => e.day === state.day + 1)

  return (
    <section className="phase phase-night">
      <header className="phase-header">
        <h2>성장 · 야간</h2>
        <p>업그레이드로 트럭을 키우고 내일을 준비하세요.</p>
      </header>

      <div className="night-layout">
        <UpgradeShop />
        <aside className="panel">
          <h3>내일 예고</h3>
          <p>
            {/* 다음 날 weather는 NEXT_DAY 시 롤되므로 힌트만 */}
            Day {Math.min(state.day + 1, state.maxDays)} · 날씨는 아침이 되면
            결정됩니다 {getWeatherEmoji(state.weather)}
          </p>
          {tomorrowEvent ? (
            <p className="event-tease">
              예고 이벤트: {tomorrowEvent.name} — {tomorrowEvent.description}
            </p>
          ) : (
            <p className="muted">예정된 스크립트 이벤트 없음</p>
          )}
          <p className="todo-note">
            TODO: 신메뉴 해금 UI, 트럭 외형, {getWeatherLabel(state.weather)} 연출
          </p>
        </aside>
      </div>

      <footer className="phase-footer">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => dispatch({ type: ActionTypes.NEXT_DAY })}
        >
          {isLastDay ? '엔딩 보기 ▶' : '다음 날로 ▶'}
        </button>
      </footer>
    </section>
  )
}
