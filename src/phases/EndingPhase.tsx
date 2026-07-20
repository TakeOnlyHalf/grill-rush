import { useGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import type { EndingId } from '../types/game'

const ENDINGS: Record<
  EndingId,
  {
    title: string
    desc: string
  }
> = {
  legend: {
    title: '전설의 트럭',
    desc: '도시 최고의 푸드트럭으로 등극!',
  },
  popular: {
    title: '인기 맛집',
    desc: '매일 줄 서는 인기 트럭이 됐다!',
  },
  local: {
    title: '동네 단골집',
    desc: '소소하지만 확실한 맛집.',
  },
  survive: {
    title: '근근이 생존',
    desc: '힘들었지만 포기하지 않았다.',
  },
  closed: {
    title: '폐업',
    desc: '…다음엔 잘 될 거야.',
  },
}

/**
 * 엔딩 화면
 * TODO: 엔딩별 일러스트, 스탯 요약, 공유
 */
export default function EndingPhase() {
  const { state, dispatch } = useGame()
  const ending = ENDINGS[state.endingId ?? 'survive']

  return (
    <section className="phase phase-ending">
      <header className="phase-header">
        <p className="title-eyebrow">Ending</p>
        <h2>{ending.title}</h2>
        <p>{ending.desc}</p>
      </header>

      <div className="panel ending-stats">
        <p>최종 자금 {state.cash.toLocaleString('ko-KR')}원</p>
        <p>명성 {state.fame}</p>
        <p>영업일 {state.history.length}일</p>
      </div>

      <footer className="phase-footer">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => dispatch({ type: ActionTypes.RESTART })}
        >
          타이틀로
        </button>
      </footer>
    </section>
  )
}
