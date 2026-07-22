import { useCallback, useEffect, useRef } from 'react'
import type { Application } from 'pixi.js'
import { useGameState } from '../state/GameContext'
import { getLocationById } from '../state/formulas'
import { PixiStage, createStreetScene } from '../pixi'
import type { StreetSceneHandle } from '../pixi/scenes/StreetScene'

/** 거리 뷰 (트럭+손님) — PixiJS 씬 */
export default function StreetView() {
  const state = useGameState()
  const loc = getLocationById(state.location)
  const customerCount = state.customers.length
  const locationLabel = `${loc?.icon ?? ''} ${loc?.name ?? '—'} · 대기 ${customerCount}명`

  const sceneRef = useRef<StreetSceneHandle | null>(null)
  const propsRef = useRef({ customerCount, locationLabel })
  propsRef.current = { customerCount, locationLabel }

  useEffect(() => {
    sceneRef.current?.update(propsRef.current)
  }, [customerCount, locationLabel])

  const setup = useCallback((app: Application) => {
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
      <p className="todo-note">TODO: 날씨 · 트럭 업그레이드 비주얼</p>
    </div>
  )
}
