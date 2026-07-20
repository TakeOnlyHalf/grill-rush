import TitlePhase from '../phases/TitlePhase.jsx'
import { GameDecorator } from './decorators.jsx'

export default {
  title: 'Game/Phases/Title',
  component: TitlePhase,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <GameDecorator>
        <div className="app-shell app-shell--bleed">
          <Story />
        </div>
      </GameDecorator>
    ),
  ],
}

export const Default = {}
