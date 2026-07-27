import { useGameState } from '../state/GameContext'
import { getMenuById } from '../state/formulas'

function patienceLevel(ratio: number): string {
  if (ratio > 0.5) return ''
  if (ratio > 0.25) return 'is-warning'
  return 'is-danger'
}

/** 대기열 표시 — 손님별 주문 카드 + 인내심 게이지(임계치에 따라 색상 경고) */
export default function CustomerQueue() {
  const state = useGameState()

  return (
    <div className="panel">
      <h3>대기열</h3>
      {state.customers.length === 0 ? (
        <p className="muted">손님이 아직 없습니다.</p>
      ) : (
        <ul className="queue-list">
          {state.customers.map((c) => {
            const menu = getMenuById(c.orderMenuId)
            const ratio = c.patience / c.maxPatience

            return (
              <li key={c.id} className="queue-card">
                <span className="queue-card-badge">{c.icon}</span>
                <div className="queue-card-body">
                  <div className="queue-card-title">{c.typeName}</div>
                  <div className="queue-card-order">
                    {menu?.icon ?? '🍽️'} {c.orderName}
                    {menu ? ` · ₩${menu.basePrice.toLocaleString('ko-KR')}` : ''}
                  </div>
                  <div className="patience-bar">
                    <div
                      className={patienceLevel(ratio)}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
