import { useEffect } from 'react';
import { X, RefreshCw, WifiOff, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ApiDisconnectModal({ isOpen, onClose, onConnect, apiStatus = 'unhealthy' }) {
  const { isDark } = useTheme();

  const isHealthy = apiStatus === 'healthy';
  const isChecking = apiStatus === 'checking';

  // Smooth auto-dismiss when server connects
  useEffect(() => {
    if (isOpen && isHealthy) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isHealthy, onClose]);

  // Handle ESC key press to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = () => {
    if (isChecking || isHealthy) return;
    if (onConnect) {
      onConnect(true);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      {/* Modal Card Container */}
      <div
        className={`relative w-full max-w-md rounded-2xl p-5 sm:p-8 shadow-2xl overflow-x-hidden overflow-y-auto custom-scrollbar max-h-[90vh] ${
          isDark
            ? 'bg-zinc-950 border border-zinc-800 text-zinc-100'
            : 'bg-white border border-orange-200 text-orange-950'
        }`}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn-icon absolute top-4 right-4 text-zinc-400 hover:text-zinc-100"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 shadow-inner ${
              isHealthy
                ? isDark
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                : isChecking
                ? isDark
                  ? 'bg-orange-950/30 border border-orange-500/30 text-orange-400'
                  : 'bg-orange-50 border border-orange-200 text-orange-600'
                : isDark
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                : 'bg-zinc-100 border border-zinc-200 text-zinc-500'
            }`}
          >
            {isHealthy ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            ) : isChecking ? (
              <RefreshCw className="w-6 h-6 animate-spin stroke-[2.2]" />
            ) : (
              <WifiOff className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>

          <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-zinc-50' : 'text-orange-950'}`}>
            {isHealthy
              ? 'Server Connected'
              : isChecking
              ? 'Connecting to Server...'
              : 'Server Offline'}
          </h3>

          <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-orange-900/70'}`}>
            {isHealthy
              ? 'The API server is online and ready.'
              : isChecking
              ? 'The server is waking up. Please wait a moment...'
              : 'Unable to reach the server. Please try reconnecting.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div>
          {isHealthy ? (
            <button
              type="button"
              onClick={onClose}
              className="btn-primary w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready</span>
            </button>
          ) : isChecking ? (
            <button
              type="button"
              disabled
              className="btn-primary w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 opacity-80 cursor-wait"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Waking up server...</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 py-2.5 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAction}
                className="btn-primary flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reconnect</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
