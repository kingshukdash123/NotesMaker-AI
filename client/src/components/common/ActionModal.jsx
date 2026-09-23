import { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ActionModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  iconColor = 'text-orange-500',
  children,
  onSubmit,
  confirmText = 'Confirm',
  confirmVariant = 'primary', // 'primary' | 'danger'
  cancelText = 'Cancel',
  showCancel = true,
  isLoading = false,
  loadingText = 'Processing...',
  isSubmitDisabled = false,
  maxWidth = 'max-w-sm'
}) {
  const { isDark } = useTheme();

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isLoading || isSubmitDisabled) return;
    if (onSubmit) {
      await onSubmit(e);
    }
  };

  const confirmBtnClass = confirmVariant === 'danger'
    ? 'px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50'
    : 'btn-primary text-xs px-4 py-1.5 cursor-pointer disabled:opacity-50 flex items-center gap-1.5';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[160] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className={`relative ${maxWidth} w-full rounded-2xl p-5 shadow-2xl border animate-in zoom-in-95 duration-150 ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className={`absolute right-4 top-4 p-1.5 rounded-lg transition cursor-pointer disabled:opacity-50 ${
            isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
          title="Close"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className={`pb-3 border-b mb-4 ${isDark ? 'border-zinc-800/80' : 'border-zinc-100'}`}>
          <h3 className="text-sm font-bold flex items-center gap-2">
            {Icon && <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />}
            <span>{title}</span>
          </h3>
        </div>

        {/* Content & Action Buttons */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {children}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {showCancel && (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="btn-secondary text-xs px-3 py-1.5 cursor-pointer disabled:opacity-50"
              >
                {cancelText}
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitDisabled || isLoading}
              className={confirmBtnClass}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{loadingText}</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
