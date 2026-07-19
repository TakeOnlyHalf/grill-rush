/**
 * 공통 버튼 — game.css 의 .btn 계열을 단일 컴포넌트로 통일
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...rest
}) {
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
        ? 'btn-secondary'
        : ''
  const sizeClass = size === 'sm' ? 'btn-small' : ''

  return (
    <button
      type={type}
      className={['btn', variantClass, sizeClass, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
