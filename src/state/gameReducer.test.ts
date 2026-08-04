import { describe, expect, it } from 'vitest'
import { getGrillSlotCount } from '../grill/grillUpgrades'
import { createInitialState } from './initialState'
import { gameReducer } from './gameReducer'

function nightState(cash = 1_000_000) {
  return {
    ...createInitialState(),
    phase: 'night' as const,
    cash,
  }
}

describe('BUY_UPGRADE', () => {
  it('charges 50,000 for heat boost and blocks duplicate purchases', () => {
    const initial = nightState(100_000)
    const purchased = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'heat_boost' },
    })

    expect(purchased.cash).toBe(50_000)
    expect(purchased.upgrades).toEqual(['heat_boost'])
    expect(
      gameReducer(purchased, {
        type: 'BUY_UPGRADE',
        payload: { upgradeId: 'heat_boost' },
      }),
    ).toBe(purchased)
  })

  it('charges the JSON cost and blocks duplicate purchases', () => {
    const initial = nightState(200_000)
    const purchased = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand' },
    })

    expect(purchased.cash).toBe(70_000)
    expect(purchased.upgrades).toEqual(['grill_expand'])
    expect(
      gameReducer(purchased, {
        type: 'BUY_UPGRADE',
        payload: { upgradeId: 'grill_expand' },
      }),
    ).toBe(purchased)
  })

  it('requires each previous expansion to be actually owned', () => {
    const initial = nightState()
    const blockedLevelTwo = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand_2' },
    })
    const blockedLevelThree = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand_3' },
    })

    expect(blockedLevelTwo).toBe(initial)
    expect(blockedLevelThree).toBe(initial)
  })

  it('purchases all levels in order for 130k, 140k, and 150k', () => {
    const initial = nightState()
    const levelOne = gameReducer(initial, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand' },
    })
    const levelTwo = gameReducer(levelOne, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand_2' },
    })
    const levelThree = gameReducer(levelTwo, {
      type: 'BUY_UPGRADE',
      payload: { upgradeId: 'grill_expand_3' },
    })

    expect(initial.cash - levelOne.cash).toBe(130_000)
    expect(levelOne.cash - levelTwo.cash).toBe(140_000)
    expect(levelTwo.cash - levelThree.cash).toBe(150_000)
    expect(getGrillSlotCount(levelThree.upgrades)).toBe(6)
  })
})
