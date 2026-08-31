import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { AlertCircle, HelpCircle, X } from 'lucide-react';

export default function CustomDialogModal() {
  const { isDark } = useTheme();
  const { dialogState, handleDialogResponse } = useApp();
  const { isOpen, title, message, type } = dialogState;

  // Handle Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleDialogResponse(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDialogResponse]);

  if (!isOpen) return null;

  const isConfirm = type === 'confirm';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal card */}
      <div className={`relative w-full max-w-sm border rounded-2xl p-5 sm:p-6 shadow-2xl animate-in scale-in duration-200 max-h-[90vh] overflow-x-hidden overflow-y-auto custom-scrollbar ${
        isDark 
          ? 'bg-zinc-950 border-zinc-900 text-zinc-100' 
          : 'bg-white border-orange-200 text-orange-950 shadow-orange-500/10'
      }`}>
        
        {/* Glow ambient background contained */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top close button (resolves to false) */}
        <button
          type="button"
          onClick={() => handleDialogResponse(false)}
          className="btn-icon absolute top-4 right-4"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dialog Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className={`p-2 rounded-xl shrink-0 ${
            isConfirm 
              ? (isDark ? 'bg-orange-950/30 text-orange-400 border border-orange-900/30' : 'bg-orange-100 text-orange-600 border border-orange-200')
              : (isDark ? 'bg-red-950/30 text-red-400 border border-red-900/30' : 'bg-red-100 text-red-600 border border-red-200')
          }`}>
            {isConfirm ? (
              <HelpCircle className="w-5 h-5 stroke-[2]" />
            ) : (
              <AlertCircle className="w-5 h-5 stroke-[2]" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className={`text-sm font-bold pr-6 ${isDark ? 'text-zinc-100' : 'text-orange-950'}`}>
              {title || (isConfirm ? 'Are you sure?' : 'Notification')}
            </h3>
          </div>
        </div>

        {/* Message Content */}
        <div className={`text-xs leading-relaxed mb-6 whitespace-pre-line ${
          isDark ? 'text-zinc-400' : 'text-orange-900/80'
        }`}>
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          {isConfirm && (
            <button
              type="button"
              onClick={() => handleDialogResponse(false)}
              className="btn-secondary px-4 py-2 text-xs font-bold"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDialogResponse(true)}
            className="btn-primary px-4 py-2 text-xs font-bold"
          >
            <span>{isConfirm ? 'Confirm' : 'OK'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
