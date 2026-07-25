import ingredientData from '../data/ingredients.json'
import type { GrillIngredient } from './grillSlots'

export const grillIngredients: GrillIngredient[] = ingredientData
  .filter((ingredient) => ingredient.grillSec > 0)
  .map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    icon: ingredient.icon,
    cookDurationMs: ingredient.grillSec * 1_000,
  }))
