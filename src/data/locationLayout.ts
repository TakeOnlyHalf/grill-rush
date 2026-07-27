/** Shared prep-location map anchors (background image space). */

export const LOC_X_RATIO: Record<string, number> = {
  park: 0.16,
  office: 0.34,
  festival: 0.5,
  campus: 0.66,
  night_market: 0.82,
}

/** Road surface Y as a fraction of background height */
export const ROAD_Y_RATIO = 0.78

/**
 * Vertical anchor for floating location cards (fraction of overlay height).
 * Sits just above the truck / road glow so cards feel tethered to each spot.
 */
export const LOC_CARD_ANCHOR_Y = 0.56
