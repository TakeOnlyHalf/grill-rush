import { useGameState } from '../state/GameContext'
import { getMenuById } from '../state/formulas'

function patienceLevel(ratio: number): string {
  if (ratio > 0.5) return ''
  if (ratio > 0.25) return 'is-warning'
  return 'is-danger'
}

/** 대기열 표시 — 거리 뷰의 번호 배지와 같은 순서로 매긴 주문 카드 스트립 */
export default function CustomerQueue() {
  const state = useGameState()

  return (
    <div className="queue-strip-panel">
      <h3 className="queue-strip-title">대기 주문 {state.customers.length}</h3>
      {state.customers.length === 0 ? (
        <p className="muted">손님이 아직 없습니다.</p>
      ) : (
        <ol className="queue-strip">
          {state.customers.map((c, i) => {
            const menu = getMenuById(c.orderMenuId)
            const ratio = c.patience / c.maxPatience
            const level = patienceLevel(ratio)

            return (
              <li key={c.id} className={`queue-chip ${level}`}>
                <span className="queue-chip-index">{i + 1}</span>
                <div className="queue-chip-art">
                  <span className="queue-chip-face">{c.icon}</span>
                  <span className="queue-chip-dish">{menu?.icon ?? '🍽️'}</span>
                </div>
                <div className="queue-chip-order">{c.orderName}</div>
                <div className="queue-chip-timer">
                  {level === 'is-danger' && <span className="queue-chip-warn">⚠</span>}
                  <span className="queue-chip-time">{Math.ceil(c.patience)}s</span>
                </div>
                <div className="patience-bar">
                  <div className={level} style={{ width: `${ratio * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
