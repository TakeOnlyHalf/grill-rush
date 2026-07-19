import { useGameState } from '../state/GameContext.jsx'

/** 대기열 표시 — TODO: patience 게이지, 이탈 연출 */
export default function CustomerQueue() {
  const state = useGameState()

  return (
    <div className="panel">
      <h3>대기열</h3>
      {state.customers.length === 0 ? (
        <p className="muted">손님이 아직 없습니다. (스폰 로직 연결 필요)</p>
      ) : (
        <ul className="queue-list">
          {state.customers.map((c) => (
            <li key={c.id}>
              {c.icon} {c.typeName} → {c.orderName}
              <div className="patience-bar">
                <div
                  style={{
                    width: `${(c.patience / c.maxPatience) * 100}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
