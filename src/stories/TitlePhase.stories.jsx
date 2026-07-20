import TitlePhase from '../phases/TitlePhase.jsx'
import { withGame } from './decorators.jsx'

export default {
  title: 'Game/Phases/Title',
  component: TitlePhase,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [withGame()],
}

export const Default = {}
