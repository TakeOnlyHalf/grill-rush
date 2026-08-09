import { useEffect, useRef, useState } from 'react'
import ingredientData from '../data/ingredients.json'
import menus from '../data/menus.json'
import { playSfx } from '../audio/sfx'
import { ActionTypes } from '../state/actions'
import { useGame } from '../state/GameContext'
import {
  getOrderFulfillment,
  type OrderIngredientProgress,
} from '../state/orderFulfillment'
import {
  createServeAssistReadyState,
  runServeAssistTick,
  type ServeAssistTimerState,
} from '../grill/serveAssist'
import {
  getServeAssistIntervalMs,
  getServeAssistLevel,
} from '../grill/grillUpgrades'
import {
  AVATAR_BACKGROUND_SIZE,
  getAvatarBackgroundPosition,
  loadAvatarSheetDataUrl,
  pickStablePortrait,
} from '../utils/portraitSprite'
import { INGREDIENT_FOOD_STYLE, MENU_FOOD_STYLE } from '../utils/foodIcons'

const ingredientById = new Map(ingredientData.map((ingredient) => [ingredient.id, ingredient]))
const menuById = new Map(menus.map((menu) => [menu.id, menu]))
const SERVE_ASSIST_FEEDBACK_MS = 1_300

function menuIngredientRows(
  menu: (typeof menus)[number] | undefined,
  fulfillmentIngredients: OrderIngredientProgress[],
  completed: boolean,
): OrderIngredientProgress[] {
  if (fulfillmentIngredients.length > 0) return fulfillmentIngredients
  if (!menu) return []

  const counts = new Map<string, number>()
  for (const ingredientId of menu.ingredients) {
    counts.set(ingredientId, (counts.get(ingredientId) ?? 0) + 1)
  }

  return [...counts].map(([ingredientId, required]) => {
    const ingredient = ingredientById.get(ingredientId)
    return {
      ingredientId,
      name: ingredient?.name ?? ingredientId,
      icon: ingredient?.icon ?? '🍽️',
      required,
      prepared: completed ? required : 0,
      assembly: (ingredient?.grillSec ?? 0) === 0,
    }
  })
}

