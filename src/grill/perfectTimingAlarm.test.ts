import { describe, expect, it } from 'vitest'
import { didEnterPerfectWindow, getCookResult, type GrillSlot } from './grillSlots'
import { updatePerfectTimingAlarms, type PerfectTimingAlarmState } from './perfectTimingAlarm'

function cookingSlot(id: string, startedAt: number, cookDurationMs = 1_000): GrillSlot {
  return {
    id,
    status: 'cooking',
    ingredientId: 'egg',
    startedAt,
    cookDurationMs,
  }
}

describe('didEnterPerfectWindow', () => {
  it.each([
    [0.69, 0.7, true],
    [0.69, 0.89, true],
    [0.7, 0.8, false],
    [0.8, 0.89, false],
    [0.69, 0.9, false],
    [0.69, 1.01, false],
  ])('returns %s for %s → %s', (previous, current, expected) => {
    expect(didEnterPerfectWindow(previous, current)).toBe(expected)
  })

  it('does not change the existing cook result boundaries', () => {
    expect(getCookResult(0.39)).toBe('raw')
    expect(getCookResult(0.4)).toBe('good')
    expect(getCookResult(0.7)).toBe('perfect')
    expect(getCookResult(0.9)).toBe('danger')
    expect(getCookResult(1)).toBe('danger')
    expect(getCookResult(1.01)).toBe('burnt')
  })
})

describe('updatePerfectTimingAlarms', () => {
  it('stays silent when the upgrade is not owned', () => {
    const update = updatePerfectTimingAlarms([cookingSlot('grill-1', 0)], 700, {}, false)
    expect(update.enteredSlotIds).toEqual([])
  })

  it('alerts once per cook and allows a new cook in the same slot', () => {
    const slot = cookingSlot('grill-1', 0)
    const before = updatePerfectTimingAlarms([slot], 690, {}, true)
    const entered = updatePerfectTimingAlarms([slot], 700, before.state, true)
    const stayed = updatePerfectTimingAlarms([slot], 850, entered.state, true)
    const danger = updatePerfectTimingAlarms([slot], 900, stayed.state, true)

    expect(entered.enteredSlotIds).toEqual(['grill-1'])
    expect(stayed.enteredSlotIds).toEqual([])
    expect(danger.enteredSlotIds).toEqual([])

    const nextCook = cookingSlot('grill-1', 1_000)
    const nextEntered = updatePerfectTimingAlarms([nextCook], 1_700, danger.state, true)
    expect(nextEntered.enteredSlotIds).toEqual(['grill-1'])
  })

  it('tracks different and simultaneous slots independently', () => {
    const slots = [cookingSlot('grill-1', 0), cookingSlot('grill-2', 100)]
    const before = updatePerfectTimingAlarms(slots, 690, {}, true)
    const first = updatePerfectTimingAlarms(slots, 700, before.state, true)
    const second = updatePerfectTimingAlarms(slots, 800, first.state, true)

    expect(first.enteredSlotIds).toEqual(['grill-1'])
    expect(second.enteredSlotIds).toEqual(['grill-2'])

    const simultaneous = updatePerfectTimingAlarms(
      [cookingSlot('grill-3', 0), cookingSlot('grill-4', 0)],
      700,
      {},
      true,
    )
    expect(simultaneous.enteredSlotIds).toEqual(['grill-3', 'grill-4'])
  })

  it('does not emit a late alarm after an inactive tab passes the window', () => {
    const slot = cookingSlot('grill-1', 0)
    const before: PerfectTimingAlarmState = {
      'grill-1:0': { progress: 0.69, alerted: false },
    }
    const hidden = updatePerfectTimingAlarms([slot], 750, before, true, false)
    const visibleDanger = updatePerfectTimingAlarms([slot], 950, hidden.state, true, true)

    expect(hidden.enteredSlotIds).toEqual([])
    expect(visibleDanger.enteredSlotIds).toEqual([])
  })

  it('uses the final duration stored on the slot', () => {
    const shortenedSlot = cookingSlot('grill-1', 0, 800)
    const before = updatePerfectTimingAlarms([shortenedSlot], 550, {}, true)
    const entered = updatePerfectTimingAlarms([shortenedSlot], 560, before.state, true)
    expect(entered.enteredSlotIds).toEqual(['grill-1'])
  })
})
