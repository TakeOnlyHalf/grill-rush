import { useCallback, useEffect, useState } from 'react'
import { useGame, startNewGame } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import TitleMenuButton from '../ui/TitleMenuButton'
import OptionsModal from '../components/OptionsModal'
import { hasSave, loadGame } from '../utils/saveGame'
import { TITLE_DAY_ART, preloadCriticalAssets } from '../utils/assets'
import { forceUnlockBgm, resetBgmDayProgress } from '../audio/bgm'

/**
 * 타이틀 화면 — public/images/title_day.webp 풀블리드 히어로
 */
export default function TitlePhase() {
  const { dispatch } = useGame()
  const [canContinue, setCanContinue] = useState(() => hasSave())
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void preloadCriticalAssets()
  }, [])

  const handleContinue = useCallback(() => {
    const saved = loadGame()
    if (!saved) {
      setCanContinue(false)
      return
    }
    forceUnlockBgm(saved.day >= 2 ? 'lobby' : 'store')
    dispatch({ type: ActionTypes.LOAD_GAME, payload: saved })
  }, [dispatch])

  const handleNewGame = useCallback(async () => {
    if (busy) return
    if (canContinue) {
      const ok = window.confirm('기존 저장 데이터가 삭제됩니다. 처음부터 시작할까요?')
      if (!ok) return
    }
    // Day 1 준비(장소·메뉴·마트)는 store BGM
    resetBgmDayProgress()
    forceUnlockBgm('store')
    setCanContinue(false)
    setBusy(true)
    try {
      await preloadCriticalAssets()
      startNewGame(dispatch)
    } finally {
      setBusy(false)
    }
  }, [busy, canContinue, dispatch])

  return (
    <section className="phase phase-title" aria-label="타이틀">
      <div className="title-stage">
        <img
          className="title-art-bleed"
          src={TITLE_DAY_ART}
          alt=""
          aria-hidden
          decoding="async"
          fetchPriority="high"
        />
        <img
          className="title-art"
          src={TITLE_DAY_ART}
          alt=""
          decoding="async"
          fetchPriority="high"
        />
        <h1 className="visually-hidden">Grill Rush — Food Truck Tycoon</h1>
        <nav className="title-actions" aria-label="타이틀 메뉴">
          <TitleMenuButton
            tone={canContinue ? 'primary' : 'secondary'}
            icon="continue"
            disabled={!canContinue || busy}
            onClick={handleContinue}
          >
            이어서 하기
          </TitleMenuButton>
          <TitleMenuButton
            tone={canContinue ? 'secondary' : 'primary'}
            icon="new"
            disabled={busy}
            onClick={() => {
              void handleNewGame()
            }}
          >
            {busy ? '준비 중…' : '처음부터'}
          </TitleMenuButton>
          <TitleMenuButton
            tone="tertiary"
            icon="options"
            disabled={busy}
            onClick={() => setOptionsOpen(true)}
          >
            옵션
          </TitleMenuButton>
        </nav>
      </div>
      <OptionsModal open={optionsOpen} onClose={() => setOptionsOpen(false)} />
    </section>
  )
}
