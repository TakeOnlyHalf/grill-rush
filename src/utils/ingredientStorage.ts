import upgradesData from '../data/upgrades.json'
import { DAILY_INGREDIENT_PURCHASE_LIMIT } from '../state/actions'

/** 업그레이드 전 재료별 하루 구매 한도 */
export const BASE_INGREDIENT_PURCHASE_LIMIT = DAILY_INGREDIENT_PURCHASE_LIMIT

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getPurchaseLimitFromUpgrade(upgrade: unknown): number {
  if (!isRecord(upgrade) || !isRecord(upgrade.effect)) return 0
  const limit = upgrade.effect.ingredientPurchaseLimit
  return Number.isSafeInteger(limit) && Number(limit) > 0 ? Number(limit) : 0
}

const purchaseLimitByUpgradeId = new Map<string, number>()

for (const upgrade of upgradesData as readonly unknown[]) {
  if (!isRecord(upgrade) || typeof upgrade.id !== 'string') continue
  const limit = getPurchaseLimitFromUpgrade(upgrade)
  if (limit > 0) purchaseLimitByUpgradeId.set(upgrade.id, limit)
}

/**
 * 재료별 하루 구매 한도.
 * 기본 20, 보관함 업그레이드 보유 시 해당 효과값(40)으로 올라간다.
 */
export function getIngredientPurchaseLimit(
  ownedUpgradeIds: readonly string[],
): number {
  let limit = BASE_INGREDIENT_PURCHASE_LIMIT
  for (const upgradeId of new Set(ownedUpgradeIds)) {
    const upgraded = purchaseLimitByUpgradeId.get(upgradeId) ?? 0
    if (upgraded > limit) limit = upgraded
  }
  return limit
}
