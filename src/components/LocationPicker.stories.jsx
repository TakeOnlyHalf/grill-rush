import LocationPicker from './LocationPicker.jsx'
import { withGame } from '../stories/decorators.jsx'

export default {
  title: 'Game/LocationPicker',
  component: LocationPicker,
  tags: ['autodocs'],
  decorators: [withGame({ startInPrep: true })],
}

export const Default = {}
