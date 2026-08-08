import menus from '../data/menus.json'
import locations from '../data/locations.json'
import type { GameState, LocationId, MenuId } from '../types/game'

interface MenuUnlockDef {
  id: string
  unlockedByDefault: boolean
  unlockDay: number | null
  unlockFame: number | null
}

interface LocationUnlockDef {
  id: string
  unlockedByDefault: boolean
  unlockDay: number
}

function isMenuUnlocked(menu: MenuUnlockDef, day: number, fame: number): boolean {
  if (menu.unlockedByDefault) return true
  if (menu.unlockDay == null) return false
  if (day < menu.unlockDay) return false
  if (menu.unlockFame != null && fame < menu.unlockFame) return false
  return true
}

function isLocationUnlocked(location: LocationUnlockDef, day: number): boolean {
  if (location.unlockedByDefault) return true
  return day >= location.unlockDay
}

/** 현재 day/fame 기준으로 해금되어야 하는 메뉴 ID 목록 */
export function resolveUnlockedMenus(day: number, fame: number): MenuId[] {
  return (menus as MenuUnlockDef[])
    .filter((menu) => isMenuUnlocked(menu, day, fame))
    .map((menu) => menu.id as MenuId)
}

/** 현재 day 기준으로 해금되어야 하는 장소 ID 목록 */
export function resolveUnlockedLocations(day: number): LocationId[] {
  return (locations as LocationUnlockDef[])
    .filter((location) => isLocationUnlocked(location, day))
    .map((location) => location.id as LocationId)
}

function mergeIds<T extends string>(current: T[], next: T[]): T[] {
  const merged = new Set<T>(current)
  for (const id of next) merged.add(id)
  return [...merged]
}

/** day/fame에 맞는 메뉴·장소를 누적 해금한다 (이미 열린 항목은 유지) */
export function applyProgressUnlocks(state: GameState): GameState {
  const unlockedMenus = mergeIds(
    state.unlockedMenus,
    resolveUnlockedMenus(state.day, state.fame),
  )
  const unlockedLocations = mergeIds(
    state.unlockedLocations,
    resolveUnlockedLocations(state.day),
  )

  const menusChanged =
    unlockedMenus.length !== state.unlockedMenus.length ||
    unlockedMenus.some((id) => !state.unlockedMenus.includes(id))
  const locationsChanged =
    unlockedLocations.length !== state.unlockedLocations.length ||
    unlockedLocations.some((id) => !state.unlockedLocations.includes(id))

  if (!menusChanged && !locationsChanged) return state

  return {
    ...state,
    unlockedMenus,
    unlockedLocations,
  }
}
