import upgradesData from '../data/upgrades.json'
import { GRILL_SLOT_COUNT } from './grillSlots'

export function getGrillSlotCount(ownedUpgradeIds: readonly string[]): number {
  const ownedUpgradeIdSet = new Set(ownedUpgradeIds)
  const additionalSlots = upgradesData.reduce((total, upgrade) => {
    if (!ownedUpgradeIdSet.has(upgrade.id) || !('grillSlots' in upgrade.effect)) {
      return total
    }

    const grillSlots = upgrade.effect.grillSlots
    return typeof grillSlots === 'number' &&
      Number.isSafeInteger(grillSlots) &&
      grillSlots > 0
      ? total + grillSlots
      : total
  }, 0)

  return GRILL_SLOT_COUNT + additionalSlots
}
