import Link from 'next/link'

interface LogoProps {
  /** Wrap the logo in a Link to this route. Pass `false` to render without a link. */
  href?: string | false
  /** Height of the icon in pixels. */
  iconSize?: number
  /** Tailwind text-size class applied to the "KiraFlow" wordmark. */
  textClassName?: string
  /** Optional small caption rendered under the wordmark (e.g. "AI · v1.0"). */
  subtitle?: string
  /** Extra classes for the outer wrapper (e.g. spacing). */
  className?: string
}

export default function Logo({
  href = '/',
  iconSize = 28,
  textClassName = 'text-base',
  subtitle,
  className = '',
}: LogoProps) {
  const icon = (
    <img
      src="/KiraFlowLogo.png"
      alt="Kira Flow logo"
      style={{ height: iconSize }}
      className="w-auto shrink-0 object-contain"
    />
  )

  const text = (
    <div className="leading-tight">
      <div className={`font-extrabold text-slate-100 ${textClassName}`}>
        Kira<span className="text-amber-500">Flow</span>
      </div>
      {subtitle && <div className="text-[10px] text-slate-500">{subtitle}</div>}
    </div>
  )

  const layout = `flex items-center gap-2.5 ${className}`

  if (href === false) {
    return <div className={layout}>{icon}{text}</div>
  }

  return (
    <Link href={href} className={`${layout} no-underline`}>
      {icon}
      {text}
    </Link>
  )
}
