import { useEffect } from 'react'
import { useGameState } from '../state/GameContext'
import { requestBgm, syncBgm, type BgmId } from './bgm'

function bgmForPhase(phase: string): BgmId | 'defer' {
  switch (phase) {
    case 'title':
    case 'story':
      return 'title'
    case 'open':
      return 'cooking'
    case 'settle':
    case 'night':
      return 'store'
    case 'prep':
      return 'defer'
    default:
      return 'none'
  }
}

/** 전역 페이즈 → BGM. 화면이 뜨면 클릭 없이 재생 시도 */
export default function BgmController() {
  const { phase } = useGameState()

  useEffect(() => {
    const track = bgmForPhase(phase)
    if (track === 'defer') {
      // prep은 PrepPhase가 담당하되, context resume만 한 번 더
      syncBgm()
      return
    }
    requestBgm(track)
  }, [phase])

  // 타이틀 첫 진입 등: 마운트 직후 한 번 더 시도
  useEffect(() => {
    syncBgm()
  }, [])

  return null
}
