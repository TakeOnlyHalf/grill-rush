import { useGame } from '../state/GameContext.jsx'
import { ActionTypes } from '../state/actions.js'
import { getWeatherEmoji, getWeatherLabel } from '../utils/weather.js'

/**
 * 타이틀 화면
 * TODO: 세이브/로드, 설정, 튜토리얼 진입
 */
export default function TitlePhase() {
  const { dispatch } = useGame()

  return (
    <section className="phase phase-title">
      <div className="title-hero">
        <p className="title-eyebrow">Food Truck Tycoon</p>
        <h1 className="title-brand">Grill Rush</h1>
        <p className="title-tagline">
          도시 곳곳을 누비며 최고의 푸드트럭을 만들어라
        </p>
        <div className="title-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => dispatch({ type: ActionTypes.START_GAME })}
          >
            게임 시작
          </button>
        </div>
        <p className="phase-hint">
          흐름: 타이틀 → 준비 → 영업 → 정산 → 성장 → (반복) → 엔딩
        </p>
      </div>
      <p className="weather-sample" aria-hidden>
        {getWeatherEmoji('sunny')} {getWeatherLabel('sunny')}
      </p>
    </section>
  )
}
