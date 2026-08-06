import React from 'react';
import { Lock, LogIn } from 'lucide-react';

export default function AuthWall({ title, description, onOpenAuthModal, children }) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden my-4 border border-zinc-800/40 bg-zinc-950/20">
      {/* Blurred Preview Children */}
      <div className="select-none pointer-events-none filter blur-[6px] opacity-25 min-h-[300px]">
        {children}
      </div>

      {/* Lock Overlay Shield */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-[2px] z-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center mb-5 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl"></div>
          <Lock className="w-7 h-7 text-amber-500 animate-pulse" />
        </div>
        
        <h3 className="text-xl font-bold text-zinc-50 mb-2">
          {title || "Locked Feature"}
        </h3>
        
        <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
          {description || "Please sign in or register to unlock access to this feature."}
        </p>

        <button
          onClick={() => onOpenAuthModal('login')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold shadow-lg transition duration-200 hover:scale-[1.02]"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to Unlock</span>
        </button>
      </div>
    </div>
  );
}
