import Hud from './Hud.jsx'
import { withGame } from '../stories/decorators.jsx'

export default {
  title: 'Game/Hud',
  component: Hud,
  tags: ['autodocs'],
  decorators: [withGame({ startInPrep: true })],
}

export const Default = {}

export const OpenVariant = {
  args: {
    variant: 'open',
  },
}
