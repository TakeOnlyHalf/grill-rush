/**
 * 공통 패널 컨테이너 — .panel 스타일 통일
 */
export default function Panel({ children, title, className = '', as: Tag = 'div', ...rest }) {
  return (
    <Tag className={['panel', className].filter(Boolean).join(' ')} {...rest}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </Tag>
  )
}
