import type { CSSProperties } from 'react'
import ingredientData from '../data/ingredients.json'
import { getCookProgress, getCookResult, PERFECT_WINDOW_END, PERFECT_WINDOW_START, type GrillSlot } from '../grill/grillSlots'
import {
  getGrillExpansionUpgradeForSlot,
  MAX_GRILL_SLOT_COUNT,
} from '../grill/grillUpgrades'
import { GRILL_TILE_OFF_ART, GRILL_TILE_ON_ART } from '../utils/assets'
import { INGREDIENT_FOOD_STYLE } from '../utils/foodIcons'

const ingredientById = new Map(ingredientData.map((ingredient) => [ingredient.id, ingredient]))
/** 2행3열 고정 그리드 — 확보한 슬롯(slots.length)을 뺀 나머지를 잠금 자리로 채운다. */
const GRID_SIZE = MAX_GRILL_SLOT_COUNT

/** grill-off/on.webp(1661x947)의 투명 여백을 잘라내고 철판만 채우는 크롭 좌표. */
const GRILL_TILE_OFF_STYLE: CSSProperties = {
  backgroundImage: `url(${GRILL_TILE_OFF_ART})`,
  backgroundSize: '124.14% 145.03%',
  backgroundPosition: '48.61% 45.92%',
}
const GRILL_TILE_ON_STYLE: CSSProperties = {
  backgroundImage: `url(${GRILL_TILE_ON_ART})`,
  backgroundSize: '123.86% 144.58%',
  backgroundPosition: '49.38% 45.89%',
}

const resultLabel = {
  raw: '조리 중',
  good: '좋음 · 회수 가능',
  perfect: '완벽 · 회수 가능',
  danger: '아슬아슬 · 회수 가능',
  burnt: '탔음 · 클릭해서 치우기',
} as const

/** 프로그레스 바 구간 경계 — 좋음 / 완벽 / 위험 시작점 */
function cookZoneMarks(perfectWindowStart: number) {
  return [0.4, perfectWindowStart, PERFECT_WINDOW_END] as const
}

export interface GrillSlotsProps {
  slots: GrillSlot[]
  now: number
  onCollect: (slot: GrillSlot) => void
  alertingSlotIds?: readonly string[]
  perfectWindowStart?: number
}

/** 그릴 슬롯 2행3열 — 확보한 슬롯은 실제 조리 기능을 제공하고 나머지는 단계별 잠금 안내를 표시한다. */
export default function GrillSlots({
  slots,
  now,
  onCollect,
  alertingSlotIds = [],
  perfectWindowStart = PERFECT_WINDOW_START,
}: GrillSlotsProps) {
  const alertingSlots = new Set(alertingSlotIds)
  const zoneMarks = cookZoneMarks(perfectWindowStart)
  return (
    <div className="grill-slot-grid">
      {slots.map((slot) => {
        if (slot.status === 'idle') {
          return (
            <div
              key={slot.id}
              className="grill-slot-card grill-slot-card--idle"
              style={GRILL_TILE_OFF_STYLE}
            >
              <span className="grill-slot-plus" aria-hidden>
                +
              </span>
              <span className="grill-slot-hint">재료를 선택하세요</span>
            </div>
          )
        }

        const ingredient = slot.ingredientId ? ingredientById.get(slot.ingredientId) : undefined
        const progress = getCookProgress(slot, now)
        const result =
          slot.status === 'burnt' ? 'burnt' : getCookResult(progress, perfectWindowStart)
        const isPerfectTimingAlert = alertingSlots.has(slot.id)
        const tone =
          result === 'burnt'
            ? 'burnt'
            : result === 'raw'
              ? 'raw'
              : result === 'danger'
                ? 'danger'
                : result === 'good'
                  ? 'good'
                  : 'perfect'

        return (
          <button
            key={slot.id}
            type="button"
            className={`grill-slot-card grill-slot-card--cooking grill-slot-card--${tone}${isPerfectTimingAlert ? ' is-perfect-timing-alert' : ''}`}
            style={GRILL_TILE_ON_STYLE}
            onClick={() => onCollect(slot)}
            title={resultLabel[result]}
          >
            {isPerfectTimingAlert ? (
              <>
                <span className="grill-slot-alarm-icon" aria-hidden>🔔</span>
                <span className="grill-slot-alarm-label" aria-hidden>완벽! 지금 회수</span>
              </>
            ) : null}
            <span className="grill-slot-cook">
              <span
                className={`grill-slot-food${ingredient && INGREDIENT_FOOD_STYLE[ingredient.id] ? ' has-food-image' : ''}`}
                aria-hidden
                style={ingredient ? INGREDIENT_FOOD_STYLE[ingredient.id] : undefined}
              >
                {ingredient && INGREDIENT_FOOD_STYLE[ingredient.id] ? null : (ingredient?.icon ?? '🍳')}
              </span>
              <span className="grill-slot-bar" aria-hidden>
                <span className="grill-slot-bar-track">
                  <span
                    className="grill-slot-bar-fill"
                    style={{ width: `${Math.min(100, progress * 100)}%` }}
                  />
                </span>
                {zoneMarks.map((mark) => (
                  <span
                    key={mark}
                    className="grill-slot-bar-mark"
                    style={{ left: `calc(${mark * 100}% - 1px)` }}
                  />
                ))}
              </span>
            </span>
            <span className="visually-hidden">
              {ingredient?.name ?? '재료'} — {resultLabel[result]}
              {isPerfectTimingAlert ? ' — 완벽 타이밍 알림 중' : ''}
            </span>
          </button>
        )
      })}
      {Array.from({ length: Math.max(0, GRID_SIZE - slots.length) }, (_, i) => {
        const slotNumber = slots.length + i + 1
        const upgrade = getGrillExpansionUpgradeForSlot(slotNumber)
        const lockedLabel = upgrade
          ? `${upgrade.name} 필요 · ₩${upgrade.cost.toLocaleString('ko-KR')}`
          : '확장 슬롯'

        return (
          <div
            key={`locked-${slotNumber}`}
            className="grill-slot-card grill-slot-card--locked"
            style={GRILL_TILE_OFF_STYLE}
            title={`${lockedLabel} (야간 업그레이드에서 구매)`}
          >
            <span className="grill-slot-lock-icon" aria-hidden>
              🔒
            </span>
            <span className="grill-slot-locked-label">{lockedLabel}</span>
          </div>
        )
      })}
    </div>
  )
}
