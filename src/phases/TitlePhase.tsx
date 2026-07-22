import { useCallback, useState } from 'react'
import { useGame, startNewGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import TitleMenuButton from '../ui/TitleMenuButton'
import OptionsModal from '../components/OptionsModal'
import { hasSave, loadGame } from '../utils/saveGame'
import { TITLE_DAY_ART } from '../utils/assets'

/**
 * 타이틀 화면 — public/images/title_day.png 풀블리드 히어로
 */
export default function TitlePhase() {
  const { dispatch } = useGame()
  const [canContinue, setCanContinue] = useState(() => hasSave())
  const [optionsOpen, setOptionsOpen] = useState(false)

  const handleContinue = useCallback(() => {
    const saved = loadGame()
    if (!saved) {
      setCanContinue(false)
      return
    }
    dispatch({ type: ActionTypes.LOAD_GAME, payload: saved })
  }, [dispatch])

  const handleNewGame = useCallback(() => {
    if (canContinue) {
      const ok = window.confirm('기존 저장 데이터가 삭제됩니다. 처음부터 시작할까요?')
      if (!ok) return
    }
    setCanContinue(false)
    startNewGame(dispatch)
  }, [canContinue, dispatch])

  return (
    <section className="phase phase-title" aria-label="타이틀">
      <div className="title-stage">
        <img className="title-art" src={TITLE_DAY_ART} alt="" decoding="async" />
        <h1 className="visually-hidden">Grill Rush — Food Truck Tycoon</h1>
        <nav className="title-actions" aria-label="타이틀 메뉴">
          <TitleMenuButton disabled={!canContinue} onClick={handleContinue}>
            이어서 하기
          </TitleMenuButton>
          <TitleMenuButton onClick={handleNewGame}>처음부터</TitleMenuButton>
          <TitleMenuButton variant="chalk" onClick={() => setOptionsOpen(true)}>
            옵션
          </TitleMenuButton>
        </nav>
      </div>
      <OptionsModal open={optionsOpen} onClose={() => setOptionsOpen(false)} />
    </section>
  )
}
