import { useGame } from '../state/GameContext.jsx'
import { ActionTypes } from '../state/actions.js'
import Button from '../ui/Button.jsx'

const base = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`
const TITLE_ART = `${base}images/title.png`

/**
 * 타이틀 화면 — public/images/title.png 풀블리드 히어로
 * TODO: 세이브/로드, 설정, 튜토리얼 진입
 */
export default function TitlePhase() {
  const { dispatch } = useGame()

  return (
    <section className="phase phase-title" aria-label="타이틀">
      <div className="title-stage">
        <img
          className="title-art"
          src={TITLE_ART}
          alt=""
          decoding="async"
        />
        <h1 className="visually-hidden">Grill Rush — Food Truck Tycoon</h1>
        <div className="title-actions">
          <Button
            className="title-start"
            onClick={() => dispatch({ type: ActionTypes.START_GAME })}
          >
            게임 시작
          </Button>
        </div>
      </div>
    </section>
  )
}
