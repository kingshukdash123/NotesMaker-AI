import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThreeDotMenu({
  items = [],
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  align = 'right',
  title = 'Options',
  ariaLabel = 'Options',
  buttonClassName = '',
  menuClassName = '',
  triggerIcon: TriggerIcon = MoreVertical,
  children
}) {
  const { isDark } = useTheme();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const containerRef = useRef(null);

  const isControlled = typeof controlledIsOpen === 'boolean';
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = (e) => {
    e?.stopPropagation?.();
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

  // Close dropdown menu on click/touch outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleClose();
      }
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  const alignmentClass = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div ref={containerRef} className="relative inline-block shrink-0">
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
          className={`absolute ${alignmentClass} top-full mt-1 w-32 rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 border ${
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
                      ? 'hover:bg-zinc-800 text-zinc-200'
                      : 'hover:bg-zinc-50 text-zinc-900'
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
