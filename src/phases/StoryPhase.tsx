import { useCallback } from 'react'
import VisualNovelStage from '../ui/visualNovel/VisualNovelStage'
import { INTRO_STORY } from '../data/introStory'
import { useGameDispatch } from '../state/GameContext'
import { ActionTypes } from '../state/actions'
import { DAY_STREET_BG } from '../utils/assets'

/**
 * 오프닝 스토리 페이즈
 * 처음부터 시작 → 대사 종료 후 준비 페이즈
 */
export default function StoryPhase() {
  const dispatch = useGameDispatch()

  const finish = useCallback(() => {
    dispatch({ type: ActionTypes.FINISH_STORY })
  }, [dispatch])

  return (
    <section className="phase phase-story" aria-label="오프닝 스토리">
      <VisualNovelStage
        lines={INTRO_STORY}
        backgroundSrc={DAY_STREET_BG}
        onComplete={finish}
      />
      <button type="button" className="vn-skip" onClick={finish}>
        스킵
      </button>
    </section>
  )
}
