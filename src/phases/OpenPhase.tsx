import { useEffect, useState } from 'react'
import Hud from '../components/Hud'
import StreetView from '../components/StreetView'
import CustomerQueue from '../components/CustomerQueue'
import CookingMinigame from '../components/CookingMinigame'
import ServeResult from '../components/ServeResult'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { OPEN_COOKING_FRAME_ART } from '../utils/assets'

/** 영업 페이즈 — 손님 스폰/대기열/조리/서빙 루프 */
export default function OpenPhase() {
  const { dispatch } = useGame()
  // 디버그 전용 — 시간 정지 상태에서 UI를 편하게 살펴보기 위한 토글 (플레이 밸런스에는 영향 없음)
  const [debugPaused, setDebugPaused] = useState(false)

  useEffect(() => {
    if (debugPaused) return undefined
    const id = setInterval(() => {
      dispatch({ type: ActionTypes.TICK_OPEN, payload: { dt: 1 } })
    }, 1000)
    return () => clearInterval(id)
  }, [dispatch, debugPaused])

  return (
    <section className="phase phase-open">
      <Hud variant="open" />

      <ServeResult />

      <div
        className="open-frame"
        style={{ backgroundImage: `url(${OPEN_COOKING_FRAME_ART})` }}
      >
        <StreetView />
        <CustomerQueue />
        <CookingMinigame />
      </div>

      <button
        type="button"
        className={`debug-pause-btn${debugPaused ? ' is-paused' : ''}`}
        onClick={() => setDebugPaused((paused) => !paused)}
      >
        {debugPaused ? '▶ 재생 (디버그)' : '⏸ 시간 정지 (디버그)'}
      </button>
    </section>
  )
}
