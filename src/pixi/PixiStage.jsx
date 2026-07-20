import { useEffect, useRef } from 'react'
import { Application } from 'pixi.js'

/**
 * init() 완료 전에 destroy하면 ResizePlugin이 _cancelResize 미할당 상태로 크래시한다.
 * renderer 존재 = init 완료 / destroy 미호출.
 */
function destroyApp(app) {
  if (!app?.renderer) return
  app.destroy({ removeView: true }, { children: true })
}

/**
 * Pixi Application을 DOM에 마운트하고, setup 콜백으로 씬을 구성한다.
 * React UI(HUD/패널)와 Pixi 렌더 레이어를 분리하는 공통 진입점.
 *
 * @param {object} props
 * @param {string} [props.className]
 * @param {number} [props.width=640]
 * @param {number} [props.height=180]
 * @param {string} [props.background='#2a211c']
 * @param {(app: import('pixi.js').Application) => void | (() => void)} props.setup
 *   앱 준비 후 씬 생성. 정리 함수를 반환하면 unmount 시 호출된다.
 */
export default function PixiStage({
  className,
  width = 640,
  height = 180,
  background = '#2a211c',
  setup,
}) {
  const hostRef = useRef(null)
  const setupRef = useRef(setup)
  setupRef.current = setup

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    let app = null
    let disposed = false
    let sceneCleanup = null

    ;(async () => {
      const application = new Application()
      app = application

      try {
        await application.init({
          width,
          height,
          background,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
        })
      } catch {
        return
      }

      // StrictMode 등: init 도중 unmount된 경우 — 여기서만 안전하게 정리
      if (disposed) {
        destroyApp(application)
        return
      }

      host.replaceChildren(application.canvas)
      application.canvas.style.display = 'block'
      application.canvas.style.width = '100%'
      application.canvas.style.height = '100%'
      application.canvas.style.borderRadius = '8px'

      const cleanup = setupRef.current?.(application) ?? null
      if (disposed) {
        if (typeof cleanup === 'function') cleanup()
        destroyApp(application)
        return
      }
      sceneCleanup = cleanup
    })()

    return () => {
      disposed = true
      if (typeof sceneCleanup === 'function') sceneCleanup()
      sceneCleanup = null
      // init 전이면 skip — async 쪽이 disposed 보고 destroyApp 호출
      destroyApp(app)
      app = null
      host.replaceChildren()
    }
  }, [width, height, background])

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ width: '100%', height, overflow: 'hidden' }}
    />
  )
}
