import { useCallback, useEffect, useRef } from 'react'
import { useGameState } from '../state/GameContext.jsx'
import { getLocationById } from '../state/formulas.js'
import { PixiStage, createStreetScene } from '../pixi/index.js'

/** 거리 뷰 (트럭+손님) — PixiJS 씬 */
export default function StreetView() {
  const state = useGameState()
  const loc = getLocationById(state.location)
  const customerCount = state.customers.length
  const locationLabel = `${loc?.icon ?? ''} ${loc?.name ?? '—'} · 대기 ${customerCount}명`

  const sceneRef = useRef(null)
  const propsRef = useRef({ customerCount, locationLabel })
  propsRef.current = { customerCount, locationLabel }

  useEffect(() => {
    sceneRef.current?.update(propsRef.current)
  }, [customerCount, locationLabel])

  const setup = useCallback((app) => {
    const scene = createStreetScene(app, propsRef.current)
    sceneRef.current = scene
    return () => {
      scene.destroy()
      sceneRef.current = null
    }
  }, [])

  return (
    <div className="street-view panel">
      <PixiStage
        className="street-pixi"
        height={160}
        background="#2a211c"
        setup={setup}
      />
      <p className="todo-note">
        TODO: 손님 스프라이트 · 날씨 · 트럭 업그레이드 비주얼
      </p>
    </div>
  )
}
