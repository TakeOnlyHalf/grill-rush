import type { Phase } from '../types/game'

export type { Phase }

export const ActionTypes = {
  START_GAME: 'START_GAME',
  FINISH_STORY: 'FINISH_STORY',
  LOAD_GAME: 'LOAD_GAME',
  SET_LOCATION: 'SET_LOCATION',
  CONFIRM_LOCATION: 'CONFIRM_LOCATION',
  TOGGLE_MENU: 'TOGGLE_MENU',
  SET_MENU_PRICE: 'SET_MENU_PRICE',
  BUY_INGREDIENT: 'BUY_INGREDIENT',
  USE_INGREDIENT: 'USE_INGREDIENT',
  START_OPEN: 'START_OPEN',
  TICK_OPEN: 'TICK_OPEN',
  END_OPEN: 'END_OPEN',
  CONFIRM_SETTLE: 'CONFIRM_SETTLE',
  BUY_UPGRADE: 'BUY_UPGRADE',
  NEXT_DAY: 'NEXT_DAY',
  SHOW_ENDING: 'SHOW_ENDING',
  RESTART: 'RESTART',
} as const

export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes]

export const MAX_DAYS = 7
export const MAX_ACTIVE_MENUS = 4
export const OPEN_DURATION_SEC = 75
export const STARTING_CASH = 200_000
export const DAILY_TRUCK_COST = 5_000
