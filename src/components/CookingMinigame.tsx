import { useEffect, useRef, useState } from 'react'
import { useGame } from '../state/GameContext'
import {
  clearGrillSlot,
  createIdleGrillSlots,
  getCookProgress,
  getCookResult,
  placeIngredient,
  resolveGrillSlot,
  type GrillSlot,
} from '../grill/grillSlots'
import {
  getAdjustedCookDurationMs,
  getGrillSlotCount,
  hasPerfectTimingAlarm,
} from '../grill/grillUpgrades'
import {
  updatePerfectTimingAlarms,
  type PerfectTimingAlarmState,
} from '../grill/perfectTimingAlarm'
import { playPerfectTimingAlarm } from '../audio/sfx'
import { grillIngredients } from '../grill/grillIngredients'
import GrillSlots from './GrillSlots'
import { ActionTypes } from '../state/actions'
import { getOrderFulfillment } from '../state/orderFulfillment'
import ingredientData from '../data/ingredients.json'
import { INGREDIENT_FOOD_STYLE } from '../utils/foodIcons'

const ingredientById = new Map(ingredientData.map((ingredient) => [ingredient.id, ingredient]))
const grillIngredientById = new Map(grillIngredients.map((ingredient) => [ingredient.id, ingredient]))
const resultLabels = { good: '좋음', perfect: '완벽', danger: '아슬아슬' } as const
const PERFECT_TIMING_ALERT_DURATION_MS = 1_000

/**
 * 조리 미니게임 컨테이너 — 재료 / 그릴 / 완성 3분할(1:1.5:1) 레이아웃.
 * 그릴 슬롯은 기존 grillSlots 로직(GrillSlot 상태·조리 진행률·판정)을 그대로 쓰되
 * PixiJS 대신 DOM 카드(원형 타이머)로 그린다. 재료 클릭 → USE_INGREDIENT + 첫 빈 슬롯 배치,
 * 슬롯 클릭 → COLLECT_COOKED_INGREDIENT + 슬롯 비우기로 기존 리듀서 액션을 그대로 재사용한다.
 */
