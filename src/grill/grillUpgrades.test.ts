import { describe, expect, it } from 'vitest'
import {
  getDisplayedGrillExpansionUpgrade,
  getGrillSlotCount,
} from './grillUpgrades'

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
