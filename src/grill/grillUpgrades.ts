import upgradesData from '../data/upgrades.json'
import { GRILL_SLOT_COUNT, PERFECT_WINDOW_START as PERFECT_WINDOW_START_DEFAULT } from './grillSlots'

export const MAX_GRILL_SLOT_COUNT = 6

export const GRILL_EXPANSION_UPGRADE_IDS = [
  'grill_expand',
  'grill_expand_2',
  'grill_expand_3',
] as const

export const SERVE_ASSIST_UPGRADE_IDS = [
  'auto_assist',
  'auto_assist_2',
  'auto_assist_3',
] as const

/** @deprecated Use SERVE_ASSIST_UPGRADE_IDS */
export const AUTO_ASSIST_UPGRADE_IDS = SERVE_ASSIST_UPGRADE_IDS

export function getDisplayedGrillExpansionUpgrade(ownedUpgradeIds: readonly string[]) {
  const ownedUpgradeIdSet = new Set(ownedUpgradeIds)
  const displayedUpgradeId =
    GRILL_EXPANSION_UPGRADE_IDS.find((id) => !ownedUpgradeIdSet.has(id)) ??
    GRILL_EXPANSION_UPGRADE_IDS[GRILL_EXPANSION_UPGRADE_IDS.length - 1]

  return upgradesData.find((upgrade) => upgrade.id === displayedUpgradeId)
}

export function getServeAssistLevel(ownedUpgradeIds: readonly string[]): number {
  const ownedUpgradeIdSet = new Set(ownedUpgradeIds)
  return SERVE_ASSIST_UPGRADE_IDS.reduce(
    (level, id, index) => (ownedUpgradeIdSet.has(id) ? index + 1 : level),
    0,
  )
}

/** @deprecated Use getServeAssistLevel */
export function getAutoAssistLevel(ownedUpgradeIds: readonly string[]): number {
  return getServeAssistLevel(ownedUpgradeIds)
}

export function getServeAssistIntervalMs(
  ownedUpgradeIds: readonly string[],
): number | null {
  const level = getServeAssistLevel(ownedUpgradeIds)
  if (level === 0) return null

  const upgradeId = SERVE_ASSIST_UPGRADE_IDS[level - 1]
  const upgrade = upgradesData.find((item) => item.id === upgradeId)
  if (!upgrade || !('autoServeIntervalMs' in upgrade.effect)) return null

  const intervalMs = upgrade.effect.autoServeIntervalMs
  return typeof intervalMs === 'number' && Number.isSafeInteger(intervalMs) && intervalMs > 0
    ? intervalMs
    : null
}

/** @deprecated Use getServeAssistIntervalMs */
export function getAutoAssistIntervalMs(
  ownedUpgradeIds: readonly string[],
): number | null {
  return getServeAssistIntervalMs(ownedUpgradeIds)
}

export function getDisplayedServeAssistUpgrade(ownedUpgradeIds: readonly string[]) {
  const level = getServeAssistLevel(ownedUpgradeIds)
  const displayedUpgradeId =
    SERVE_ASSIST_UPGRADE_IDS[Math.min(level, SERVE_ASSIST_UPGRADE_IDS.length - 1)]
  return upgradesData.find((upgrade) => upgrade.id === displayedUpgradeId)
}

/** @deprecated Use getDisplayedServeAssistUpgrade */
export function getDisplayedAutoAssistUpgrade(ownedUpgradeIds: readonly string[]) {
  return getDisplayedServeAssistUpgrade(ownedUpgradeIds)
}

export function getGrillExpansionUpgradeForSlot(slotNumber: number) {
  const upgradeId = GRILL_EXPANSION_UPGRADE_IDS[slotNumber - GRILL_SLOT_COUNT - 1]
  return upgradeId
    ? upgradesData.find((upgrade) => upgrade.id === upgradeId)
    : undefined
}

