import UpgradeShop from './UpgradeShop.jsx'
import { withGame } from '../stories/decorators.jsx'

export default {
  title: 'Game/UpgradeShop',
  component: UpgradeShop,
  tags: ['autodocs'],
  decorators: [withGame({ startInPrep: true })],
}

export const Default = {}
