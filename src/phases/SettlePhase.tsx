import { useMemo } from 'react'
import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { calcDailyProfit } from '../state/formulas'
import { generateReviewText } from '../utils/reviewGenerator'
import {
  NET_LOSS_ICON,
  NET_NEUTRAL_ICON,
  NET_PROFIT_ICON,
  TODAY_CALC_BG,
} from '../utils/assets'

function netProfitIcon(profit: number): string {
  if (profit < 0) return NET_LOSS_ICON
  if (profit > 0) return NET_PROFIT_ICON
  return NET_NEUTRAL_ICON
}

function formatWon(n: number, signed = false): string {
  const abs = Math.abs(n).toLocaleString('ko-KR')
  if (!signed) return `₩${abs}`
  if (n < 0) return `−₩${abs}`
  if (n > 0) return `+₩${abs}`
  return `₩${abs}`
}

function profitCaption(profit: number, day: number): string {
  if (profit < 0) {
    return day <= 1 ? '첫날은 투자가 필요한 법이에요' : '내일은 더 잘할 수 있어요'
  }
  if (profit > 0) return '괜찮은 하루였어요!'
  return '본전으로 마무리했네요'
}

/**
 * 정산 페이즈 — today_calc.webp 보드 위에 수치·리뷰를 오버레이
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

  const reviewAvg = useMemo(() => {
    if (!state.dailyReviews.length) return null
    const avg =
      state.dailyReviews.reduce((a, b) => a + b, 0) / state.dailyReviews.length
    return avg
  }, [state.dailyReviews])

  const ledgerRows = [
    { label: '매출', value: state.dailySales, tone: 'plain' as const },
    { label: '팁', value: state.dailyTips, tone: 'plain' as const },
    { label: '재료비', value: -(costs.ingredients ?? 0), tone: 'expense' as const },
    { label: '자릿세', value: -(costs.rent ?? 0), tone: 'expense' as const },
    { label: '폐기', value: -(costs.waste ?? 0), tone: 'expense' as const },
    {
      label: '트럭 유지비',
      value: -(costs.truck ?? 0),
      tone: 'expense' as const,
    },
  ]

  const reviewSnippets = state.dailyReviews.slice(0, 3).map((stars, i) => ({
    stars,
    text: generateReviewText({ stars }),
    key: `${stars}-${i}`,
  }))

  return (
    <section className="phase phase-settle" aria-label="오늘의 결산">
      <img
        className="settle-bg"
        src={TODAY_CALC_BG}
        alt=""
        draggable={false}
      />

      <div className="settle-layer">
        <p className="settle-day">Day {state.day} 영업 결과</p>

        <div className="settle-summary" aria-label="요약">
          <strong className="settle-summary__val settle-summary__val--sales">
            {formatWon(state.dailySales)}
          </strong>
          <strong className="settle-summary__val settle-summary__val--guests">
            {state.dailyServed}명
          </strong>
          <strong className="settle-summary__val settle-summary__val--review">
            {reviewAvg == null ? '—' : `★ ${reviewAvg.toFixed(1)}`}
          </strong>
        </div>

        <ul className="settle-ledger" aria-label="수입 · 지출 내역">
          {ledgerRows.map((row) => (
            <li key={row.label} className="settle-ledger__row">
              <span>{row.label}</span>
              <span
                className={
                  row.tone === 'expense' && row.value < 0
                    ? 'is-expense'
                    : undefined
                }
              >
                {row.tone === 'expense'
                  ? formatWon(row.value, true)
                  : formatWon(row.value)}
              </span>
            </li>
          ))}
        </ul>

        <p className="settle-cost-total" aria-label="비용 합계">
          {formatWon(totalCost)}
        </p>

        <div className="settle-profit" aria-label="오늘의 순수익">
          <img
            className="settle-profit__icon"
            src={netProfitIcon(profit)}
            alt=""
            draggable={false}
          />
          <p
            className={`settle-profit__value${
              profit < 0 ? ' is-loss' : profit > 0 ? ' is-gain' : ''
            }`}
          >
            {formatWon(profit, true)}
          </p>
          <p className="settle-profit__caption">
            {profitCaption(profit, state.day)}
          </p>
        </div>

        <div className="settle-feedback" aria-label="오늘의 손님 평가">
          <p className="settle-feedback__meta">
            손님 {state.dailyServed}명 · 이탈 {state.dailyLeft}명 · 리뷰{' '}
            {reviewAvg == null ? '—' : `★${reviewAvg.toFixed(1)}`}
          </p>
          {reviewSnippets.length === 0 ? (
            <p className="settle-feedback__empty">
              아직 등록된 리뷰가 없습니다.
            </p>
          ) : (
            <ul className="settle-feedback__list">
              {reviewSnippets.map((r) => (
                <li key={r.key}>
                  <span className="settle-feedback__stars">
                    {'★'.repeat(r.stars)}
                    {'☆'.repeat(5 - r.stars)}
                  </span>
                  <span>{r.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          className="settle-cta"
          onClick={() => dispatch({ type: ActionTypes.CONFIRM_SETTLE })}
        >
          성장 화면으로 →
        </button>
      </div>
    </section>
  )
}
