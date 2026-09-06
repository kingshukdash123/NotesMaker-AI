import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * DocPageHeader
 * Standard top header block for documents, legal pages, and configuration pages.
 */
export default function DocPageHeader({
  title,
  subtitle,
  badge,
  backAction,
  className = '',
}) {
  const { isDark } = useTheme();

  const textPrimary = isDark ? 'text-zinc-50' : 'text-orange-950';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-orange-900/70';

  return (
    <div className={`space-y-3 ${className}`}>
      {backAction && (
        <div>
          {backAction}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${textPrimary}`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`text-xs sm:text-sm ${textSecondary}`}>
              {subtitle}
            </p>
          )}
        </div>

        {badge && (
          <div className="shrink-0 self-start sm:self-auto">
            {badge}
          </div>
        )}
      </div>
    </div>
  );
}
