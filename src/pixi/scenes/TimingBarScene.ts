import { Container, Graphics, Text, type Application, type Ticker } from 'pixi.js'
import { PIXI_COLORS } from '../colors'

export type TimingGrade = 'perfect' | 'good' | 'fail'

export interface TimingBarSceneOptions {
  onResult?: (grade: TimingGrade) => void
}

export interface TimingBarSceneHandle {
  destroy: () => void
}

/** 타이밍 바 미니게임 씬 */
export function createTimingBarScene(
  app: Application,
  options: TimingBarSceneOptions = {},
): TimingBarSceneHandle {
  const { onResult } = options
  const root = new Container()
  app.stage.addChild(root)

  const trackY = 52
  const trackH = 18
  const padX = 16

  const title = new Text({
    text: 'Timing Bar',
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 14,
      fill: PIXI_COLORS.text,
      fontWeight: '600',
    },
  })
  title.x = padX
  title.y = 10

  const hint = new Text({
    text: '클릭 또는 Space로 멈추기',
    style: {
      fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
      fontSize: 11,
      fill: PIXI_COLORS.muted,
    },
  })
  hint.x = padX
  hint.y = 86

  const track = new Graphics()
  const cursor = new Graphics()
  cursor.rect(-2, -4, 4, trackH + 8)
  cursor.fill(PIXI_COLORS.cursor)

  root.addChild(title, track, cursor, hint)

  let t = 0
  const speed = 1.15
  let locked = false
  let resultLabel: Text | null = null

  function drawTrack() {
    const w = app.screen.width
    const trackW = w - padX * 2
    track.clear()
    track.roundRect(padX, trackY, trackW, trackH, 4)
    track.fill(PIXI_COLORS.track)

    const goodX = padX + trackW * 0.3
    const goodW = trackW * 0.4
    track.roundRect(goodX, trackY, goodW, trackH, 3)
    track.fill({ color: PIXI_COLORS.zoneGood, alpha: 0.55 })

    const perfectX = padX + trackW * 0.43
    const perfectW = trackW * 0.14
    track.roundRect(perfectX, trackY, perfectW, trackH, 3)
    track.fill({ color: PIXI_COLORS.zonePerfect, alpha: 0.9 })
  }

  function cursorX() {
    const trackW = app.screen.width - padX * 2
    const pingPong = Math.abs(((t % 2) + 2) % 2 - 1)
    return padX + pingPong * trackW
  }

  function gradeAt(x: number): TimingGrade {
    const trackW = app.screen.width - padX * 2
    const ratio = (x - padX) / trackW
    if (ratio >= 0.43 && ratio <= 0.57) return 'perfect'
    if (ratio >= 0.3 && ratio <= 0.7) return 'good'
    return 'fail'
  }

  function showResult(grade: TimingGrade) {
    if (resultLabel) {
      resultLabel.destroy()
      resultLabel = null
    }
    const colors: Record<TimingGrade, number> = {
      perfect: PIXI_COLORS.zonePerfect,
      good: PIXI_COLORS.ok,
      fail: PIXI_COLORS.danger,
    }
    resultLabel = new Text({
      text: grade.toUpperCase(),
      style: {
        fontFamily: 'Segoe UI, Malgun Gothic, sans-serif',
        fontSize: 16,
        fill: colors[grade],
        fontWeight: '700',
      },
    })
    resultLabel.x = app.screen.width - padX - resultLabel.width
    resultLabel.y = 10
    root.addChild(resultLabel)
  }

  function attempt() {
    if (locked) return
    locked = true
    const grade = gradeAt(cursor.x)
    showResult(grade)
    onResult?.(grade)
    setTimeout(() => {
      locked = false
      t = 0
      if (resultLabel) {
        resultLabel.destroy()
        resultLabel = null
      }
    }, 700)
  }

  const onTick = (ticker: Ticker) => {
    if (!locked) {
      t += (ticker.deltaMS / 1000) * speed
    }
    cursor.x = cursorX()
    cursor.y = trackY
  }

  const onPointer = () => attempt()
  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault()
      attempt()
    }
  }

  drawTrack()
  app.ticker.add(onTick)
  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen
  app.stage.on('pointertap', onPointer)
  window.addEventListener('keydown', onKey)

  return {
    destroy() {
      app.ticker.remove(onTick)
      app.stage.off('pointertap', onPointer)
      window.removeEventListener('keydown', onKey)
      root.destroy({ children: true })
    },
  }
}
