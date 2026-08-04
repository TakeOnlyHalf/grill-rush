import upgradesData from '../data/upgrades.json'
import { GRILL_SLOT_COUNT } from './grillSlots'

export const MAX_GRILL_SLOT_COUNT = 6

export const GRILL_EXPANSION_UPGRADE_IDS = [
  'grill_expand',
  'grill_expand_2',
  'grill_expand_3',
] as const

export function getDisplayedGrillExpansionUpgrade(ownedUpgradeIds: readonly string[]) {
  const ownedUpgradeIdSet = new Set(ownedUpgradeIds)
  const displayedUpgradeId =
    GRILL_EXPANSION_UPGRADE_IDS.find((id) => !ownedUpgradeIdSet.has(id)) ??
    GRILL_EXPANSION_UPGRADE_IDS[GRILL_EXPANSION_UPGRADE_IDS.length - 1]

  return upgradesData.find((upgrade) => upgrade.id === displayedUpgradeId)
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
