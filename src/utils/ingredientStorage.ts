import upgradesData from '../data/upgrades.json'

export const BASE_INGREDIENT_CAPACITY = 40

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getCapacityBonus(upgrade: unknown): number {
  if (!isRecord(upgrade) || !isRecord(upgrade.effect)) return 0
  const bonus = upgrade.effect.ingredientCapBonus
  return Number.isSafeInteger(bonus) && Number(bonus) > 0 ? Number(bonus) : 0
}

const capacityBonusByUpgradeId = new Map<string, number>()

for (const upgrade of upgradesData as readonly unknown[]) {
  if (!isRecord(upgrade) || typeof upgrade.id !== 'string') continue
  const bonus = getCapacityBonus(upgrade)
  if (bonus > 0) capacityBonusByUpgradeId.set(upgrade.id, bonus)
}

export function getIngredientCount(
  ingredients: Readonly<Record<string, number>>,
): number {
  let count = 0
  for (const quantity of Object.values(ingredients)) {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) continue
    if (!Number.isSafeInteger(count + quantity)) return Number.MAX_SAFE_INTEGER
    count += quantity
  }
  return count
}

export function getIngredientCapacity(
  ownedUpgradeIds: readonly string[],
): number {
  let capacity = BASE_INGREDIENT_CAPACITY
  for (const upgradeId of new Set(ownedUpgradeIds)) {
    const bonus = capacityBonusByUpgradeId.get(upgradeId) ?? 0
    if (Number.isSafeInteger(capacity + bonus)) capacity += bonus
  }
  return capacity
}

export function canPurchaseIngredient(
  ingredients: Readonly<Record<string, number>>,
  ownedUpgradeIds: readonly string[],
  quantity: number,
): boolean {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) return false
  if (
    Object.values(ingredients).some(
      (owned) => !Number.isSafeInteger(owned) || owned < 0,
    )
  ) {
    return false
  }

  const count = getIngredientCount(ingredients)
  const capacity = getIngredientCapacity(ownedUpgradeIds)
  return count <= capacity - quantity
}
