import Hud from '../components/Hud.jsx'
import { withGame } from './decorators.jsx'

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
