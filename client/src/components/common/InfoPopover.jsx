import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import CustomButton from './CustomButton';

export default function InfoPopover({
  title,
  children,
  className = '',
  buttonLabel = 'How it works'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);
  const { isDark } = useTheme();

  // Close on outside click or Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label={buttonLabel}
        aria-expanded={isOpen}
        title={buttonLabel}
        className={`p-1 rounded-lg transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 ${
          isOpen
            ? isDark 
              ? 'text-orange-400 bg-orange-950/40' 
              : 'text-orange-600 bg-orange-50'
            : isDark
              ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 active:bg-zinc-800'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200'
        }`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {/* Floating Modal via createPortal — Never clipped or hidden */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div 
            ref={popoverRef}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 duration-150 select-text text-left border ${
              isDark 
                ? 'bg-zinc-950 border-zinc-800 text-zinc-200 shadow-black/90' 
                : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-2.5 mb-3">
              <h5 className={`text-sm font-bold tracking-tight flex items-center gap-1.5 ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}>
                <HelpCircle className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{title || buttonLabel}</span>
              </h5>
              <CustomButton
                variant="ghost"
                size="xs"
                onClick={() => setIsOpen(false)}
                className="!p-1.5 !min-h-0 !rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </CustomButton>
            </div>

            {/* Body */}
            <div className={`text-xs space-y-2 leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
              {children}
            </div>

            {/* Footer (no top/bottom border) */}
            <div className="pt-3 mt-3 flex justify-end">
              <CustomButton
                variant="primary"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Got it
              </CustomButton>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
