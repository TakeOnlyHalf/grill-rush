import { useCallback, useEffect, useRef } from 'react'
import type { Application } from 'pixi.js'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { PixiStage } from '../pixi'
import {
  createPrepCityScene,
  type PrepCityHandle,
} from '../pixi/scenes/PrepCityScene'

export default function CityMap() {
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
      width={1280}
      height={720}
      background="#4890d0"
      setup={setup}
    />
  )
}
