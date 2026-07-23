import { useCallback, useEffect, useRef } from 'react'
import type { Application } from 'pixi.js'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { PixiStage } from '../pixi'
import {
  createPrepCityScene,
  type PrepCityHandle,
} from '../pixi/scenes/PrepCityScene'

interface CityMapProps {
  /** 맵에서 장소를 직접 골랐을 때 */
  onLocationPick?: (locationId: string) => void
}

export default function CityMap({ onLocationPick }: CityMapProps) {
  const { state, dispatch } = useGame()

  const sceneRef = useRef<PrepCityHandle | null>(null)
  const stateRef = useRef({
    selectedLocation: state.location,
    unlockedLocations: state.unlockedLocations,
    day: state.day,
  })
  stateRef.current = {
    selectedLocation: state.location,
    unlockedLocations: state.unlockedLocations,
    day: state.day,
  }

  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch
  const onPickRef = useRef(onLocationPick)
  onPickRef.current = onLocationPick

  useEffect(() => {
    sceneRef.current?.update(stateRef.current)
  }, [state.location, state.unlockedLocations, state.day])

  const setup = useCallback((app: Application) => {
    const scene = createPrepCityScene(
      app,
      stateRef.current,
      (locationId: string) => {
        dispatchRef.current({
          type: ActionTypes.SET_LOCATION,
          payload: locationId,
        })
        onPickRef.current?.(locationId)
      },
    )
    sceneRef.current = scene
    return () => {
      scene.destroy()
      sceneRef.current = null
    }
  }, [])

  return (
    <PixiStage
      className="prep-city-bg"
      fillParent
      background="#4890d0"
      setup={setup}
    />
  )
}
