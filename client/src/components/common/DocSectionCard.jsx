import { useTheme } from '../../context/ThemeContext';

/**
 * DocSectionCard
 * Reusable section card matching the Legal Docs & Policy Page design layout.
 * Features the signature orange vertical pill accent, dark-mode border tokens,
 * optional header actions/badges, and smooth anchor scrolling support.
 */
export default function DocSectionCard({
  id,
  title,
  icon: Icon,
  badge,
  headerAction,
  subtitle,
  isActive = false,
  onClick,
  children,
  className = '',
}) {
  const { isDark } = useTheme();

  const cardBg = isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-xs';
  const textPrimary = isDark ? 'text-zinc-50' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';

  return (
    <div
      id={id ? `section-${id}` : undefined}
      onClick={onClick}
      className={`rounded-xl border p-5 sm:p-6 space-y-4 scroll-mt-20 transition-all ${cardBg} ${
        isActive ? 'ring-1 ring-orange-500/30 border-orange-500/50' : ''
      } ${className}`}
    >
      {/* Header Row */}
      {(title || headerAction) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {/* Signature Orange Accent Indicator */}
            <span className="w-1 h-4 rounded-full bg-orange-500 shrink-0" />
            {Icon && <Icon className="w-4 h-4 text-orange-500 shrink-0" />}
            {title && (
              <h2 className={`text-base font-bold truncate ${textPrimary}`}>
                {title}
              </h2>
            )}
            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {headerAction && (
            <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
              {headerAction}
            </div>
          )}
        </div>
      )}

      {/* Optional Subtitle / Explanation */}
      {subtitle && (
        <p className={`text-xs leading-relaxed ${textSecondary}`}>
          {subtitle}
        </p>
      )}

      {/* Card Body */}
      {children && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
