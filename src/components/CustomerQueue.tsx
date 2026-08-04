import { useEffect, useState } from 'react'
import menus from '../data/menus.json'
import { ActionTypes } from '../state/actions'
import { useGame } from '../state/GameContext'
import { getOrderFulfillment } from '../state/orderFulfillment'
import {
  AVATAR_BACKGROUND_SIZE,
  getAvatarBackgroundPosition,
  loadAvatarSheetDataUrl,
  pickStablePortrait,
} from '../utils/portraitSprite'
import { MENU_FOOD_STYLE } from '../utils/foodIcons'

/** 대기열 표시 — 손님별 주문 카드(초상화+메뉴 아이콘+인내심 타이머), 재료가 갖춰지면 클릭해서 서빙 */
export default function CustomerQueue() {
  const { state, dispatch } = useGame()
  const [avatarSheetUrl, setAvatarSheetUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadAvatarSheetDataUrl().then((url) => {
      if (!cancelled) setAvatarSheetUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="queue-strip-panel">
      <h3 className="queue-strip-title">대기 주문 {state.customers.length}</h3>
      {state.customers.length === 0 ? (
        <p className="muted">손님이 아직 없습니다.</p>
      ) : (
        <ul className="queue-list">
          {state.customers.map((c, index) => {
            const order = state.orders.find((candidate) => candidate.customerId === c.id)
            const menu = menus.find((candidate) => candidate.id === order?.menuId)
            const fulfillment = order
              ? getOrderFulfillment(state, order.id)
              : { canServe: false, ingredients: [] }
            const patiencePct = (c.patience / c.maxPatience) * 100
            const patienceState = patiencePct < 30 ? 'is-danger' : patiencePct < 60 ? 'is-warning' : ''
            const portraitKey = pickStablePortrait(c.type, c.id)
            const ingredientSummary = fulfillment.ingredients
              .map((ingredient) => `${ingredient.name} ${ingredient.prepared}/${ingredient.required}`)
              .join(', ')

            return (
              <li key={c.id} className={`order-queue-card${fulfillment.canServe ? ' is-serveable' : ''}`}>
                <span className="order-queue-badge">{index + 1}</span>
                <div className="order-queue-top-row">
                  {portraitKey && avatarSheetUrl && (
                    <span
                      className="order-queue-portrait"
                      aria-hidden
                      style={{
                        backgroundImage: `url(${avatarSheetUrl})`,
                        backgroundPosition: getAvatarBackgroundPosition(portraitKey),
                        backgroundSize: AVATAR_BACKGROUND_SIZE,
                      }}
                    />
                  )}
                  <button
                    type="button"
                    className="order-combination"
                    disabled={!fulfillment.canServe || !order}
                    title={fulfillment.canServe ? '서빙 가능 · 클릭해서 제공' : `필요 재료: ${ingredientSummary}`}
                    onClick={() => {
                      if (!order) return
                      dispatch({ type: ActionTypes.SERVE_ORDER, payload: { orderId: order.id, customerId: c.id } })
                    }}
                  >
                    <span
                      className={`order-queue-menu-icon${menu && MENU_FOOD_STYLE[menu.id] ? ' has-food-image' : ''}`}
                      aria-hidden
                      style={menu ? MENU_FOOD_STYLE[menu.id] : undefined}
                    >
                      {menu && MENU_FOOD_STYLE[menu.id] ? null : (menu?.icon ?? '🍽️')}
                    </span>
                    <span className="visually-hidden">
                      {c.typeName} → {c.orderName}
                      {fulfillment.canServe ? ' · 서빙 가능' : ` · 필요 재료: ${ingredientSummary}`}
                    </span>
                  </button>
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
    </div>
  )
}
