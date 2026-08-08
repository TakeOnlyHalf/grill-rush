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
                    const ingredientSummary = fulfillment.ingredients
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

                    if (order.status === 'done') {
                      return (
                        <span
                          key={order.id}
                          className="order-menu-slot is-completed"
                          title={`${menu?.name ?? order.menuId} 서빙 완료`}
                        >
                          {menuIcon}
                          <span className="order-menu-complete-mark" aria-hidden>✓</span>
                          <span className="visually-hidden">
                            {menu?.name ?? order.menuId} · 서빙 완료
                          </span>
                        </span>
                      )
                    }

                    return (
                      <button
                        key={order.id}
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
    </div>
  )
}
