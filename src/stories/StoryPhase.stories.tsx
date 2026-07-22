import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentType } from 'react'
import StoryPhase from '../phases/StoryPhase'
import { GameDecorator } from './decorators'

const meta = {
  title: 'Game/Phases/Story',
  component: StoryPhase,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story: ComponentType) => (
      <GameDecorator>
        <div className="app-shell app-shell--bleed">
          <Story />
        </div>
      </GameDecorator>
    ),
  ],
} satisfies Meta<typeof StoryPhase>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
