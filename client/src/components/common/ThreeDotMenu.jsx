import { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThreeDotMenu({
  items = [],
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  align = 'right',
  placement = 'auto', // 'top' | 'bottom' | 'auto'
  title = 'Options',
  ariaLabel = 'Options',
  buttonClassName = '',
  menuClassName = '',
  triggerIcon: TriggerIcon = MoreVertical,
  children
}) {
  const { isDark } = useTheme();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [effectivePlacement, setEffectivePlacement] = useState(placement === 'top' ? 'top' : 'bottom');
  const containerRef = useRef(null);

  const isControlled = typeof controlledIsOpen === 'boolean';
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  // Smart placement calculation (opens top or bottom depending on available space)
  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return;
    if (placement === 'top') {
      setEffectivePlacement('top');
      return;
    }
    if (placement === 'bottom') {
      setEffectivePlacement('bottom');
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    const scrollParent = containerRef.current.closest('.overflow-y-auto, .overflow-auto');
    let spaceBelow = viewportHeight - rect.bottom;
    let spaceAbove = rect.top;

    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      spaceBelow = parentRect.bottom - rect.bottom;
      spaceAbove = rect.top - parentRect.top;
    }

    // A 2-3 item menu is about 80-90px tall
    if (spaceBelow < 95 && spaceAbove > spaceBelow) {
      setEffectivePlacement('top');
    } else {
      setEffectivePlacement('bottom');
    }
  }, [placement]);

  const handleToggle = (e) => {
    e?.stopPropagation?.();
    const nextState = isControlled ? !controlledIsOpen : !internalIsOpen;
    if (nextState) {
      calculatePosition();
      // Broadcast to close all other open dropdown menus across the UI
      window.dispatchEvent(new CustomEvent('close-other-menus', { 
        detail: { target: containerRef.current } 
      }));
    }
    if (isControlled) {
      controlledOnToggle?.(!controlledIsOpen);
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const handleClose = () => {
    if (isControlled) {
      controlledOnToggle?.(false);
    } else {
      setInternalIsOpen(false);
    }
  };

  // Close dropdown menu on click/touch outside or when another menu opens
  useEffect(() => {
    if (!open) return;

    calculatePosition();

    const handleGlobalClose = (e) => {
      if (e.detail?.target !== containerRef.current) {
        handleClose();
      }
    };

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleClose();
      }
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('close-other-menus', handleGlobalClose);

    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('close-other-menus', handleGlobalClose);
    };
  }, [open, calculatePosition]);

  const alignmentClass = align === 'left' ? 'left-0' : 'right-0';
  const placementClass = effectivePlacement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5';

  return (
    <div 
      ref={containerRef} 
      className="relative inline-block shrink-0"
      style={{ zIndex: open ? 60 : 'auto' }}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={`p-1.5 rounded-lg transition cursor-pointer ${
          open
            ? isDark
              ? 'text-zinc-100 bg-zinc-800'
              : 'text-zinc-900 bg-zinc-200'
            : isDark
            ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80'
            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
        } ${buttonClassName}`}
        title={title}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <TriggerIcon className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: 100 }}
          className={`absolute ${alignmentClass} ${placementClass} w-32 rounded-xl shadow-2xl p-1 z-[100] animate-in fade-in zoom-in-95 duration-100 border ${
            isDark
              ? 'bg-zinc-900 border-zinc-800 text-zinc-200 shadow-2xl'
              : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
          } ${menuClassName}`}
        >
          {typeof children === 'function' ? (
            children({ close: handleClose })
          ) : children ? (
            children
          ) : (
            items.map((item, idx) => {
              const Icon = item.icon;
              const isDanger = item.variant === 'danger' || item.danger;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                    item.onClick?.(e);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDanger
                      ? 'text-red-400 hover:bg-red-500/10'
                      : isDark
                      ? 'hover:bg-white/10 text-zinc-200 hover:text-white'
                      : 'hover:bg-black/5 text-zinc-800 hover:text-zinc-950'
                  } ${item.className || ''}`}
                >
                  {Icon && (
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isDanger
                          ? 'text-red-400'
                          : isDark
                          ? 'text-zinc-400'
                          : 'text-zinc-500'
                      }`}
                    />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
