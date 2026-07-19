import { GameProvider } from '../state/GameContext.jsx'
import { ActionTypes } from '../state/actions.js'
import { useEffect } from 'react'
import { useGameDispatch } from '../state/GameContext.jsx'

/**
 * Storybook용 GameProvider 래퍼
 * @param {{ startInPrep?: boolean, children: import('react').ReactNode }} props
 */
export function GameDecorator({ children, startInPrep = false }) {
  return (
    <GameProvider>
      {startInPrep ? <BootToPrep>{children}</BootToPrep> : children}
    </GameProvider>
  )
}

function BootToPrep({ children }) {
  const dispatch = useGameDispatch()
  useEffect(() => {
    dispatch({ type: ActionTypes.START_GAME })
  }, [dispatch])
  return children
}

/** Storybook decorator factory */
export function withGame(options = {}) {
  return function Decorator(Story) {
    return (
      <GameDecorator startInPrep={options.startInPrep}>
        <div className="app-shell" style={{ minHeight: 'auto', padding: '1rem' }}>
          <Story />
        </div>
      </GameDecorator>
    )
  }
}
