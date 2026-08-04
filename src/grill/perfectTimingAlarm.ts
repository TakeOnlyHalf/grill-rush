import {
  didEnterPerfectWindow,
  getCookProgress,
  PERFECT_WINDOW_END,
  type GrillSlot,
} from './grillSlots'

interface CookAlarmProgress {
  progress: number
  alerted: boolean
}

export type PerfectTimingAlarmState = Record<string, CookAlarmProgress>

export interface PerfectTimingAlarmUpdate {
  state: PerfectTimingAlarmState
  enteredSlotIds: string[]
}

export function getCookInstanceKey(slot: GrillSlot): string | null {
  return slot.startedAt === null ? null : `${slot.id}:${slot.startedAt}`
}

/**
 * 현재 슬롯만으로 다음 알림 추적 상태를 만든다. 슬롯이 비워지면 키가 제거되고,
 * 같은 슬롯에 새 startedAt으로 조리를 시작하면 독립적인 새 조리로 취급된다.
 */
export function updatePerfectTimingAlarms(
  slots: readonly GrillSlot[],
  now: number,
  previousState: PerfectTimingAlarmState,
  enabled: boolean,
  active = true,
): PerfectTimingAlarmUpdate {
  if (!enabled) return { state: {}, enteredSlotIds: [] }

  const state: PerfectTimingAlarmState = {}
  const enteredSlotIds: string[] = []

  for (const slot of slots) {
    if (slot.status === 'idle') continue
    const key = getCookInstanceKey(slot)
    if (!key) continue

    const currentProgress = getCookProgress(slot, now)
    const previous = previousState[key]

    // 숨겨진 탭에서는 경과 지점을 전진시키지 않아 복귀 시 한 번만 판단한다.
    // 단, 처음 관찰한 시점에 이미 완벽 구간을 지났다면 늦은 알림을 막는다.
    if (!active) {
      state[key] = previous ?? {
        progress: currentProgress,
        alerted: currentProgress >= PERFECT_WINDOW_END,
      }
      continue
    }

    const entered =
      !previous?.alerted &&
      didEnterPerfectWindow(previous?.progress ?? 0, currentProgress)

    if (entered) enteredSlotIds.push(slot.id)
    state[key] = {
      progress: currentProgress,
      alerted: Boolean(previous?.alerted || entered || currentProgress >= PERFECT_WINDOW_END),
    }
  }

  return { state, enteredSlotIds }
}
