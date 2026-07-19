import TitlePhase from './TitlePhase.jsx'
import { withGame } from '../stories/decorators.jsx'

export default {
  title: 'Game/Phases/Title',
  component: TitlePhase,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withGame()],
}

export const Default = {}
