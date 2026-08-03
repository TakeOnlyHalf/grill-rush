import { useEffect, useRef, type CSSProperties, type ReactNode, type TransitionEventHandler } from 'react'
import { Application } from 'pixi.js'
import { colors } from '../ui/tokens'

/**
 * init() 완료 전에 destroy하면 ResizePlugin이 _cancelResize 미할당 상태로 크래시한다.
 * renderer 존재 = init 완료 / destroy 미호출.
 */
function destroyApp(app: Application | null) {
  if (!app?.renderer) return
  app.destroy({ removeView: true }, { children: true })
}

function rendererResolution() {
  return Math.min(window.devicePixelRatio || 1, 2)
}

export type PixiSetup = (app: Application) => void | (() => void)

export interface PixiStageProps {
  className?: string
  /** 호스트 div의 기본 크기 스타일(fillParent 여부에 따른 width/height) 위에 덮어쓴다. */
  style?: CSSProperties
  width?: number
  height?: number
  background?: string
  /**
   * true면 부모 크기에 맞춰 렌더러를 리사이즈한다.
   * CSS로 고정 버퍼를 늘리지 않아 텍스트·벡터가 흐려지지 않는다.
   */
  fillParent?: boolean
  /** 앱 준비 후 씬 생성. 정리 함수를 반환하면 unmount 시 호출된다. */
  setup: PixiSetup
  onTransitionEnd?: TransitionEventHandler<HTMLDivElement>
}

/**
 * Pixi Application을 DOM에 마운트하고, setup 콜백으로 씬을 구성한다.
 * React UI(HUD/패널)와 Pixi 렌더 레이어를 분리하는 공통 진입점.
 */
export default function PixiStage({
  className,
  style,
  width = 640,
  height = 180,
  background = colors.bgPanel2.value,
  fillParent = false,
  setup,
  onTransitionEnd,
}: PixiStageProps): ReactNode {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const setupRef = useRef(setup)
  setupRef.current = setup

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    let app: Application | null = null
    let disposed = false
    let sceneCleanup: (() => void) | null = null
    let removeResolutionListener: (() => void) | null = null

    ;(async () => {
      const application = new Application()
      app = application

      try {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const transparent = background === 'transparent'
        const bgColor = transparent ? '#000000' : background
        if (fillParent) {
          await application.init({
            resizeTo: host,
            background: bgColor,
            backgroundAlpha: transparent ? 0 : 1,
            antialias: true,
            resolution: dpr,
            autoDensity: true,
          })
        } else {
          await application.init({
            width,
            height,
            background: bgColor,
            backgroundAlpha: transparent ? 0 : 1,
            antialias: true,
            resolution: dpr,
            autoDensity: true,
          })
        }
      } catch {
        return
      }

      if (disposed) {
        destroyApp(application)
        return
      }

      host.replaceChildren(application.canvas)
      application.canvas.style.display = 'block'
      if (fillParent) {
        application.canvas.style.width = '100%'
        application.canvas.style.height = '100%'
      } else {
        application.canvas.style.width = '100%'
        application.canvas.style.height = '100%'
      }
      application.canvas.style.borderRadius = '8px'

      const syncResolution = () => {
        const nextResolution = rendererResolution()
        if (application.renderer.resolution !== nextResolution) {
          application.renderer.resize(
            application.screen.width,
            application.screen.height,
            nextResolution,
          )
        }
      }
      window.addEventListener('resize', syncResolution)
      removeResolutionListener = () => window.removeEventListener('resize', syncResolution)

      const cleanup = setupRef.current?.(application) ?? null
      if (disposed) {
        if (typeof cleanup === 'function') cleanup()
        destroyApp(application)
        return
      }
      sceneCleanup = typeof cleanup === 'function' ? cleanup : null
    })()

    return () => {
      disposed = true
      removeResolutionListener?.()
      removeResolutionListener = null
      if (typeof sceneCleanup === 'function') sceneCleanup()
      sceneCleanup = null
      destroyApp(app)
      app = null
      host.replaceChildren()
    }
  }, [width, height, background, fillParent])

  return (
    <div
      ref={hostRef}
      className={className}
      onTransitionEnd={onTransitionEnd}
      style={{
        ...(fillParent
          ? { width: '100%', height: '100%', overflow: 'hidden' }
          : { width: '100%', height, overflow: 'hidden' }),
        ...style,
      }}
    />
  )
}
