import type { CSSProperties } from 'react'
import ingredientData from '../data/ingredients.json'
import { getCookProgress, getCookResult, type GrillSlot } from '../grill/grillSlots'
import {
  getGrillExpansionUpgradeForSlot,
  MAX_GRILL_SLOT_COUNT,
} from '../grill/grillUpgrades'

const ingredientById = new Map(ingredientData.map((ingredient) => [ingredient.id, ingredient]))
/** 2행3열 고정 그리드 — 확보한 슬롯(slots.length)을 뺀 나머지를 잠금 자리로 채운다. */
const GRID_SIZE = MAX_GRILL_SLOT_COUNT

const resultLabel = {
  raw: '조리 중',
  good: '좋음 · 회수 가능',
  perfect: '완벽 · 회수 가능',
  danger: '아슬아슬 · 회수 가능',
  burnt: '탔음 · 클릭해서 치우기',
} as const

export interface GrillSlotsProps {
  slots: GrillSlot[]
  now: number
  onCollect: (slot: GrillSlot) => void
  alertingSlotIds?: readonly string[]
}

/** 그릴 슬롯 2행3열 — 확보한 슬롯은 실제 조리 기능을 제공하고 나머지는 단계별 잠금 안내를 표시한다. */
export default function GrillSlots({
  slots,
  now,
  onCollect,
  alertingSlotIds = [],
}: GrillSlotsProps) {
  const alertingSlots = new Set(alertingSlotIds)
  return (
    <div className="grill-slot-grid">
      {slots.map((slot) => {
        if (slot.status === 'idle') {
          return (
            <div key={slot.id} className="grill-slot-card grill-slot-card--idle">
              <span className="grill-slot-plus" aria-hidden>
                +
              </span>
              <span className="grill-slot-hint">재료를 선택하세요</span>
            </div>
          )
        }

        const ingredient = slot.ingredientId ? ingredientById.get(slot.ingredientId) : undefined
        const progress = getCookProgress(slot, now)
        const result = slot.status === 'burnt' ? 'burnt' : getCookResult(progress)
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
            style={{ '--grill-progress': Math.min(1, progress) } as CSSProperties}
            onClick={() => onCollect(slot)}
            title={resultLabel[result]}
          >
            {isPerfectTimingAlert ? (
              <>
                <span className="grill-slot-alarm-icon" aria-hidden>🔔</span>
                <span className="grill-slot-alarm-label" aria-hidden>완벽! 지금 회수</span>
              </>
            ) : null}
            <span className="grill-slot-timer">
              <span className="grill-slot-timer-icon" aria-hidden>
                {ingredient?.icon ?? '🍳'}
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
