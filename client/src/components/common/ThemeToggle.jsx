import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ThemeToggle Component
 * @param {Object} props
 * @param {'icon' | 'switch' | 'button'} [props.variant='icon'] - Visual presentation style
 * @param {string} [props.className] - Optional custom CSS classes
 * @param {boolean} [props.showLabel=false] - Whether to show the text label
 */
export default function ThemeToggle({ 
  variant = 'icon', 
  className = '', 
  showLabel = false 
}) {
  const { toggleTheme, isDark } = useTheme();

  if (variant === 'switch') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={!isDark}
        aria-label="Toggle theme mode"
        onClick={toggleTheme}
        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
          isDark 
            ? 'bg-zinc-900 border-zinc-700/80' 
            : 'bg-orange-500 border-orange-400 shadow-sm shadow-orange-500/20'
        } ${className}`}
      >
        <span className="sr-only">Toggle theme</span>
        <span
          className={`pointer-events-none flex h-5.5 w-5.5 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
            isDark ? 'translate-x-0.5 text-zinc-900' : 'translate-x-7 text-orange-600'
          }`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-zinc-700" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-orange-600 animate-spin-slow" />
          )}
        </span>
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
          isDark
            ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 hover:bg-zinc-800/60'
            : 'bg-orange-50 border-orange-200/80 text-orange-950 hover:bg-orange-100/70 hover:border-orange-300 shadow-xs'
        } ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-zinc-800 text-orange-400' : 'bg-orange-500 text-white'}`}>
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-none">
              {isDark ? 'Dark Mode' : 'Light Mode (Orange)'}
            </p>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-500' : 'text-orange-700/80'}`}>
              {isDark ? 'Deep dark workspace' : 'Warm orange flavor'}
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
          isDark 
            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700/60' 
            : 'bg-orange-200/60 text-orange-800 border border-orange-300'
        }`}>
          Active
        </span>
      </button>
    );
  }

  // Default: Compact Icon button for Header / Navigation (matches Header Profile button)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode (Orange Flavor)' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode (Orange Flavor)' : 'Switch to Dark Mode'}
      className={`group relative ${
        showLabel ? 'px-3 py-1.5 rounded-xl' : 'w-8 h-8 rounded-full'
      } border transition flex items-center justify-center gap-2 cursor-pointer select-none ${
        isDark
          ? 'bg-zinc-900 border-zinc-800 text-orange-500 hover:border-zinc-700'
          : 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        {/* Sun Icon (shown in light mode) */}
        <Sun 
          className={`w-4 h-4 transition-all duration-300 absolute inset-0 m-auto ${
            isDark 
              ? 'opacity-0 rotate-90 scale-0 text-orange-500' 
              : 'opacity-100 rotate-0 scale-100 text-orange-700 group-hover:rotate-45'
          }`} 
        />
        {/* Moon Icon (shown in dark mode) */}
        <Moon 
          className={`w-4 h-4 transition-all duration-300 absolute inset-0 m-auto ${
            isDark 
              ? 'opacity-100 rotate-0 scale-100 text-orange-500 group-hover:-rotate-12' 
              : 'opacity-0 -rotate-90 scale-0 text-orange-700'
          }`} 
        />
      </div>

      {showLabel && (
        <span className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
          {isDark ? 'Dark Mode' : 'Light (Orange)'}
        </span>
      )}
    </button>
  );
}
