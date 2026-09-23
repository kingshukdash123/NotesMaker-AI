import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Reusable theme-aware custom select dropdown component.
 * Automatically handles dropup/dropdown placement when near screen edges,
 * keyboard accessibility, and consistent theme styling across dark & light modes.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  placement = 'auto', // 'auto' | 'top' | 'bottom'
  align = 'auto', // 'left' | 'right' | 'auto'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg'
  disabled = false,
  className = '',
  dropdownClassName = '',
  triggerClassName = '',
  ariaLabel = 'Select option',
  id,
  name
}) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [effectivePlacement, setEffectivePlacement] = useState(placement === 'top' ? 'top' : 'bottom');
  const [effectiveAlign, setEffectiveAlign] = useState(align === 'right' ? 'right' : 'left');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  // Normalize options into { value, label, icon, dotColor } format
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: opt, label: String(opt) };
      }
      return {
        value: opt.value,
        label: opt.label || String(opt.value),
        icon: opt.icon,
        dotColor: opt.dotColor,
        description: opt.description,
        desc: opt.desc
      };
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value)) || null;
  }, [normalizedOptions, value]);

  // Determine smart placement (top vs bottom, left vs right)
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (placement === 'top') {
      setEffectivePlacement('top');
    } else if (placement === 'bottom') {
      setEffectivePlacement('bottom');
    } else {
      // Auto: if space below is less than 190px and space above is larger, flip to top
      if (spaceBelow < 190 && spaceAbove > spaceBelow) {
        setEffectivePlacement('top');
      } else {
        setEffectivePlacement('bottom');
      }
    }

    if (align === 'right') {
      setEffectiveAlign('right');
    } else if (align === 'left') {
      setEffectiveAlign('left');
    } else {
      // Auto alignment: if trigger is in right 40% of screen, align right
      if (rect.right > viewportWidth - 100) {
        setEffectiveAlign('right');
      } else {
        setEffectiveAlign('left');
      }
    }
  }, [placement, align]);

  // Handle open toggle
  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optValue, e) => {
    e?.stopPropagation?.();
    if (onChange) {
      // Support standard callback or event signature
      onChange(optValue);
    }
    setIsOpen(false);
  };

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Size styling variants
  const sizeClasses = {
    xs: 'px-2 py-1 text-[10.5px] rounded-lg gap-1.5',
    sm: 'px-2.5 py-1.5 text-xs rounded-xl gap-2',
    md: 'px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl gap-2',
    lg: 'px-4 py-3 text-sm rounded-xl gap-2.5'
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-block text-left ${className}`}
    >
      {/* Hidden input for form integration if name is provided */}
      {name && (
        <input 
          type="hidden" 
          name={name} 
          id={id} 
          value={value ?? ''} 
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`w-full flex items-center justify-between border font-medium transition duration-150 outline-none cursor-pointer select-none ${
          sizeClasses[size] || sizeClasses.md
        } ${
          isDark 
            ? `bg-zinc-950 border-zinc-800 text-zinc-100 hover:border-zinc-700 ${
                isOpen ? 'border-orange-500 ring-1 ring-orange-500/30' : ''
              }` 
            : `bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300 shadow-xs ${
                isOpen ? 'border-orange-500 ring-1 ring-orange-500/30' : ''
              }`
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${triggerClassName}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedOption?.dotColor && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOption.dotColor}`} />
          )}
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown 
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-orange-500' : isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`} 
        />
      </button>

      {/* Floating Dropdown Listbox */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute z-50 min-w-full w-max max-w-[280px] sm:max-w-xs p-1 rounded-xl border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 focus:outline-none overflow-y-auto max-h-56 custom-scrollbar ${
            effectivePlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            effectiveAlign === 'right' ? 'right-0' : 'left-0'
          } ${
            isDark 
              ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100 shadow-black/80' 
              : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-zinc-400/30'
          } ${dropdownClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);

            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={(e) => handleSelect(opt.value, e)}
                className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 sm:py-2 text-xs rounded-lg transition duration-100 text-left cursor-pointer outline-none ${
                  isSelected 
                    ? isDark 
                      ? 'bg-white/15 text-white font-bold' 
                      : 'bg-black/10 text-zinc-900 font-bold'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-white/10 hover:text-white' 
                      : 'text-zinc-700 hover:bg-black/5 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.dotColor && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor}`} />
                  )}
                  {opt.icon && (
                    <span className="shrink-0">{opt.icon}</span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>

                {isSelected && (
                  <Check className={`w-3.5 h-3.5 shrink-0 stroke-[2.5] ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
