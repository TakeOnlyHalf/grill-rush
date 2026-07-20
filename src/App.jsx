import { GameProvider, useGameState } from './state/GameContext.jsx'
import TitlePhase from './phases/TitlePhase.jsx'
import PrepPhase from './phases/PrepPhase.jsx'
import OpenPhase from './phases/OpenPhase.jsx'
import SettlePhase from './phases/SettlePhase.jsx'
import NightPhase from './phases/NightPhase.jsx'
import EndingPhase from './phases/EndingPhase.jsx'
import './styles/game.css'

/**
 * 페이즈 라우팅
 * title → prep → open → settle → night → (next day prep…) → ending
 */
function PhaseRouter() {
  const { phase } = useGameState()

  switch (phase) {
    case 'title':
      return <TitlePhase />
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
  const bleed = phase === 'title'

  return (
    <div className={bleed ? 'app-shell app-shell--bleed' : 'app-shell'}>
      <PhaseRouter />
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  )
}