/** 대기열 표시 — 손님별 주문 카드(초상화+메뉴 아이콘+인내심 타이머), 재료가 갖춰지면 클릭해서 서빙 */
export default function CustomerQueue() {
  const { state, dispatch } = useGame()
  const [avatarSheetUrl, setAvatarSheetUrl] = useState<string | null>(null)
  const serveAssistLevel = getServeAssistLevel(state.upgrades)
  const serveAssistIntervalMs = getServeAssistIntervalMs(state.upgrades)
  const stateRef = useRef(state)
  stateRef.current = state
  const serveAssistTimerRef = useRef<ServeAssistTimerState>(
    createServeAssistReadyState(serveAssistIntervalMs, Date.now()),
  )
  const [serveAssistFeedback, setServeAssistFeedback] = useState<{
    id: number
    message: string
  } | null>(null)
  const serveAssistFeedbackTimerRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    loadAvatarSheetDataUrl().then((url) => {
      if (!cancelled) setAvatarSheetUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    serveAssistTimerRef.current = createServeAssistReadyState(
      serveAssistIntervalMs,
      Date.now(),
    )
    if (serveAssistIntervalMs === null) return undefined

    const id = window.setInterval(() => {
      const now = Date.now()
      const tick = runServeAssistTick(
        stateRef.current,
        now,
        serveAssistIntervalMs,
        serveAssistTimerRef.current,
        typeof document === 'undefined' || document.visibilityState === 'visible',
      )
      serveAssistTimerRef.current = tick.timer
      if (!tick.target) return

      dispatch({
        type: ActionTypes.SERVE_ORDER,
        payload: {
          orderId: tick.target.orderId,
          customerId: tick.target.customerId,
        },
      })
      playSfx('serve_dish')

      const menuName = menuById.get(tick.target.menuId)?.name ?? tick.target.menuId
      setServeAssistFeedback((current) => ({
        id: (current?.id ?? 0) + 1,
        message: `🤖 서빙 보조: ${menuName} 주문을 자동 제공했습니다.`,
      }))
      if (serveAssistFeedbackTimerRef.current !== null) {
        window.clearTimeout(serveAssistFeedbackTimerRef.current)
      }
      serveAssistFeedbackTimerRef.current = window.setTimeout(() => {
        setServeAssistFeedback(null)
        serveAssistFeedbackTimerRef.current = null
      }, SERVE_ASSIST_FEEDBACK_MS)
    }, 200)

    return () => {
      window.clearInterval(id)
      if (serveAssistFeedbackTimerRef.current !== null) {
        window.clearTimeout(serveAssistFeedbackTimerRef.current)
        serveAssistFeedbackTimerRef.current = null
      }
    }
  }, [dispatch, serveAssistIntervalMs])

  return (
    <div className="queue-strip-panel">
      <h3 className="queue-strip-title">
        대기 주문 {state.customers.length}
        {serveAssistIntervalMs !== null ? (
          <span className="queue-serve-assist-status">
            {' '}· 서빙 보조 Lv.{serveAssistLevel} · {serveAssistIntervalMs / 1_000}초
          </span>
        ) : null}
      </h3>
      {state.customers.length === 0 ? (
        <p className="muted">손님이 아직 없습니다.</p>
      ) : (
        <ul className="queue-list">
          {state.customers.map((c, index) => {
            const customerOrders = state.orders.filter(
              (candidate) => candidate.customerId === c.id,
            )
            const orderItems = customerOrders.map((order) => ({
              order,
              menu: menus.find((candidate) => candidate.id === order.menuId),
              fulfillment: getOrderFulfillment(state, order.id),
            }))
            const canServe = orderItems.some((item) => item.fulfillment.canServe)
            const patiencePct = (c.patience / c.maxPatience) * 100
            const patienceState = patiencePct < 30 ? 'is-danger' : patiencePct < 60 ? 'is-warning' : ''
            const portraitKey = pickStablePortrait(c.type, c.id)

            return (
              <li key={c.id} className={`order-queue-card${canServe ? ' is-serveable' : ''}`}>
                <span className="order-queue-badge">{index + 1}</span>
                <div className="order-queue-top-row">
                  <span
                    className="order-queue-portrait"
                    aria-hidden
                    style={portraitKey && avatarSheetUrl
                      ? {
                        backgroundImage: `url(${avatarSheetUrl})`,
                        backgroundPosition: getAvatarBackgroundPosition(portraitKey),
                        backgroundSize: AVATAR_BACKGROUND_SIZE,
                      }
                      : undefined}
                  >
                    {portraitKey && avatarSheetUrl ? null : c.icon}
                  </span>
                  {orderItems.map(({ order, menu, fulfillment }) => {
                    const completed = order.status === 'done'
                    const ingredients = menuIngredientRows(
                      menu,
                      fulfillment.ingredients,
                      completed,
                    )
                    const ingredientSummary = ingredients
                      .map((ingredient) => `${ingredient.name} ${ingredient.prepared}/${ingredient.required}`)
                      .join(', ')
                    const menuIcon = (
                      <span
                        className={`order-queue-menu-icon${menu && MENU_FOOD_STYLE[menu.id] ? ' has-food-image' : ''}`}
                        aria-hidden
                        style={menu ? MENU_FOOD_STYLE[menu.id] : undefined}
                      >
                        {menu && MENU_FOOD_STYLE[menu.id] ? null : (menu?.icon ?? '🍽️')}
                      </span>
                    )
                    const ingredientRow = (
                      <ul className="order-menu-ingredients" aria-hidden={completed}>
                        {ingredients.map((ingredient) => {
                          const ready = ingredient.prepared >= ingredient.required
                          const foodStyle = INGREDIENT_FOOD_STYLE[ingredient.ingredientId]
                          return (
                            <li
                              key={ingredient.ingredientId}
                              className={`order-menu-ingredient${ready ? ' is-ready' : ''}`}
                              title={`${ingredient.name} ${ingredient.prepared}/${ingredient.required}`}
                            >
                              <span
                                className={`order-menu-ingredient-icon${foodStyle ? ' has-food-image' : ''}`}
                                style={foodStyle}
                              >
                                {foodStyle ? null : ingredient.icon}
                              </span>
                              {ingredient.required > 1 ? (
                                <span className="order-menu-ingredient-count">×{ingredient.required}</span>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    )

                    if (completed) {
                      return (
                        <div key={order.id} className="order-menu-column">
                          <span
                            className="order-menu-slot is-completed"
                            title={`${menu?.name ?? order.menuId} 서빙 완료`}
                          >
                            {menuIcon}
                            <span className="order-menu-complete-mark" aria-hidden>✓</span>
                            <span className="visually-hidden">
                              {menu?.name ?? order.menuId} · 서빙 완료
                            </span>
                          </span>
                          {ingredientRow}
                        </div>
                      )
                    }

                    return (
                      <div key={order.id} className="order-menu-column">
                        <button
                          type="button"
                          className={`order-menu-slot order-menu-button${fulfillment.canServe ? ' is-serveable' : ''}`}
                          disabled={!fulfillment.canServe}
                          title={fulfillment.canServe
                            ? `${menu?.name ?? order.menuId} 서빙 가능 · 클릭해서 제공`
                            : `${menu?.name ?? order.menuId} 필요 재료: ${ingredientSummary}`}
                          onClick={() => dispatch({
                            type: ActionTypes.SERVE_ORDER,
                            payload: { orderId: order.id, customerId: c.id },
                          })}
                        >
                          {menuIcon}
                          <span className="visually-hidden">
                            {menu?.name ?? order.menuId}
                            {fulfillment.canServe ? ' · 서빙 가능' : ` · 필요 재료: ${ingredientSummary}`}
                          </span>
                        </button>
                        {ingredientRow}
                      </div>
                    )
                  })}
                </div>
                <div className={`patience-bar ${patienceState}`}>
                  <div className={patienceState} style={{ width: `${patiencePct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {state.lastCustomerLeaveFeedback ? (
        <div key={state.lastCustomerLeaveFeedback.id} className="leave-feedback" role="status">
          {state.lastCustomerLeaveFeedback.customerName} 손님이 기다리다 떠났습니다.
        </div>
      ) : null}
      {serveAssistFeedback ? (
        <div
          key={serveAssistFeedback.id}
          className="auto-collect-feedback"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {serveAssistFeedback.message}
        </div>
      ) : null}
    </div>
  )
}
