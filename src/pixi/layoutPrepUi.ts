import type { Application, Container } from 'pixi.js'

/** 예전 prep-supply 패널(최대 약 1200×720)에 맞춘 UI 스케일 */
const UI_PANEL_MAX_W = 1200
const UI_PANEL_MAX_H = 720
const UI_PANEL_PAD_X = 48
const UI_PANEL_PAD_Y = 200

/**
 * 풀블리드 배경과 별도로, 메뉴/마트 UI world만 기존 패널 크기로 맞춘다.
 */
export function layoutPrepUiWorld(
  app: Application,
  world: Container,
  designW: number,
  designH: number,
) {
  if (app.screen.width <= 0 || app.screen.height <= 0) return

  const maxW = Math.min(app.screen.width - UI_PANEL_PAD_X, UI_PANEL_MAX_W)
  const maxH = Math.min(app.screen.height - UI_PANEL_PAD_Y, UI_PANEL_MAX_H)
  const s = Math.min(maxW / designW, maxH / designH)

  world.scale.set(s)
  world.x = (app.screen.width - designW * s) / 2
  world.y = (app.screen.height - designH * s) / 2
}
