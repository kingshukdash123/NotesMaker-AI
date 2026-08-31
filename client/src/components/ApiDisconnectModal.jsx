import { useState, useEffect } from 'react';
import { X, AlertCircle, RefreshCw, WifiOff, CheckCircle2 } from 'lucide-react';

export default function ApiDisconnectModal({ isOpen, onClose, onConnect, onRetry, apiStatus }) {
  const [isLocalLoading, setIsLocalLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsLocalLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isHealthy = apiStatus === 'healthy';
  const isChecking = apiStatus === 'checking' || isLocalLoading;

  const handleAction = async () => {
    if (isChecking || isHealthy) return;
    setIsLocalLoading(true);
    const action = onConnect || onRetry;
    if (action) {
      try {
        await action(true);
      } catch (err) {
        console.error('Failed to connect API server:', err);
      } finally {
        setIsLocalLoading(false);
      }
    } else {
      setIsLocalLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Card Container */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-8 shadow-2xl overflow-x-hidden overflow-y-auto custom-scrollbar max-h-[90vh]">
        {/* Glow ambient background */}
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isHealthy ? 'bg-orange-500/10' : 'bg-orange-500/5'
        }`}></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn-icon absolute top-4 right-4 text-zinc-400 hover:text-zinc-100"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 shadow-inner transition-colors duration-500 ${
            isHealthy 
              ? 'bg-orange-950/20 border border-orange-500/30 text-orange-400' 
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
          }`}>
            {isHealthy ? (
              <CheckCircle2 className="w-6 h-6 text-orange-400 animate-scaleIn" />
            ) : isChecking ? (
              <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
            ) : (
              <WifiOff className="w-6 h-6 text-zinc-500" />
            )}
          </div>
          <h3 className="text-xl font-bold text-zinc-50 tracking-tight transition-all duration-300">
            {isHealthy ? 'API Server Connected' : isChecking ? 'Connecting to API...' : 'API Server Disconnected'}
          </h3>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed transition-all duration-300">
            {isHealthy 
              ? 'Success! The server has booted and is fully operational.' 
              : isChecking
              ? 'Attempting to ping and wake up the API backend. Please wait...'
              : 'The Pathshala AI backend is currently offline or sleeping.'}
          </p>
        </div>

        {/* Instructions Panel */}
        <div className={`mb-6 p-4 rounded-xl border text-xs space-y-2.5 transition-all duration-300 ${
          isHealthy 
            ? 'bg-orange-950/10 border-orange-500/20 text-orange-300' 
            : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300'
        }`}>
          <div className="flex gap-2">
            {isHealthy ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-orange-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-orange-500 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-zinc-200">
                {isHealthy ? 'Server Operational' : 'How to start the server:'}
              </p>
              <p className="text-zinc-400 mt-1 leading-normal">
                {isHealthy 
                  ? 'All services are connected and running. You can now fetch metadata and generate study notes.' 
                  : 'Please click the Connect API button below. If the server is spin-down (inactive), it will take about 1-2 minutes to fully boot up and start processing.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAction}
          disabled={isChecking || isHealthy}
          className="btn-primary w-full py-2.5 px-4 text-sm font-bold"
        >
          {isHealthy ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Connected & Ready</span>
            </>
          ) : isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Starting Server (Please wait)...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Connect API & Start Server</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
