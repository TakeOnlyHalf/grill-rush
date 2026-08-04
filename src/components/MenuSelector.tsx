import { useCallback, useEffect, useRef } from 'react'
import type { Application } from 'pixi.js'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { PixiStage } from '../pixi'
import {
  createMenuBoardScene,
  type MenuBoardHandle,
} from '../pixi/scenes/MenuBoardScene'
import { playSfx } from '../audio/sfx'

/** 메뉴 선택 — PixiJS 메뉴판 UI */
export default function MenuSelector() {
  const { state, dispatch } = useGame()
  const sceneRef = useRef<MenuBoardHandle | null>(null)
  const stateRef = useRef({
    unlockedMenus: state.unlockedMenus,
    activeMenus: state.activeMenus,
    menuPrices: state.menuPrices,
  })
  stateRef.current = {
    unlockedMenus: state.unlockedMenus,
    activeMenus: state.activeMenus,
    menuPrices: state.menuPrices,
  }

  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch

  useEffect(() => {
    sceneRef.current?.update(stateRef.current)
  }, [state.unlockedMenus, state.activeMenus, state.menuPrices])

  const setup = useCallback((app: Application) => {
    const scene = createMenuBoardScene(app, stateRef.current, (menuId) => {
      playSfx('menu_select')
      dispatchRef.current({
        type: ActionTypes.TOGGLE_MENU,
        payload: menuId,
      })
    })
    sceneRef.current = scene
    return () => {
      scene.destroy()
      sceneRef.current = null
    }
  }, [])

  return (
    <PixiStage
      className="prep-menu-pixi"
      fillParent
      background="transparent"
      setup={setup}
    />
  )
}
