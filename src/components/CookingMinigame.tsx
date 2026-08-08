import { useEffect, useRef, useState } from 'react'
import { useGame } from '../state/GameContext'
import {
  collectGrillSlot,
  createIdleGrillSlots,
  getCookProgress,
  getCookResult,
  placeIngredient,
  resolveGrillSlot,
  type GrillSlot,
} from '../grill/grillSlots'
import {
  createAutoAssistReadyState,
  runAutoAssistTick,
  type AutoAssistTimerState,
} from '../grill/autoAssist'
import {
  getAdjustedCookDurationMs,
  getAutoAssistIntervalMs,
  getAutoAssistLevel,
  getGrillSlotCount,
  hasPerfectTimingAlarm,
} from '../grill/grillUpgrades'
import {
  updatePerfectTimingAlarms,
  type PerfectTimingAlarmState,
} from '../grill/perfectTimingAlarm'
import { playPerfectTimingAlarm, playSfx } from '../audio/sfx'
import { grillIngredients } from '../grill/grillIngredients'
import GrillSlots from './GrillSlots'
import { ActionTypes } from '../state/actions'
import {
  getLockedPlatedSlotCount,
  getUnlockedPlatedCapacity,
  groupPlatedIngredients,
  isPlatedTrayFull,
  qualityByResult,
} from '../state/orderFulfillment'
import ingredientData from '../data/ingredients.json'
import menuData from '../data/menus.json'
import { INGREDIENT_FOOD_STYLE, MENU_FOOD_STYLE } from '../utils/foodIcons'
import { getIngredientCapacity } from '../utils/ingredientStorage'

const ingredientById = new Map(ingredientData.map((ingredient) => [ingredient.id, ingredient]))
const menuById = new Map(menuData.map((menu) => [menu.id, menu]))
const grillIngredientById = new Map(grillIngredients.map((ingredient) => [ingredient.id, ingredient]))

const resultLabels = { good: '좋음', perfect: '완벽', danger: '아슬아슬' } as const
const PERFECT_TIMING_ALERT_DURATION_MS = 1_000
const AUTO_COLLECT_FEEDBACK_DURATION_MS = 1_300

function withObjectParticle(value: string): string {
  const lastCodePoint = value.codePointAt(value.length - 1)
  if (lastCodePoint === undefined || lastCodePoint < 0xac00 || lastCodePoint > 0xd7a3) {
    return `${value}을`
  }
  return `${value}${(lastCodePoint - 0xac00) % 28 === 0 ? '를' : '을'}`
}

/**
 * 조리 미니게임 컨테이너 — 재료 / 그릴 / 완성 3분할(1:1.5:1) 레이아웃.
 * 그릴 슬롯은 기존 grillSlots 로직(GrillSlot 상태·조리 진행률·판정)을 그대로 쓰되
 * PixiJS 대신 DOM 카드(원형 타이머)로 그린다. 재료 클릭 → USE_INGREDIENT + 첫 빈 슬롯 배치,
 * 슬롯 클릭 → COLLECT_COOKED_INGREDIENT + 슬롯 비우기로 기존 리듀서 액션을 그대로 재사용한다.
 */
