import Button from '../ui/Button.jsx'

export default {
  title: 'Design System/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'default'],
    },
    size: {
      control: 'select',
      options: ['md', 'sm'],
    },
    disabled: { control: 'boolean' },
  },
  args: {
    children: '영업 시작',
    variant: 'primary',
    size: 'md',
    disabled: false,
  },
}

export const Primary = {}

export const Secondary = {
  args: {
    variant: 'secondary',
    children: '영업 조기 종료',
  },
}

export const Small = {
  args: {
    size: 'sm',
    children: '+1 (1,200)',
  },
}

export const Disabled = {
  args: {
    disabled: true,
    children: '메뉴를 선택하세요',
  },
}

export const AllVariants = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button>Default</Button>
      <Button size="sm">Small</Button>
      <Button variant="primary" disabled>
        Disabled
      </Button>
    </div>
  ),
}
