import { describe, expect, it } from 'vitest'
import {
  getAdjustedCookDurationMs,
  getCookTimeFactor,
  getDisplayedGrillExpansionUpgrade,
  getGrillSlotCount,
  hasPerfectTimingAlarm,
} from './grillUpgrades'
import { grillIngredients } from './grillIngredients'
import {
  createIdleGrillSlots,
  getCookProgress,
  getCookResult,
  placeIngredient,
  resolveGrillSlot,
} from './grillSlots'

describe('getGrillSlotCount', () => {
  it.each([
    [[], 3],
    [['grill_expand'], 4],
    [['grill_expand', 'grill_expand_2'], 5],
    [['grill_expand', 'grill_expand_2', 'grill_expand_3'], 6],
  ] as const)('returns the configured slot count for %j', (owned, expected) => {
    expect(getGrillSlotCount(owned)).toBe(expected)
  })

  it('is order independent and ignores duplicates and unknown upgrades', () => {
    expect(
      getGrillSlotCount([
        'grill_expand_3',
        'unknown_upgrade',
        'grill_expand',
        'grill_expand_2',
        'grill_expand',
      ]),
    ).toBe(6)
  })
})

describe('getDisplayedGrillExpansionUpgrade', () => {
  it.each([
    [[], 'grill_expand'],
    [['grill_expand'], 'grill_expand_2'],
    [['grill_expand', 'grill_expand_2'], 'grill_expand_3'],
    [['grill_expand', 'grill_expand_2', 'grill_expand_3'], 'grill_expand_3'],
  ] as const)('shows one progressive card for %j', (owned, expected) => {
    expect(getDisplayedGrillExpansionUpgrade(owned)?.id).toBe(expected)
  })
})

describe('data-driven grill upgrade effects', () => {
  it('detects the perfect timing alarm by its configured effect', () => {
    expect(hasPerfectTimingAlarm([])).toBe(false)
    expect(hasPerfectTimingAlarm(['timer_alarm'])).toBe(true)
  })
})

describe('cook time upgrades', () => {
  it('uses the configured heat boost factor', () => {
    expect(getCookTimeFactor([])).toBe(1)
    expect(getCookTimeFactor(['heat_boost'])).toBe(0.8)
    expect(getAdjustedCookDurationMs(10_000, [])).toBe(10_000)
    expect(getAdjustedCookDurationMs(10_000, ['heat_boost'])).toBe(8_000)
  })

  it('is order independent and ignores duplicates and unknown upgrades', () => {
    expect(getCookTimeFactor(['unknown_upgrade', 'heat_boost'])).toBe(0.8)
    expect(getCookTimeFactor(['heat_boost', 'unknown_upgrade'])).toBe(0.8)
    expect(getCookTimeFactor(['heat_boost', 'heat_boost'])).toBe(0.8)
  })

  it('rejects invalid durations and does not mutate ingredient data', () => {
    const originalDurations = grillIngredients.map((ingredient) => ingredient.cookDurationMs)

    expect(() => getAdjustedCookDurationMs(0, ['heat_boost'])).toThrow(RangeError)
    expect(() => getAdjustedCookDurationMs(1.5, ['heat_boost'])).toThrow(RangeError)
    expect(grillIngredients.map((ingredient) => ingredient.cookDurationMs)).toEqual(
      originalDurations,
    )
  })

  it('keeps cook result thresholds proportional to the adjusted slot duration', () => {
    const ingredient = {
      id: 'test',
      name: 'Test ingredient',
      icon: '',
      cookDurationMs: getAdjustedCookDurationMs(10_000, ['heat_boost']),
    }
    const slot = placeIngredient(createIdleGrillSlots(1)[0], ingredient, 1_000)

    expect(getCookProgress(slot, 4_200)).toBeCloseTo(0.4)
    expect(getCookResult(getCookProgress(slot, 4_200))).toBe('good')
    expect(getCookResult(getCookProgress(slot, 6_600))).toBe('perfect')
    expect(getCookResult(getCookProgress(slot, 8_200))).toBe('danger')
    expect(resolveGrillSlot(slot, 9_001).status).toBe('burnt')
  })
})
