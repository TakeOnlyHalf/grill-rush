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
      default: 'cream',
      values: [
        { name: 'cream', value: '#f6ebe0' },
        { name: 'panel', value: '#fff7ee' },
        { name: 'apricot', value: '#ffe8d4' },
        { name: 'story-sky', value: '#a8d4f0' },
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
          background: 'var(--bg)',
          minHeight: '100%',
          borderRadius: 'var(--radius)',
          padding: '0.25rem',
        }}
      >
        <Story />
      </div>
    ),
  ],
}

export default preview
