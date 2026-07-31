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
  const customers = state.customers.map((c) => ({ id: c.id, type: c.type }))
  const locationLabel = `${loc?.icon ?? ''} ${loc?.name ?? '—'} · 대기 ${customers.length}명`

  const sceneRef = useRef<StreetSceneHandle | null>(null)
  const propsRef = useRef({ customers, locationLabel })
  propsRef.current = { customers, locationLabel }

  // id 순서로 키를 만들어, patience 값만 바뀌는 매초 tick에는 씬을 다시 그리지 않고
  // 손님 구성(추가/이탈/서빙)이 실제로 바뀔 때만 갱신한다.
  const customersKey = customers.map((c) => c.id).join(',')
  useEffect(() => {
    sceneRef.current?.update(propsRef.current)
  }, [customersKey, locationLabel])

  const setup = useCallback((app: Application) => {
    const scene = createStreetScene(app, propsRef.current)
    sceneRef.current = scene
    return () => {
      scene.destroy()
      sceneRef.current = null
    }
  }, [])

  return (
    <div className="street-view">
      <div className="street-frame">
        <PixiStage className="street-pixi" fillParent setup={setup} />
      </div>
    </div>
  )
}
