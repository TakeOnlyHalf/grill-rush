import '../src/styles/game.css'

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
    backgrounds: {
      default: 'grill',
      values: [
        { name: 'grill', value: '#1a1410' },
        { name: 'panel', value: '#2a211c' },
        { name: 'light', value: '#f5f0e8' },
      ],
    },
    a11y: {
      test: 'todo',
    },
    docs: {
      toc: true,
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          fontFamily: 'var(--font)',
          color: 'var(--text)',
          minHeight: '100%',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export default preview
