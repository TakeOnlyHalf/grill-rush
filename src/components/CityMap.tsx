import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type TransitionEvent,
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
  onSceneReady?: () => void
  /** 캔버스 페이드인이 끝난 뒤 (포스터 제거 타이밍) */
  onRevealSettled?: () => void
  /** 씬 준비 전 캔버스를 숨겨 포스터 위에 자연스럽게 덮어씀 */
  reveal?: boolean
}

const CityMap = forwardRef<CityMapHandle, CityMapProps>(
  function CityMap(
    {
      onLocationPick,
      onAnchorsChange,
      onSceneReady,
      onRevealSettled,
      reveal = true,
    },
    ref,
  ) {
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
    const onReadyRef = useRef(onSceneReady)
    onReadyRef.current = onSceneReady
    const onSettledRef = useRef(onRevealSettled)
    onSettledRef.current = onRevealSettled

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
        () => onReadyRef.current?.(),
      )
      sceneRef.current = scene
      return () => {
        scene.destroy()
        sceneRef.current = null
      }
    }, [])

    const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== 'opacity') return
      if (!reveal) return
      if (event.target !== event.currentTarget) return
      onSettledRef.current?.()
    }

    return (
      <PixiStage
        className={`prep-city-bg${reveal ? ' is-revealed' : ''}`}
        fillParent
        background="transparent"
        setup={setup}
        onTransitionEnd={handleTransitionEnd}
      />
    )
  },
)

export default CityMap