export function getGrillSlotCount(ownedUpgradeIds: readonly string[]): number {
  const ownedUpgradeIdSet = new Set(ownedUpgradeIds)
  const additionalSlots = upgradesData.reduce((total, upgrade) => {
    if (!ownedUpgradeIdSet.has(upgrade.id) || !('grillSlots' in upgrade.effect)) {
      return total
    }

    const grillSlots = upgrade.effect.grillSlots
    return grillSlots === 1 ? total + grillSlots : total
  }, 0)

  return Math.min(MAX_GRILL_SLOT_COUNT, GRILL_SLOT_COUNT + additionalSlots)
}

export function hasPerfectTimingAlarm(ownedUpgradeIds: readonly string[]): boolean {
  const ownedUpgradeIdSet = new Set(ownedUpgradeIds)
  return upgradesData.some(
    (upgrade) =>
      ownedUpgradeIdSet.has(upgrade.id) &&
      'perfectTimingAlarm' in upgrade.effect &&
      upgrade.effect.perfectTimingAlarm === true,
  )
}

export const HEAT_CONTROL_UPGRADE_IDS = [
  'heat_control',
  'heat_control_2',
] as const

export function getHeatControlLevel(ownedUpgradeIds: readonly string[]): number {
  const ownedUpgradeIdSet = new Set(ownedUpgradeIds)
  return HEAT_CONTROL_UPGRADE_IDS.reduce(
    (level, id, index) => (ownedUpgradeIdSet.has(id) ? index + 1 : level),
    0,
  )
}

/** 완벽 구간 시작점. 기본 0.7, 불조절 Lv.1=0.6, Lv.2=0.5 */
export function getPerfectWindowStart(ownedUpgradeIds: readonly string[]): number {
  const level = getHeatControlLevel(ownedUpgradeIds)
  if (level <= 0) return PERFECT_WINDOW_START_DEFAULT
  const upgradeId = HEAT_CONTROL_UPGRADE_IDS[level - 1]
  const upgrade = upgradesData.find((item) => item.id === upgradeId)
  if (!upgrade || !('perfectWindowStart' in upgrade.effect)) {
    return PERFECT_WINDOW_START_DEFAULT
  }
  const start = upgrade.effect.perfectWindowStart
  return typeof start === 'number' && Number.isFinite(start) && start > 0.4 && start < 0.9
    ? start
    : PERFECT_WINDOW_START_DEFAULT
}

export function getDisplayedHeatControlUpgrade(ownedUpgradeIds: readonly string[]) {
  const level = getHeatControlLevel(ownedUpgradeIds)
  const displayedUpgradeId =
    HEAT_CONTROL_UPGRADE_IDS[Math.min(level, HEAT_CONTROL_UPGRADE_IDS.length - 1)]
  return upgradesData.find((upgrade) => upgrade.id === displayedUpgradeId)
}

export function getCookTimeFactor(ownedUpgradeIds: readonly string[]): number {
  const ownedUpgradeIdSet = new Set(ownedUpgradeIds)

  return upgradesData.reduce((factor, upgrade) => {
    if (
      !ownedUpgradeIdSet.has(upgrade.id) ||
      !('cookTimeFactor' in upgrade.effect) ||
      typeof upgrade.effect.cookTimeFactor !== 'number' ||
      !Number.isFinite(upgrade.effect.cookTimeFactor) ||
      upgrade.effect.cookTimeFactor <= 0
    ) {
      return factor
    }

    const nextFactor = factor * upgrade.effect.cookTimeFactor
    return Number.isFinite(nextFactor) && nextFactor > 0 ? nextFactor : factor
  }, 1)
}

export function getAdjustedCookDurationMs(
  baseDurationMs: number,
  ownedUpgradeIds: readonly string[],
): number {
  if (!Number.isSafeInteger(baseDurationMs) || baseDurationMs <= 0) {
    throw new RangeError('Cook duration must be a positive integer')
  }

  const adjustedDurationMs = Math.round(
    baseDurationMs * getCookTimeFactor(ownedUpgradeIds),
  )
  if (!Number.isSafeInteger(adjustedDurationMs) || adjustedDurationMs <= 0) {
    throw new RangeError('Adjusted cook duration must be a positive integer')
  }

  return adjustedDurationMs
}
