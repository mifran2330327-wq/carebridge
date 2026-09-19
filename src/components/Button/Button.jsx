import './Button.css'

// Reusable button. variant: 'primary' | 'accent' | 'ghost' | 'outline'
// size: 'md' | 'sm'
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn btn--${variant} btn--${size} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 15 : 17} />}
      <span>{children}</span>
    </button>
  )
}
