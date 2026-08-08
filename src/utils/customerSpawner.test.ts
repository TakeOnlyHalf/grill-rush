import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_CUSTOMER_ORDER_ITEMS,
  MIN_CUSTOMER_ORDER_ITEMS,
  MULTI_ORDER_CHANCE,
} from '../state/actions'
import { selectOrderMenuIds, spawnCustomer } from './customerSpawner'

function sequence(...values: number[]): () => number {
  let index = 0
  return () => values[index++] ?? 0
}

describe('selectOrderMenuIds', () => {
  const menus = ['egg_bacon', 'grilled_corn', 'grilled_sausage']

  it('uses the configured 1~2 item range and a 50% multi-order chance', () => {
    expect(MIN_CUSTOMER_ORDER_ITEMS).toBe(1)
    expect(MAX_CUSTOMER_ORDER_ITEMS).toBe(2)
    expect(MULTI_ORDER_CHANCE).toBe(0.5)

    const single = selectOrderMenuIds(menus, menus, sequence(0.5, 0))
    const double = selectOrderMenuIds(menus, menus, sequence(0.49, 0, 0.99))

    expect(single).toHaveLength(1)
    expect(double).toHaveLength(2)
    expect(new Set(double).size).toBe(2)
  })

  it('never creates 0 or 3 items when sellable menus exist', () => {
    for (let index = 0; index < 100; index += 1) {
      const countRoll = index % 2 === 0 ? 0.25 : 0.75
      const selected = selectOrderMenuIds(menus, menus, sequence(countRoll, 0.4, 0.6))
      expect(selected.length).toBeGreaterThanOrEqual(MIN_CUSTOMER_ORDER_ITEMS)
      expect(selected.length).toBeLessThanOrEqual(MAX_CUSTOMER_ORDER_ITEMS)
    }
  })

  it('falls back to one item without duplication when only one menu is sellable', () => {
    expect(selectOrderMenuIds(['egg_bacon'], ['egg_bacon'], sequence(0, 0))).toEqual([
      'egg_bacon',
    ])
    expect(selectOrderMenuIds(
      ['egg_bacon', 'egg_bacon'],
      ['egg_bacon'],
      sequence(0, 0),
    )).toEqual(['egg_bacon'])
  })

  it('uses only menus that are both selected and unlocked', () => {
    const selected = selectOrderMenuIds(
      ['egg_bacon', 'classic_burger', 'not-a-menu'],
      ['egg_bacon', 'classic_burger'],
      sequence(0, 0, 0),
    )

    expect(selected).toEqual(['egg_bacon', 'classic_burger'])
    expect(selectOrderMenuIds(['classic_burger'], ['egg_bacon'], sequence(0))).toEqual([])
  })
})

describe('spawnCustomer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stores the original distinct menu list on a newly spawned customer', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const spawned = spawnCustomer({
      locationId: 'office',
      weather: 'sunny',
      activeMenus: ['egg_bacon', 'grilled_corn'],
      unlockedMenus: ['egg_bacon', 'grilled_corn'],
      fame: 0,
      day: 1,
      time: 0,
    })

    expect(spawned?.orderedMenuIds).toEqual(['egg_bacon', 'grilled_corn'])
    expect(spawned?.orderedMenuNames).toEqual(['에그 & 베이컨', '그릴 옥수수'])
  })

})
