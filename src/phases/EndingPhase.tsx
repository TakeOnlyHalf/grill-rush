import { useGame, startNewGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import type { EndingId } from '../types/game'
import {
  BAD_ENDING_ART,
  GAME_LOGO,
  GREAT_ENDING_ART,
  NORMAL_ENDING_ART,
  preloadCriticalAssets,
} from '../utils/assets'
import { forceUnlockBgm, resetBgmDayProgress } from '../audio/bgm'
import { playSfx } from '../audio/sfx'

interface EndingDef {
  number: string
  title: string
  subtitle: string
  badge: string
  epilogue: string
  art: string
  tone: 'bad' | 'normal' | 'great'
}

const ENDINGS: Record<EndingId, EndingDef> = {
  bad: {
    number: '01',
    title: '배드 엔딩',
    subtitle: '빗속에서 식을 수밖에 없었던 하루',
    badge: '적자의 사장님',
    epilogue:
      '장사는 멈췄고, 트럭의 불도 꺼졌습니다. 실패는 끝이 아닙니다. 다음엔 더 현명하게 시작해 보세요.',
    art: BAD_ENDING_ART,
    tone: 'bad',
  },
  normal: {
    number: '02',
    title: '보통 엔딩',
    subtitle: '오늘도 골목을 달리는 사장님',
    badge: '동네의 단골 사장님',
    epilogue:
      '대박은 아니었지만 단골과 함께 꾸준한 가게를 만들었습니다. 당신의 푸드트럭은 오늘도 익숙한 골목을 달립니다.',
    art: NORMAL_ENDING_ART,
    tone: 'normal',
  },
  great: {
    number: '03',
    title: '진엔딩',
    subtitle: '골목을 넘어 도시로 뻗어간 사장님',
    badge: '전설의 트럭 사장님',
    epilogue:
      '단골과 명성, 그리고 든든한 동료들까지. 당신의 푸드트럭은 이제 도시의 자랑이 되었습니다.',
    art: GREAT_ENDING_ART,
    tone: 'great',
  },
}

function formatWon(n: number): string {
  const sign = n < 0 ? '−' : ''
  return `${sign}₩${Math.abs(n).toLocaleString('ko-KR')}`
}

/** 엔딩 화면 — 좌측 일러스트 + 우측 결과 패널 */
export default function EndingPhase() {
  const { state, dispatch } = useGame()
  const ending = ENDINGS[state.endingId ?? 'normal']
  const businessDays = Math.max(state.history.length, state.day)
  const reviewLabel =
    state.reviewAvg > 0 ? `★ ${state.reviewAvg.toFixed(1)}` : '—'
  const phaseLabel =
    state.endingId === 'bad' && state.day < state.maxDays
      ? '강제 폐업'
      : '마지막 영업'

  const goTitle = () => {
    playSfx('button_secondary')
    forceUnlockBgm('title')
    dispatch({ type: ActionTypes.RESTART })
  }

  const restartGame = async () => {
    playSfx('button_primary')
    resetBgmDayProgress()
    forceUnlockBgm('store')
    await preloadCriticalAssets()
    startNewGame(dispatch)
  }

  return (
    <section className={`phase phase-ending phase-ending--${ending.tone}`} aria-label="엔딩">
      <header className="ending-topbar">
        <img className="ending-topbar__logo" src={GAME_LOGO} alt="Grill Rush" draggable={false} />
        <p className="ending-topbar__day">
          DAY {state.day}
          <span aria-hidden> · </span>
          {phaseLabel}
        </p>
      </header>

      <div className="ending-layout">
        <div className="ending-art-wrap">
          <img
            className="ending-art"
            src={ending.art}
            alt=""
            draggable={false}
            decoding="async"
          />
        </div>

        <aside className="ending-panel" aria-label="엔딩 결과">
          <div className="ending-panel__head">
            <span className="ending-panel__badge-num" aria-hidden>
              {ending.number}
            </span>
            <div className="ending-panel__titles">
              <h2 className="ending-panel__title">{ending.title}</h2>
              <p className="ending-panel__subtitle">{ending.subtitle}</p>
            </div>
          </div>

          <ul className="ending-stats-list">
            <li>
              <span>최종 자산</span>
              <strong className={state.cash < 0 ? 'is-loss' : undefined}>
                {formatWon(state.cash)}
              </strong>
            </li>
            <li>
              <span>평균 평점</span>
              <strong>{reviewLabel}</strong>
            </li>
            <li>
              <span>영업 일수</span>
              <strong>{businessDays}일</strong>
            </li>
          </ul>

          <div className="ending-title-card">
            <span className="ending-title-card__icon" aria-hidden>
              🚚
            </span>
            <div>
              <p className="ending-title-card__label">획득 칭호</p>
              <p className="ending-title-card__name">{ending.badge}</p>
            </div>
          </div>

          <div className="ending-epilogue">
            <p className="ending-epilogue__label">그 후의 이야기</p>
            <p className="ending-epilogue__text">{ending.epilogue}</p>
          </div>

          <div className="ending-actions">
            <button type="button" className="ending-btn ending-btn--ghost" onClick={goTitle}>
              타이틀로
            </button>
            <button type="button" className="ending-btn ending-btn--primary" onClick={() => void restartGame()}>
              다시 시작
            </button>
          </div>
        </aside>
      </div>
    </section>
  )
}
