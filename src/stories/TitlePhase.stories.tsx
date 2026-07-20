import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentType } from 'react'
import TitlePhase from '../phases/TitlePhase'
import { GameDecorator } from './decorators'

const meta = {
  title: 'Game/Phases/Title',
  component: TitlePhase,
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
} satisfies Meta<typeof TitlePhase>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
