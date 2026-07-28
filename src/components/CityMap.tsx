import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import type { Application } from 'pixi.js'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { PixiStage } from '../pixi'
import {
  createPrepLocationScene,
  type LocationAnchors,
  type PrepLocationHandle,
} from '../pixi/scenes/PrepLocationScene'

export interface CityMapHandle {
  pickLocation: (locationId: string) => void
}

interface CityMapProps {
  onLocationPick?: (locationId: string) => void
  onAnchorsChange?: (anchors: LocationAnchors) => void
}

const CityMap = forwardRef<CityMapHandle, CityMapProps>(
  function CityMap({ onLocationPick, onAnchorsChange }, ref) {
    const { state, dispatch } = useGame()

    const sceneRef = useRef<PrepLocationHandle | null>(null)
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
    const onAnchorsRef = useRef(onAnchorsChange)
    onAnchorsRef.current = onAnchorsChange

    useImperativeHandle(ref, () => ({
      pickLocation(locationId: string) {
        sceneRef.current?.pickLocation(locationId)
        dispatchRef.current({
          type: ActionTypes.SET_LOCATION,
          payload: locationId,
        })
        onPickRef.current?.(locationId)
      },
    }))

    useEffect(() => {
      sceneRef.current?.update(stateRef.current)
    }, [state.location, state.unlockedLocations, state.day])

    const setup = useCallback((app: Application) => {
      const scene = createPrepLocationScene(
        app,
        stateRef.current,
        (locationId: string) => {
          dispatchRef.current({
            type: ActionTypes.SET_LOCATION,
            payload: locationId,
          })
          onPickRef.current?.(locationId)
        },
        (anchors) => onAnchorsRef.current?.(anchors),
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
        background="#7eb8e8"
        setup={setup}
      />
    )
  },
)

export default CityMap
