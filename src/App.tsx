import { GameProvider, useGameState } from './state/GameContext'
import GameViewport from './components/GameViewport'
import TitlePhase from './phases/TitlePhase'
import StoryPhase from './phases/StoryPhase'
import PrepPhase from './phases/PrepPhase'
import OpenPhase from './phases/OpenPhase'
import SettlePhase from './phases/SettlePhase'
import NightPhase from './phases/NightPhase'
import EndingPhase from './phases/EndingPhase'
import BgmController from './audio/BgmController'
import BgmMuteToggle from './components/BgmMuteToggle'
import './styles/game.css'

/**
 * 페이즈 라우팅
 * title → prep → open → settle → night → … → ending
 */
function PhaseRouter() {
  const { phase } = useGameState()

  switch (phase) {
    case 'title':
      return <TitlePhase />
    case 'story':
      return <StoryPhase />
    case 'prep':
      return <PrepPhase />
    case 'open':
      return <OpenPhase />
    case 'settle':
      return <SettlePhase />
    case 'night':
      return <NightPhase />
    case 'ending':
      return <EndingPhase />
    default:
      return <TitlePhase />
  }
}

function AppShell() {
  const { phase } = useGameState()
  const bleed =
    phase === 'title' ||
    phase === 'story' ||
    phase === 'prep' ||
    phase === 'settle' ||
    phase === 'night'

  return (
    <div className={bleed ? 'app-shell app-shell--bleed' : 'app-shell'}>
      <PhaseRouter />
      <BgmMuteToggle />
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <GameViewport>
        <BgmController />
        <AppShell />
      </GameViewport>
    </GameProvider>
  )
}
