import { useEffect } from 'react'
import Hud from '../components/Hud'
import StreetView from '../components/StreetView'
import CustomerQueue from '../components/CustomerQueue'
import CookingMinigame from '../components/CookingMinigame'
import ServeResult from '../components/ServeResult'
import { useGame } from '../state/GameContext'
import { ActionTypes, OPEN_DURATION_SEC } from '../state/actions'

/** 영업 페이즈 — 손님 스폰/대기열/조리/서빙 루프 */
export default function OpenPhase() {
  const { state, dispatch } = useGame()
  const progress = Math.min(100, (state.time / OPEN_DURATION_SEC) * 100)

  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: ActionTypes.TICK_OPEN, payload: { dt: 1 } })
    }, 1000)
    return () => clearInterval(id)
  }, [dispatch])

  return (
    <section className="phase phase-open">
      <Hud variant="open" />
      <header className="phase-header">
        <h2>영업 페이즈</h2>
        <div className="time-bar" role="progressbar" aria-valuenow={progress}>
          <div className="time-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="time-label">
          {Math.floor(state.time)}s / {OPEN_DURATION_SEC}s · 매출{' '}
          {state.dailySales.toLocaleString('ko-KR')}원
        </p>
      </header>

      <ServeResult />

      <div className="street-block">
        <StreetView />
        <CustomerQueue />
      </div>
      <CookingMinigame />

      <footer className="phase-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => dispatch({ type: ActionTypes.END_OPEN })}
        >
          영업 조기 종료 (디버그)
        </button>
      </footer>
    </section>
  )
}
