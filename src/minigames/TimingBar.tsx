import { useCallback, useRef } from 'react'
import type { Application } from 'pixi.js'
import { PixiStage, createTimingBarScene } from '../pixi'
import type { TimingGrade } from '../pixi/scenes/TimingBarScene'

export interface TimingBarProps {
  onResult?: (grade: TimingGrade) => void
}

/** 타이밍 바 미니게임 (PixiJS) */
export default function TimingBar({ onResult }: TimingBarProps) {
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const setup = useCallback((app: Application) => {
    const scene = createTimingBarScene(app, {
      onResult: (grade) => onResultRef.current?.(grade),
    })
    return () => scene.destroy()
  }, [])

  return (
    <div className="minigame-card minigame-card--pixi">
      <PixiStage
        className="timing-pixi"
        height={110}
        background="#221a15"
        setup={setup}
      />
    </div>
  )
}
