import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * StickyToc
 * Reusable desktop Table of Contents sticky sidebar.
 * Mirrors the navigation column seen on the Legal Docs & Policy pages.
 */
export default function StickyToc({
  sections = [],
  activeSectionId,
  onSelectSection,
  title = 'Sections',
  isLoading = false,
  className = '',
}) {
  const { isDark } = useTheme();

  const cardBg = isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-xs';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const textMuted = isDark ? 'text-zinc-500' : 'text-zinc-400';

  const handleClick = (id) => {
    if (onSelectSection) {
      onSelectSection(id);
    }
    const targetEl = document.getElementById(`section-${id}`) || document.getElementById(id);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className={`hidden lg:flex flex-col w-56 shrink-0 sticky top-20 max-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar ${className}`}>
      <div className={`rounded-xl border p-4 space-y-1 ${cardBg}`}>
        <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${textMuted}`}>
          {title}
        </p>

        {isLoading ? (
          <div className="space-y-2 py-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`h-3 rounded animate-pulse ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}
                style={{ width: `${60 + (i % 3) * 15}%` }}
              />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <p className={`text-xs italic py-2 ${textMuted}`}>No sections found</p>
        ) : (
          sections.map((sec) => {
            const isItemActive = activeSectionId === sec.id;
            const Icon = sec.icon;

            return (
              <button
                key={sec.id}
                type="button"
                title={sec.title || sec.heading}
                onClick={() => handleClick(sec.id)}
                className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition cursor-pointer truncate flex items-center gap-2 ${
                  isItemActive
                    ? 'bg-orange-500/10 text-orange-500 font-semibold'
                    : `${textSecondary} hover:text-orange-500 hover:bg-orange-500/5`
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${isItemActive ? 'text-orange-500' : textMuted}`} />}
                <span className="truncate">{sec.title || sec.heading}</span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
