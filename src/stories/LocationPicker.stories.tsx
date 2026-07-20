import LocationPicker from '../components/LocationPicker'
import { withGame } from './decorators'

export default {
  title: 'Game/LocationPicker',
  component: LocationPicker,
  tags: ['autodocs'],
  decorators: [withGame({ startInPrep: true })],
}

export const Default = {}
