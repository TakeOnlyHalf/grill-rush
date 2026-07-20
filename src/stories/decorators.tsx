import { useEffect, type ComponentType, type ReactNode } from 'react'
import { GameProvider, useGameDispatch } from '../state/GameContext'
import { ActionTypes } from '../state/actions'

export interface GameDecoratorProps {
  startInPrep?: boolean
  children: ReactNode
}

/** Storybook용 GameProvider 래퍼 */
export function GameDecorator({ children, startInPrep = false }: GameDecoratorProps) {
  return (
    <GameProvider>
      {startInPrep ? <BootToPrep>{children}</BootToPrep> : children}
    </GameProvider>
  )
}

function BootToPrep({ children }: { children: ReactNode }) {
  const dispatch = useGameDispatch()
  useEffect(() => {
    dispatch({ type: ActionTypes.START_GAME })
  }, [dispatch])
  return children
}

/** Storybook decorator factory */
export function withGame(options: { startInPrep?: boolean } = {}) {
  return function Decorator(Story: ComponentType) {
    return (
      <GameDecorator startInPrep={options.startInPrep}>
        <div className="app-shell" style={{ minHeight: 'auto', padding: '1rem' }}>
          <Story />
        </div>
      </GameDecorator>
    )
  }
}
