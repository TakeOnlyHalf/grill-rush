import LocationPicker from '../components/LocationPicker.jsx'
import { withGame } from './decorators.jsx'

export default {
  title: 'Game/LocationPicker',
  component: LocationPicker,
  tags: ['autodocs'],
  decorators: [withGame({ startInPrep: true })],
}

export const Default = {}
