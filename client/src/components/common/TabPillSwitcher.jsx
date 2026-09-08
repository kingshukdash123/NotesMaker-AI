import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * TabPillSwitcher
 * Reusable horizontal scrollable pill bar matching the Legal Center & Policy Page tabs.
 * Employs standard 'btn-primary' (for active pill) and 'btn-secondary' (for inactive pills).
 */
export default function TabPillSwitcher({
  tabs = [],
  activeTab,
  onTabChange,
  className = '',
}) {
  const { isDark } = useTheme();

  return (
    <div className={`flex items-center gap-2 overflow-x-auto py-1.5 px-0.5 custom-scrollbar text-xs scroll-smooth flex-nowrap w-full ${className}`}>
      {tabs.map((tab) => {
        const IconComp = tab.icon;
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange && onTabChange(tab.id)}
            className={`px-4 py-2 !rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer whitespace-nowrap ${
              isActive ? (isDark ? 'btn-primary shadow-sm shadow-orange-500/20' : 'btn-primary shadow-xs') : 'btn-secondary'
            }`}
          >
            {IconComp && (
              <IconComp
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-current' : isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              />
            )}
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-black/20 text-white'
                    : isDark
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
