import { describe, expect, it } from 'vitest'
import { runAutoAssistTick, startAutoAssistCooldown } from './autoAssist'
import {
  collectGrillSlot,
  createIdleGrillSlots,
  getAutoCollectCandidate,
  type GrillSlot,
} from './grillSlots'

function cookingSlot(
  id: string,
  startedAt: number,
  cookDurationMs: number,
  ingredientId = `ingredient-${id}`,
): GrillSlot {
  return { id, status: 'cooking', ingredientId, startedAt, cookDurationMs }
}

describe('auto collect candidate selection', () => {
  it('returns null without an eligible perfect slot', () => {
    const idle = createIdleGrillSlots(1)[0]
    const good = cookingSlot('good', 5_000, 10_000)
    const danger = cookingSlot('danger', 900, 10_000)
    const burnt = { ...cookingSlot('burnt', -100, 10_000), status: 'burnt' as const }
    expect(getAutoCollectCandidate([idle, good, danger, burnt], 10_000)).toBeNull()
  })

  it('selects the perfect slot with the least real time before danger', () => {
    const slower = cookingSlot('slower', -5_000, 20_000)
    const urgent = cookingSlot('urgent', 2_900, 10_000)
    expect(getAutoCollectCandidate([slower, urgent], 10_000)?.id).toBe('urgent')
  })

  it('uses startedAt and then slot ID as deterministic tie breakers', () => {
    const earlier = cookingSlot('z-slot', -6_000, 20_000)
    const later = cookingSlot('a-slot', 3_000, 10_000)
    expect(getAutoCollectCandidate([later, earlier], 10_000)?.id).toBe('z-slot')

    const b = cookingSlot('b-slot', 3_000, 10_000)
    const a = cookingSlot('a-slot', 3_000, 10_000)
    expect(getAutoCollectCandidate([b, a], 10_000)?.id).toBe('a-slot')
  })
})

describe('shared grill collection', () => {
  it('collects exactly one slot and does not mutate the source array', () => {
    const source = [cookingSlot('first', 2_000, 10_000), cookingSlot('second', 2_000, 10_000)]
    const snapshot = structuredClone(source)
    const result = collectGrillSlot(source, source[0], 10_000)

    expect(result.collected).toMatchObject({
      slotId: 'first',
      ingredientId: 'ingredient-first',
      result: 'perfect',
    })
    expect(result.slots[0].status).toBe('idle')
    expect(result.slots[1]).toEqual(source[1])
    expect(source).toEqual(snapshot)
  })

  it('cannot collect the same cooking instance twice', () => {
    const slot = cookingSlot('only', 2_000, 10_000)
    const first = collectGrillSlot([slot], slot, 10_000)
    const second = collectGrillSlot(first.slots, slot, 10_000)

    expect(first.collected?.result).toBe('perfect')
    expect(second.collected).toBeNull()
  })

  it('rejects a replaced slot instance and an automatic non-perfect result', () => {
    const original = cookingSlot('same-id', 2_000, 10_000)
    const replacement = cookingSlot('same-id', 3_000, 10_000, 'replacement')
    expect(collectGrillSlot([replacement], original, 10_000).collected).toBeNull()
    expect(collectGrillSlot([replacement], replacement, 12_100, 'perfect').collected).toBeNull()
  })
})

describe('auto assist reuse cooldown', () => {
  it('stays disabled when the upgrade is not owned', () => {
    const perfect = cookingSlot('perfect', 3_000, 10_000)
    const result = runAutoAssistTick([perfect], 10_000, null, { readyAt: null }, true)
    expect(result.collected).toBeNull()
    expect(result.timer.readyAt).toBeNull()
  })

  it('does not collect before the initial cooldown finishes', () => {
    const perfect = cookingSlot('perfect', 1_000, 10_000)
    const timer = startAutoAssistCooldown(9_000, 0)
    const result = runAutoAssistTick([perfect], 8_000, 9_000, timer, true)
    expect(result.collected).toBeNull()
    expect(result.timer.readyAt).toBe(9_000)
  })

  it('remains armed after an empty check and collects on the first later perfect tick', () => {
    const slot = cookingSlot('later-perfect', 4_000, 10_000)
    const timer = startAutoAssistCooldown(9_000, 0)
    const emptyCheck = runAutoAssistTick([slot], 9_000, 9_000, timer, true)
    expect(emptyCheck.collected).toBeNull()
    expect(emptyCheck.timer.readyAt).toBe(9_000)

    const perfectTick = runAutoAssistTick(
      emptyCheck.slots,
      11_000,
      9_000,
      emptyCheck.timer,
      true,
    )
    expect(perfectTick.collected?.slotId).toBe('later-perfect')
    expect(perfectTick.timer.readyAt).toBe(20_000)
  })

  it('restarts cooldown only after success and collects at most one slot per tick', () => {
    const first = cookingSlot('first', 3_000, 10_000)
    const second = cookingSlot('second', 3_000, 10_000)
    const collected = runAutoAssistTick(
      [second, first],
      10_000,
      8_000,
      { readyAt: 8_000 },
      true,
    )
    expect(collected.collected?.slotId).toBe('first')
    expect(collected.slots.filter((slot) => slot.status === 'idle')).toHaveLength(1)
    expect(collected.timer.readyAt).toBe(18_000)

    const stillCoolingDown = runAutoAssistTick(
      collected.slots,
      10_200,
      8_000,
      collected.timer,
      true,
    )
    expect(stillCoolingDown.collected).toBeNull()
  })

  it('does not collect in an inactive tab and does not reset readiness', () => {
    const perfect = cookingSlot('perfect', 3_000, 10_000)
    const result = runAutoAssistTick(
      [perfect],
      10_000,
      7_000,
      { readyAt: 7_000 },
      false,
    )
    expect(result.collected).toBeNull()
    expect(result.timer.readyAt).toBe(7_000)
  })

  it('does not depend on customer or order context', () => {
    const perfect = cookingSlot('no-customer-needed', 3_000, 10_000)
    const result = runAutoAssistTick(
      [perfect],
      10_000,
      9_000,
      { readyAt: 9_000 },
      true,
    )
    expect(result.collected?.slotId).toBe('no-customer-needed')
  })
})
