import ReviewCard from '../components/ReviewCard'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { calcDailyProfit } from '../state/formulas'

/**
 * 정산 페이즈
 * TODO: 차트, 전일 대비, 리뷰 리스트 상세
 */
export default function SettlePhase() {
  const { state, dispatch } = useGame()
  const { dailyCosts: costs } = state
  const totalCost =
    (costs.ingredients ?? 0) +
    (costs.rent ?? 0) +
    (costs.waste ?? 0) +
    (costs.truck ?? 0)
  const profit = calcDailyProfit({
    sales: state.dailySales,
    tips: state.dailyTips,
    costs,
  })

  return (
    <section className="phase phase-settle">
      <header className="phase-header">
        <h2>오늘의 결산</h2>
        <p>Day {state.day} 영업 결과</p>
      </header>

      <div className="settle-grid panel">
        <Row label="매출" value={state.dailySales} />
        <Row label="팁" value={state.dailyTips} />
        <Row label="재료비" value={costs.ingredients} negative />
        <Row label="자릿세" value={costs.rent} negative />
        <Row label="폐기" value={costs.waste} negative />
        <Row label="트럭 유지비" value={costs.truck} negative />
        <hr />
        <Row label="비용 합계" value={totalCost} negative />
        <Row label="순이익" value={profit} emphasize />
      </div>

      <div className="settle-stats">
        <span>손님 {state.dailyServed}명</span>
        <span>이탈 {state.dailyLeft}명</span>
        <span>
          리뷰 ★
          {state.dailyReviews.length
            ? (
                state.dailyReviews.reduce((a, b) => a + b, 0) /
                state.dailyReviews.length
              ).toFixed(1)
            : '—'}
        </span>
      </div>

      <ReviewCard reviews={state.dailyReviews} />

      <p className="todo-note">
        TODO: 실제 영업 로직 연결 후 매출·리뷰가 채워집니다. 지금은 0으로 통과 가능.
      </p>

      <footer className="phase-footer">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => dispatch({ type: ActionTypes.CONFIRM_SETTLE })}
        >
          성장 화면으로 ▶
        </button>
      </footer>
    </section>
  )
}

function Row({
  label,
  value,
  negative,
  emphasize,
}: {
  label: string
  value?: number
  negative?: boolean
  emphasize?: boolean
}) {
  const n = value ?? 0
  return (
    <div className={`settle-row${emphasize ? ' emphasize' : ''}`}>
      <span>{label}</span>
      <span>
        {negative && n > 0 ? '−' : ''}
        {Math.abs(n).toLocaleString('ko-KR')}원
      </span>
    </div>
  )
}
