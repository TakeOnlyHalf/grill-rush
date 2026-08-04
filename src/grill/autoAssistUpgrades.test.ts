import { describe, expect, it } from 'vitest'
import upgradesData from '../data/upgrades.json'
import {
  AUTO_ASSIST_UPGRADE_IDS,
  getAutoAssistIntervalMs,
  getAutoAssistLevel,
  getDisplayedAutoAssistUpgrade,
} from './grillUpgrades'

describe('auto assist upgrade levels', () => {
  it.each([
    [[], 0, null],
    [['auto_assist'], 1, 9_000],
    [['auto_assist', 'auto_assist_2'], 2, 8_000],
    [['auto_assist', 'auto_assist_2', 'auto_assist_3'], 3, 7_000],
  ] as const)('resolves %j to level %i and interval %i', (owned, level, interval) => {
    expect(getAutoAssistLevel(owned)).toBe(level)
    expect(getAutoAssistIntervalMs(owned)).toBe(interval)
  })

  it('ignores order, duplicates, and unknown upgrade IDs', () => {
    const owned = ['unknown', 'auto_assist_2', 'auto_assist', 'auto_assist_2']
    expect(getAutoAssistLevel(owned)).toBe(2)
    expect(getAutoAssistIntervalMs(owned)).toBe(8_000)
  })

  it.each([
    [[], 'auto_assist'],
    [['auto_assist'], 'auto_assist_2'],
    [['auto_assist', 'auto_assist_2'], 'auto_assist_3'],
    [['auto_assist', 'auto_assist_2', 'auto_assist_3'], 'auto_assist_3'],
  ] as const)('shows exactly the progressive card for %j', (owned, displayedId) => {
    expect(getDisplayedAutoAssistUpgrade(owned)?.id).toBe(displayedId)
  })

  it('keeps the configured IDs, costs, prerequisites, and intervals in one data source', () => {
    const definitions = AUTO_ASSIST_UPGRADE_IDS.map((id) =>
      upgradesData.find((upgrade) => upgrade.id === id),
    )
    expect(definitions.map((upgrade) => upgrade?.cost)).toEqual([120_000, 130_000, 140_000])
    expect(definitions.map((upgrade) => 'requires' in (upgrade ?? {}) ? upgrade?.requires : null))
      .toEqual(['grill_expand', 'auto_assist', 'auto_assist_2'])
    expect(definitions.map((upgrade) =>
      upgrade && 'autoCollectIntervalMs' in upgrade.effect
        ? upgrade.effect.autoCollectIntervalMs
        : null,
    )).toEqual([9_000, 8_000, 7_000])
  })

  it('keeps each card sentence aligned with its configured cooldown', () => {
    const definitions = AUTO_ASSIST_UPGRADE_IDS.map((id) =>
      upgradesData.find((upgrade) => upgrade.id === id),
    )

    expect(definitions.map((upgrade) => upgrade?.description))
      .toEqual(Array(3).fill('완벽 재료 1개 자동 회수'))
    expect(definitions.map((upgrade) => upgrade?.detail)).toEqual([
      '완벽 재료 회수 후 9초 대기합니다.',
      '완벽 재료 회수 후 8초 대기합니다.',
      '완벽 재료 회수 후 7초 대기합니다.',
    ])
  })
})
