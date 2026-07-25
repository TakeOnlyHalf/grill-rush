import { useEffect, useState, type ReactNode } from 'react'
import { GAME_DESIGN_H, GAME_DESIGN_W } from '../config/viewport'

function fitScale() {
  if (typeof window === 'undefined') return 1
  return Math.min(1, window.innerWidth / GAME_DESIGN_W, window.innerHeight / GAME_DESIGN_H)
}

/**
 * Locks the game to a fixed design resolution.
 * Scale never exceeds 1 (no upscaling on large monitors);
 * shrinks uniformly when the window is smaller.
 */
export default function GameViewport({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(fitScale)

  useEffect(() => {
    const update = () => setScale(fitScale())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className="game-viewport-host">
      <div
        className="game-viewport-frame"
        style={{
          width: GAME_DESIGN_W * scale,
          height: GAME_DESIGN_H * scale,
        }}
      >
        <div
          className="game-viewport"
          style={{
            width: GAME_DESIGN_W,
            height: GAME_DESIGN_H,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
