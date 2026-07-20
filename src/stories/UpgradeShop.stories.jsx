import UpgradeShop from '../components/UpgradeShop.jsx'
import { withGame } from './decorators.jsx'

export default {
  title: 'Game/UpgradeShop',
  component: UpgradeShop,
  tags: ['autodocs'],
  decorators: [withGame({ startInPrep: true })],
}

export const Default = {}
