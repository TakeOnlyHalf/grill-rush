import { describe, expect, it } from 'vitest'
import { gameReducer } from './gameReducer'
import { createInitialState } from './initialState'
import {
  applyProgressUnlocks,
  resolveUnlockedLocations,
  resolveUnlockedMenus,
} from './unlocks'

describe('progress unlocks', () => {
  it('keeps only starter menus and locations on day 1', () => {
    expect(resolveUnlockedMenus(1, 0)).toEqual([
      'egg_bacon',
      'grilled_corn',
      'grilled_sausage',
    ])
    expect(resolveUnlockedLocations(1)).toEqual(['office', 'campus'])
  })

  it('unlocks classic burger on day 3', () => {
    expect(resolveUnlockedMenus(2, 0)).not.toContain('classic_burger')
    expect(resolveUnlockedMenus(3, 0)).toContain('classic_burger')
  })

  it('unlocks locations by day thresholds', () => {
    expect(resolveUnlockedLocations(5)).toEqual(
      expect.arrayContaining(['office', 'campus', 'park']),
    )
    expect(resolveUnlockedLocations(10)).toEqual(
      expect.arrayContaining(['park', 'night_market']),
    )
    expect(resolveUnlockedLocations(15)).toContain('festival')
  })

  it('requires fame for BBQ platter even after day 15', () => {
    expect(resolveUnlockedMenus(15, 29)).not.toContain('grill_platter')
    expect(resolveUnlockedMenus(15, 30)).toContain('grill_platter')
  })

  it('applies menu unlocks when advancing to the next day', () => {
    const night = {
      ...createInitialState(),
      phase: 'night' as const,
      day: 2,
      unlockedMenus: ['egg_bacon', 'grilled_corn', 'grilled_sausage'],
    }
    const next = gameReducer(night, { type: 'NEXT_DAY' })

    expect(next.day).toBe(3)
    expect(next.unlockedMenus).toContain('classic_burger')
  })

  it('applies location unlocks when advancing to day 5', () => {
    const night = {
      ...createInitialState(),
      phase: 'night' as const,
      day: 4,
    }
    const next = gameReducer(night, { type: 'NEXT_DAY' })

    expect(next.day).toBe(5)
    expect(next.unlockedLocations).toContain('park')
  })

  it('unlocks BBQ platter after settle when fame threshold is met', () => {
    const settle = {
      ...createInitialState(),
      phase: 'settle' as const,
      day: 15,
      fame: 28,
      dailySales: 0,
      dailyTips: 0,
      dailyCosts: { ingredients: 0, rent: 0, waste: 0, truck: 0 },
      dailyReviews: [5, 5, 5, 5],
    }
    const night = gameReducer(settle, { type: 'CONFIRM_SETTLE' })

    expect(night.fame).toBeGreaterThanOrEqual(30)
    expect(night.unlockedMenus).toContain('grill_platter')
  })

  it('does not remove already unlocked content', () => {
    const state = applyProgressUnlocks({
      ...createInitialState(),
      day: 1,
      fame: 0,
      unlockedMenus: ['egg_bacon', 'classic_burger'],
      unlockedLocations: ['office', 'campus', 'festival'],
    })

    expect(state.unlockedMenus).toEqual(
      expect.arrayContaining(['egg_bacon', 'classic_burger']),
    )
    expect(state.unlockedLocations).toContain('festival')
  })
})
