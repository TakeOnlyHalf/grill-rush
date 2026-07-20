import { useCallback, useRef } from 'react'
import { PixiStage, createTimingBarScene } from '../pixi/index.js'

/**
 * 타이밍 바 미니게임 (PixiJS)
 * 움직이는 게이지 + 클릭/Space로 Perfect/Good/Fail 판정
 */
export default function TimingBar({ onResult }) {
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const setup = useCallback((app) => {
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
