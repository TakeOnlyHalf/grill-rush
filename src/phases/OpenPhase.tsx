import { useEffect } from 'react'
import Hud from '../components/Hud'
import StreetView from '../components/StreetView'
import CustomerQueue from '../components/CustomerQueue'
import CookingMinigame from '../components/CookingMinigame'
import ServeResult from '../components/ServeResult'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'

/** 영업 페이즈 — 손님 스폰/대기열/조리/서빙 루프 */
export default function OpenPhase() {
  const { dispatch } = useGame()

  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: ActionTypes.TICK_OPEN, payload: { dt: 1 } })
    }, 1000)
    return () => clearInterval(id)
  }, [dispatch])

  return (
    <section className="phase phase-open">
      <Hud variant="open" />

      <ServeResult />

      <div className="street-block">
        <StreetView />
        <CustomerQueue />
      </div>
      <CookingMinigame />
    </section>
  )
}
