import menus from '../data/menus.json'
import { ActionTypes } from '../state/actions'
import { useGame } from '../state/GameContext'
import { getOrderFulfillment } from '../state/orderFulfillment'

/** 대기열 표시 — TODO: patience 게이지, 이탈 연출 */
export default function CustomerQueue() {
  const { state, dispatch } = useGame()

  return (
    <div className="panel">
      <h3>대기열</h3>
      {state.customers.length === 0 ? (
        <p className="muted">손님이 아직 없습니다.</p>
      ) : (
        <ul className="queue-list">
          {state.customers.map((c) => {
            const order = state.orders.find((candidate) => candidate.customerId === c.id)
            const menu = menus.find((candidate) => candidate.id === order?.menuId)
            const fulfillment = order
              ? getOrderFulfillment(state, order.id)
              : { canServe: false, ingredients: [] }
            return (
            <li key={c.id} className={`order-queue-card${fulfillment.canServe ? ' is-serveable' : ''}`}>
              <div className="order-customer">
                <span>{c.icon}</span>
                <strong>{c.typeName}</strong>
                <span>→ {menu?.icon} {c.orderName}</span>
              </div>
              <button
                type="button"
                className="order-combination"
                disabled={!fulfillment.canServe || !order}
                onClick={() => {
                  if (!order) return
                  dispatch({ type: ActionTypes.SERVE_ORDER, payload: { orderId: order.id, customerId: c.id } })
                }}
              >
                <span className="order-combination-label">
                  {fulfillment.canServe ? '서빙 가능 · 클릭해서 제공' : '필요 재료'}
                </span>
                <span className="order-ingredients">
                  {fulfillment.ingredients.map((ingredient) => (
                    <span key={ingredient.ingredientId}>
                      {ingredient.icon} {ingredient.name} <b>{ingredient.prepared}/{ingredient.required}</b>
                    </span>
                  ))}
                </span>
              </button>
              <div className="patience-bar">
                <div
                  style={{
                    width: `${(c.patience / c.maxPatience) * 100}%`,
                  }}
                />
              </div>
            </li>
          )})}
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
