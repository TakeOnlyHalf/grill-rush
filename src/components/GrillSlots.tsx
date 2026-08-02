import type { CSSProperties } from 'react'
import ingredientData from '../data/ingredients.json'
import upgradesData from '../data/upgrades.json'
import { getCookProgress, getCookResult, type GrillSlot } from '../grill/grillSlots'

const ingredientById = new Map(ingredientData.map((ingredient) => [ingredient.id, ingredient]))
const grillExpandUpgrade = upgradesData.find((upgrade) => upgrade.id === 'grill_expand')
const LOCKED_SLOT_COUNT = 3

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
}

/** 그릴 슬롯 2행3열 — 위 3칸은 실제 조리 슬롯(원형 타이머), 아래 3칸은 미확보 슬롯(잠금) 자리만 표시. */
export default function GrillSlots({ slots, now, onCollect }: GrillSlotsProps) {
  const lockedTitle = grillExpandUpgrade
    ? `${grillExpandUpgrade.name} 필요 · ₩${grillExpandUpgrade.cost.toLocaleString('ko-KR')} (야간 업그레이드에서 구매)`
    : '확장 슬롯'

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
            className={`grill-slot-card grill-slot-card--cooking grill-slot-card--${tone}`}
            style={{ '--grill-progress': Math.min(1, progress) } as CSSProperties}
            onClick={() => onCollect(slot)}
            title={resultLabel[result]}
          >
            <span className="grill-slot-timer">
              <span className="grill-slot-timer-icon" aria-hidden>
                {ingredient?.icon ?? '🍳'}
              </span>
            </span>
            <span className="visually-hidden">
              {ingredient?.name ?? '재료'} — {resultLabel[result]}
            </span>
          </button>
        )
      })}
      {Array.from({ length: LOCKED_SLOT_COUNT }, (_, i) => (
        <div
          key={`locked-${i}`}
          className="grill-slot-card grill-slot-card--locked"
          title={lockedTitle}
        >
          <span className="grill-slot-lock-icon" aria-hidden>
            🔒
          </span>
          <span className="grill-slot-locked-label">확장</span>
        </div>
      ))}
    </div>
  )
}