export default function CookingMinigame() {
  const { state, dispatch } = useGame()
  const perfectTimingAlarmEnabled = hasPerfectTimingAlarm(state.upgrades)
  const autoAssistLevel = getAutoAssistLevel(state.upgrades)
  const autoCollectIntervalMs = getAutoAssistIntervalMs(state.upgrades)
  const [slots, setSlots] = useState<GrillSlot[]>(() =>
    createIdleGrillSlots(getGrillSlotCount(state.upgrades)),
  )
  const slotsRef = useRef(slots)
  const preparedIngredientsRef = useRef(state.preparedIngredients)
  const upgradesRef = useRef(state.upgrades)
  preparedIngredientsRef.current = state.preparedIngredients
  upgradesRef.current = state.upgrades
  const [now, setNow] = useState(() => Date.now())
  const [selectedPreparedIds, setSelectedPreparedIds] = useState<string[]>([])
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null)
  const [alertingSlotIds, setAlertingSlotIds] = useState<string[]>([])
  const [alarmAnnouncement, setAlarmAnnouncement] = useState({ id: 0, message: '' })
  const [autoCollectFeedback, setAutoCollectFeedback] = useState<{
    id: number
    message: string
  } | null>(null)
  const alarmStateRef = useRef<PerfectTimingAlarmState>({})
  const alertTimersRef = useRef(new Map<string, number>())
  const autoCollectFeedbackTimerRef = useRef<number | null>(null)
  const autoAssistTimerRef = useRef<AutoAssistTimerState>(
    createAutoAssistReadyState(autoCollectIntervalMs, Date.now()),
  )

  useEffect(() => {
    autoAssistTimerRef.current = createAutoAssistReadyState(
      autoCollectIntervalMs,
      Date.now(),
    )
    const id = setInterval(() => {
      const t = Date.now()
      const resolvedSlots = slotsRef.current.map((slot) => resolveGrillSlot(slot, t))
      const trayFull = isPlatedTrayFull(
        preparedIngredientsRef.current,
        upgradesRef.current,
      )
      const autoAssistTick = runAutoAssistTick(
        resolvedSlots,
        t,
        trayFull ? null : autoCollectIntervalMs,
        autoAssistTimerRef.current,
        typeof document === 'undefined' || document.visibilityState === 'visible',
      )
      autoAssistTimerRef.current = autoAssistTick.timer
      slotsRef.current = autoAssistTick.slots
      setNow(t)
      setSlots(autoAssistTick.slots)

      if (!autoAssistTick.collected) return
      const alertTimer = alertTimersRef.current.get(autoAssistTick.collected.slotId)
      if (alertTimer !== undefined) window.clearTimeout(alertTimer)
      alertTimersRef.current.delete(autoAssistTick.collected.slotId)
      setAlertingSlotIds((current) =>
        current.filter((id) => id !== autoAssistTick.collected?.slotId)
      )
      dispatch({
        type: ActionTypes.COLLECT_COOKED_INGREDIENT,
        payload: {
          ingredientId: autoAssistTick.collected.ingredientId,
          cookResult: autoAssistTick.collected.result,
        },
      })

      const ingredientName = ingredientById.get(autoAssistTick.collected.ingredientId)?.name
        ?? autoAssistTick.collected.ingredientId
      setAutoCollectFeedback((current) => ({
        id: (current?.id ?? 0) + 1,
        message: `🤖 조리 보조: ${withObjectParticle(ingredientName)} 자동 회수했습니다.`,
      }))
      if (autoCollectFeedbackTimerRef.current !== null) {
        window.clearTimeout(autoCollectFeedbackTimerRef.current)
      }
      autoCollectFeedbackTimerRef.current = window.setTimeout(() => {
        setAutoCollectFeedback(null)
        autoCollectFeedbackTimerRef.current = null
      }, AUTO_COLLECT_FEEDBACK_DURATION_MS)
    }, 200)
    return () => clearInterval(id)
  }, [autoCollectIntervalMs, dispatch])

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
    if (autoCollectFeedbackTimerRef.current !== null) {
      window.clearTimeout(autoCollectFeedbackTimerRef.current)
      autoCollectFeedbackTimerRef.current = null
    }
  }, [])

  const clearSlotAlert = (slotId: string) => {
    const timer = alertTimersRef.current.get(slotId)
    if (timer !== undefined) window.clearTimeout(timer)
    alertTimersRef.current.delete(slotId)
    setAlertingSlotIds((current) => current.filter((id) => id !== slotId))
  }

  const ownedIngredients = ingredientData.filter((ingredient) => (state.ingredients[ingredient.id] ?? 0) > 0)
  const stockGaugeMax = Math.max(1, getIngredientCapacity(state.upgrades))

  const handleIngredientClick = (ingredientId: string) => {
    const owned = state.ingredients[ingredientId] ?? 0
    if (owned <= 0) return
    setSelectedStockId(ingredientId)
    const grillIngredient = grillIngredientById.get(ingredientId)
    if (!grillIngredient) return // 조립 재료(치즈·소스·번 등)는 그릴에 올릴 필요가 없다
    const idleSlot = slotsRef.current.find((slot) => slot.status === 'idle')
    if (!idleSlot) return // 빈 슬롯 없음

    dispatch({ type: ActionTypes.USE_INGREDIENT, payload: { ingredientId } })
    playSfx('grill_sound')
    const adjustedIngredient = {
      ...grillIngredient,
      cookDurationMs: getAdjustedCookDurationMs(
        grillIngredient.cookDurationMs,
        state.upgrades,
      ),
    }
    const nextSlots = slotsRef.current.map((slot) =>
      slot.id === idleSlot.id
        ? placeIngredient(slot, adjustedIngredient, Date.now())
        : slot,
    )
    slotsRef.current = nextSlots
    setSlots(nextSlots)
  }

  const handleCollect = (slot: GrillSlot) => {
    const nowMs = Date.now()
    const progress = getCookProgress(slot, nowMs)
    const cookResult = slot.status === 'burnt' ? 'burnt' : getCookResult(progress)
    // 완성 트레이가 가득 차면 서빙 가능 결과는 회수하지 않는다. 탄 재료는 치울 수 있다.
    if (
      cookResult !== 'burnt' &&
      cookResult !== 'raw' &&
      isPlatedTrayFull(state.preparedIngredients, state.upgrades)
    ) {
      return
    }

    const result = collectGrillSlot(slotsRef.current, slot, nowMs)
    if (!result.collected) return
    clearSlotAlert(slot.id)
    if (result.collected.result !== 'burnt') playSfx('cooking_done')
    dispatch({
      type: ActionTypes.COLLECT_COOKED_INGREDIENT,
      payload: {
        ingredientId: result.collected.ingredientId,
        cookResult: result.collected.result,
      },
    })
    slotsRef.current = result.slots
    setSlots(result.slots)
  }

  const selectedStillExists =
    selectedPreparedIds.length > 0 &&
    selectedPreparedIds.every((id) => state.preparedIngredients.some((item) => item.id === id))
  const platedDisplayItems = groupPlatedIngredients(state.preparedIngredients)
  const unlockedPlatedCapacity = getUnlockedPlatedCapacity(state.upgrades)
  const lockedPlatedSlotCount = getLockedPlatedSlotCount(state.upgrades)
  const emptyPlatedSlotCount = Math.max(0, unlockedPlatedCapacity - platedDisplayItems.length)

  const handleDiscardFromPlate = () => {
    if (!selectedStillExists) return
    playSfx('button_secondary')
    selectedPreparedIds.forEach((preparedId) => {
      dispatch({ type: ActionTypes.DISCARD_PREPARED_INGREDIENT, payload: { preparedId } })
    })
    setSelectedPreparedIds([])
  }

  return (
    <div className="panel cooking-area">
      <div className="cooking-columns">
        <section className="cooking-col cooking-col--stock" aria-label="재료 준비대">
          <h4 className="cooking-col-title">재료 준비대</h4>
          {ownedIngredients.length === 0 ? (
            <p className="muted cooking-col-empty">구매한 재료가 없습니다.</p>
          ) : (
            <ul className="ingredient-grid">
              {ownedIngredients.map((ingredient) => {
                const count = state.ingredients[ingredient.id] ?? 0
                const grillable = grillIngredientById.has(ingredient.id)
                const grillFull = grillable && !slots.some((slot) => slot.status === 'idle')
                const selected = selectedStockId === ingredient.id
                const gaugeRatio = Math.max(0, Math.min(1, count / stockGaugeMax))
                return (
                  <li key={ingredient.id}>
                    <button
                      type="button"
                      className={`ingredient-chip${selected ? ' is-selected' : ''}`}
                      disabled={grillable && grillFull}
                      onClick={() => handleIngredientClick(ingredient.id)}
                      aria-pressed={selected}
                      title={
                        grillable
                          ? `${ingredient.name} · 그릴에 올리기`
                          : `${ingredient.name} · 조립 재료(서빙 시 자동 사용)`
                      }
                    >
                      <span
                        className={`ingredient-chip-icon${INGREDIENT_FOOD_STYLE[ingredient.id] ? ' has-food-image' : ''}`}
                        aria-hidden
                        style={INGREDIENT_FOOD_STYLE[ingredient.id]}
                      >
                        {INGREDIENT_FOOD_STYLE[ingredient.id] ? null : ingredient.icon}
                      </span>
                      <span className="ingredient-chip-meta">
                        <span className="ingredient-chip-name">{ingredient.name}</span>
                        <span className="ingredient-chip-count">x{count}</span>
                        <span
                          className="ingredient-chip-gauge"
                          aria-hidden
                        >
                          <span
                            className="ingredient-chip-gauge-fill"
                            style={{ width: `${gaugeRatio * 100}%` }}
                          />
                        </span>
                      </span>
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
          {autoCollectIntervalMs !== null ? (
            <p className="grill-auto-assist-status">
              조리 보조 Lv.{autoAssistLevel} · 회수 후 {autoCollectIntervalMs / 1_000}초 재사용 대기
            </p>
          ) : null}
          <GrillSlots
            slots={slots}
            now={now}
            onCollect={handleCollect}
            alertingSlotIds={alertingSlotIds}
          />
        </section>

        <section className="cooking-col cooking-col--plated" aria-label="완성">
          <h4 className="cooking-col-title cooking-col-title--plated">
            <span>완성</span>
            <button
              type="button"
              className="plated-discard-btn"
              disabled={!selectedStillExists}
              onClick={handleDiscardFromPlate}
              title={selectedStillExists ? '선택한 완성 음식 폐기' : '폐기할 음식을 선택하세요'}
            >
              폐기
            </button>
          </h4>
          <ul className="plated-grid">
            {platedDisplayItems.map((displayItem) => {
              if (displayItem.kind === 'combo') {
                const menu = menuById.get(displayItem.menuId)
                const ids = displayItem.items.map((entry) => entry.id)
                const selected = ids.every((id) => selectedPreparedIds.includes(id))
                const worstResult = displayItem.items.reduce((worst, current) =>
                  qualityByResult[current.result] < qualityByResult[worst.result] ? current : worst,
                ).result
                return (
                  <li key={ids.join('+')}>
                    <button
                      type="button"
                      className={`plated-item plated-item--${worstResult}${selected ? ' is-selected' : ''}`}
                      onClick={() => {
                        playSfx('menu_select')
                        setSelectedPreparedIds(selected ? [] : ids)
                      }}
                      aria-pressed={selected}
                    >
                      <span
                        className={`plated-item-icon${menu && MENU_FOOD_STYLE[menu.id] ? ' has-food-image' : ''}`}
                        aria-hidden
                        style={menu ? MENU_FOOD_STYLE[menu.id] : undefined}
                      >
                        {menu && MENU_FOOD_STYLE[menu.id] ? null : (menu?.icon ?? '🍽️')}
                      </span>
                      <span className="visually-hidden">{menu?.name ?? displayItem.menuId}</span>
                      <small className="plated-item-label">{resultLabels[worstResult]}</small>
                    </button>
                  </li>
                )
              }

              const item = displayItem.item
              const ingredient = ingredientById.get(item.ingredientId)
              const selected = selectedPreparedIds.length === 1 && selectedPreparedIds[0] === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`plated-item plated-item--${item.result}${selected ? ' is-selected' : ''}`}
                    onClick={() => {
                      playSfx('menu_select')
                      setSelectedPreparedIds(selected ? [] : [item.id])
                    }}
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
            {Array.from({ length: emptyPlatedSlotCount }, (_, index) => (
                <li key={`plated-empty-${index}`} aria-hidden>
                  <div className="plated-item plated-item--empty">
                    <span className="plated-item-icon">🍽️</span>
                  </div>
                </li>
              ),
            )}
            {Array.from({ length: lockedPlatedSlotCount }, (_, index) => (
              <li key={`plated-locked-${index}`}>
                <div
                  className="plated-item plated-item--locked"
                  title="업그레이드로 해금됩니다"
                  aria-label="잠긴 완성 칸 · 업그레이드로 해금"
                >
                  <span className="plated-item-lock-icon" aria-hidden>
                    🔒
                  </span>
                  <small className="plated-item-lock-label">잠김</small>
                </div>
              </li>
            ))}
          </ul>
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
      {autoCollectFeedback ? (
        <div
          key={autoCollectFeedback.id}
          className="auto-collect-feedback"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {autoCollectFeedback.message}
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
