import React from 'react';
import { X, AlertCircle, RefreshCw, WifiOff, CheckCircle2 } from 'lucide-react';

export default function ApiDisconnectModal({ isOpen, onClose, onConnect, apiStatus }) {
  if (!isOpen) return null;

  const isHealthy = apiStatus === 'healthy';
  const isChecking = apiStatus === 'checking';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Card Container */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow ambient background (Orange when offline/connecting/healthy) */}
        <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isHealthy ? 'bg-orange-500/10' : 'bg-orange-500/5'
        }`}></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-900 transition"
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
              : 'The NotesMaker AI backend is currently offline or sleeping.'}
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
          onClick={onConnect}
          disabled={isChecking || isHealthy}
          className={`w-full py-2.5 px-4 font-semibold text-sm rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-lg disabled:cursor-not-allowed ${
            isHealthy 
              ? 'bg-orange-500 hover:bg-orange-400 text-zinc-950 disabled:opacity-100' 
              : 'bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50'
          }`}
        >
          {isHealthy ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-zinc-950" />
              <span>Connected & Ready</span>
            </>
          ) : isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Starting Server (Wait up to 1 min)...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 text-zinc-950" />
              <span>Connect API & Start Server</span>
            </>
          )}
        </button>

        {/* Footer info */}
        <p className="mt-4 text-center text-[10px] text-zinc-500">
          You can close this modal and use the <span className="text-orange-500/80">🧪 Load Test Notes</span> feature offline.
        </p>
      </div>
    </div>
  );
}