export default function CookingMinigame() {
  const { state, dispatch } = useGame()
  const [slots, setSlots] = useState<GrillSlot[]>(() =>
    createIdleGrillSlots(getGrillSlotCount(state.upgrades)),
  )
  const [now, setNow] = useState(() => Date.now())
  const [selectedPreparedId, setSelectedPreparedId] = useState<string | null>(null)
  const [alertingSlotIds, setAlertingSlotIds] = useState<string[]>([])
  const [alarmAnnouncement, setAlarmAnnouncement] = useState({ id: 0, message: '' })
  const alarmStateRef = useRef<PerfectTimingAlarmState>({})
  const alertTimersRef = useRef(new Map<string, number>())
  const perfectTimingAlarmEnabled = hasPerfectTimingAlarm(state.upgrades)

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      setSlots((prev) => prev.map((slot) => resolveGrillSlot(slot, t)))
    }, 200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const update = updatePerfectTimingAlarms(
      slots,
      now,
      alarmStateRef.current,
      perfectTimingAlarmEnabled,
      typeof document === 'undefined' || document.visibilityState === 'visible',
    )
    alarmStateRef.current = update.state
    if (update.enteredSlotIds.length === 0) return

    setAlertingSlotIds((current) => [...new Set([...current, ...update.enteredSlotIds])])
    for (const slotId of update.enteredSlotIds) {
      const existingTimer = alertTimersRef.current.get(slotId)
      if (existingTimer !== undefined) window.clearTimeout(existingTimer)
      const timer = window.setTimeout(() => {
        setAlertingSlotIds((current) => current.filter((id) => id !== slotId))
        alertTimersRef.current.delete(slotId)
      }, PERFECT_TIMING_ALERT_DURATION_MS)
      alertTimersRef.current.set(slotId, timer)
    }

    const message = update.enteredSlotIds
      .map((slotId) => `${slots.findIndex((slot) => slot.id === slotId) + 1}번 슬롯이 완벽 상태입니다. 지금 회수하세요.`)
      .join(' ')
    setAlarmAnnouncement((current) => ({ id: current.id + 1, message }))
    playPerfectTimingAlarm()
  }, [slots, now, perfectTimingAlarmEnabled])

  useEffect(() => () => {
    for (const timer of alertTimersRef.current.values()) window.clearTimeout(timer)
    alertTimersRef.current.clear()
    alarmStateRef.current = {}
  }, [])

  const clearSlotAlert = (slotId: string) => {
    const timer = alertTimersRef.current.get(slotId)
    if (timer !== undefined) window.clearTimeout(timer)
    alertTimersRef.current.delete(slotId)
    setAlertingSlotIds((current) => current.filter((id) => id !== slotId))
  }

  const ownedIngredients = ingredientData.filter((ingredient) => (state.ingredients[ingredient.id] ?? 0) > 0)

  const handleIngredientClick = (ingredientId: string) => {
    const owned = state.ingredients[ingredientId] ?? 0
    if (owned <= 0) return
    const grillIngredient = grillIngredientById.get(ingredientId)
    if (!grillIngredient) return // 조립 재료(치즈·소스·번 등)는 그릴에 올릴 필요가 없다
    const idleSlot = slots.find((slot) => slot.status === 'idle')
    if (!idleSlot) return // 빈 슬롯 없음

    dispatch({ type: ActionTypes.USE_INGREDIENT, payload: { ingredientId } })
    const adjustedIngredient = {
      ...grillIngredient,
      cookDurationMs: getAdjustedCookDurationMs(
        grillIngredient.cookDurationMs,
        state.upgrades,
      ),
    }
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === idleSlot.id
          ? placeIngredient(slot, adjustedIngredient, Date.now())
          : slot,
      ),
    )
  }

  const handleCollect = (slot: GrillSlot) => {
    if (!slot.ingredientId) return
    clearSlotAlert(slot.id)
    const t = Date.now()
    const result = slot.status === 'burnt' ? 'burnt' : getCookResult(getCookProgress(slot, t))
    dispatch({
      type: ActionTypes.COLLECT_COOKED_INGREDIENT,
      payload: { ingredientId: slot.ingredientId, cookResult: result },
    })
    setSlots((prev) => prev.map((s) => (s.id === slot.id ? clearGrillSlot(s) : s)))
  }

  const selectedStillExists = state.preparedIngredients.some((item) => item.id === selectedPreparedId)
  const readyOrder = state.orders.find((order) => getOrderFulfillment(state, order.id).canServe)

  const handleServeFromPlate = () => {
    if (!selectedStillExists || !readyOrder) return
    dispatch({
      type: ActionTypes.SERVE_ORDER,
      payload: { orderId: readyOrder.id, customerId: readyOrder.customerId },
    })
    setSelectedPreparedId(null)
  }

  const handleDiscardFromPlate = () => {
    if (!selectedStillExists || !selectedPreparedId) return
    dispatch({ type: ActionTypes.DISCARD_PREPARED_INGREDIENT, payload: { preparedId: selectedPreparedId } })
    setSelectedPreparedId(null)
  }

  return (
    <div className="panel cooking-area">
      <div className="cooking-columns">
        <section className="cooking-col cooking-col--stock" aria-label="재료">
          <h4 className="cooking-col-title">재료</h4>
          {ownedIngredients.length === 0 ? (
            <p className="muted cooking-col-empty">구매한 재료가 없습니다.</p>
          ) : (
            <ul className="ingredient-grid">
              {ownedIngredients.map((ingredient) => {
                const grillable = grillIngredientById.has(ingredient.id)
                const grillFull = grillable && !slots.some((slot) => slot.status === 'idle')
                return (
                  <li key={ingredient.id}>
                    <button
                      type="button"
                      className="ingredient-chip"
                      disabled={!grillable || grillFull}
                      onClick={() => handleIngredientClick(ingredient.id)}
                      title={grillable ? `${ingredient.name} · 그릴에 올리기` : `${ingredient.name} · 조립 재료(서빙 시 자동 사용)`}
                    >
                      <span
                        className={`ingredient-chip-icon${INGREDIENT_FOOD_STYLE[ingredient.id] ? ' has-food-image' : ''}`}
                        aria-hidden
                        style={INGREDIENT_FOOD_STYLE[ingredient.id]}
                      >
                        {INGREDIENT_FOOD_STYLE[ingredient.id] ? null : ingredient.icon}
                      </span>
                      <span className="ingredient-chip-count">{state.ingredients[ingredient.id] ?? 0}</span>
                      <span className="visually-hidden">{ingredient.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="cooking-col cooking-col--grill" aria-label="그릴">
          <h4 className="cooking-col-title">
            그릴
            <span className="info-tip">
              <button type="button" className="info-tip-trigger" aria-label="그릴 사용법 보기">
                i
              </button>
              <span className="info-tip-bubble" role="tooltip">
                왼쪽 재료를 클릭하면 빈 슬롯에 올라갑니다. 적절한 타이밍에 슬롯을 클릭해 회수하세요.
              </span>
            </span>
          </h4>
          <GrillSlots
            slots={slots}
            now={now}
            onCollect={handleCollect}
            alertingSlotIds={alertingSlotIds}
          />
        </section>

        <section className="cooking-col cooking-col--plated" aria-label="완성">
          <h4 className="cooking-col-title">완성</h4>
          <ul className="plated-grid">
            {state.preparedIngredients.map((item) => {
              const ingredient = ingredientById.get(item.ingredientId)
              const selected = selectedPreparedId === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`plated-item plated-item--${item.result}${selected ? ' is-selected' : ''}`}
                    onClick={() => setSelectedPreparedId(selected ? null : item.id)}
                    aria-pressed={selected}
                  >
                    <span
                      className={`plated-item-icon${ingredient && INGREDIENT_FOOD_STYLE[ingredient.id] ? ' has-food-image' : ''}`}
                      aria-hidden
                      style={ingredient ? INGREDIENT_FOOD_STYLE[ingredient.id] : undefined}
                    >
                      {ingredient && INGREDIENT_FOOD_STYLE[ingredient.id] ? null : (ingredient?.icon ?? '🍽️')}
                    </span>
                    <span className="visually-hidden">{ingredient?.name ?? item.ingredientId}</span>
                    <small className="plated-item-label">{resultLabels[item.result]}</small>
                  </button>
                </li>
              )
            })}
            <li className="plated-item plated-item--empty" aria-hidden>
              <span className="plated-item-icon">🍽️</span>
            </li>
          </ul>
          <div className="plated-actions">
            <button
              type="button"
              className="plated-action-btn plated-action-btn--serve"
              disabled={!selectedStillExists || !readyOrder}
              onClick={handleServeFromPlate}
              title={readyOrder ? undefined : '서빙 가능한 주문이 없습니다'}
            >
              <span aria-hidden>🍽️</span> 서빙
            </button>
            <button
              type="button"
              className="plated-action-btn plated-action-btn--discard"
              disabled={!selectedStillExists}
              onClick={handleDiscardFromPlate}
            >
              <span aria-hidden>🗑️</span> 폐기
            </button>
          </div>
        </section>
      </div>

      {state.lastServeFeedback ? (
        <div
          key={state.lastServeFeedback.id}
          className="serve-feedback"
          role="status"
          aria-live="polite"
        >
          <strong>주문 완료</strong>
          <span>{state.lastServeFeedback.menuName}</span>
          <b>+₩{state.lastServeFeedback.amount.toLocaleString('ko-KR')}</b>
        </div>
      ) : null}
      <div
        key={alarmAnnouncement.id}
        className="visually-hidden"
        role="status"
        aria-live="assertive"
        aria-atomic="true"
      >
        {alarmAnnouncement.message}
      </div>
    </div>
  )
}
