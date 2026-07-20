import UpgradeShop from '../components/UpgradeShop'
import { withGame } from './decorators'

export default {
  title: 'Game/UpgradeShop',
  component: UpgradeShop,
  tags: ['autodocs'],
  decorators: [withGame({ startInPrep: true })],
}

export const Default = {}
