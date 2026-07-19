import { useEffect } from 'react'
import Hud from '../components/Hud.jsx'
import StreetView from '../components/StreetView.jsx'
import CustomerQueue from '../components/CustomerQueue.jsx'
import CookingMinigame from '../components/CookingMinigame.jsx'
import { useGame } from '../state/GameContext.jsx'
import { ActionTypes, OPEN_DURATION_SEC } from '../state/actions.js'

/**
 * 영업 페이즈 — 핵심 게임플레이 자리
 * TODO: 손님 스폰, patience, 그릴 게이지, 서빙 연동
 */
export default function OpenPhase() {
  const { state, dispatch } = useGame()
  const progress = Math.min(100, (state.time / OPEN_DURATION_SEC) * 100)

  // 베이스: 1초 틱으로 시간만 진행 (실제 로직은 이후 교체)
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

      <StreetView />
      <CustomerQueue />
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
