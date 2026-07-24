import React, { useState } from 'react';
import {
  X, Search, Trash2, Calendar, Clock, Video, Loader2,
  Sparkles, Terminal, AlertCircle, RefreshCw, LogIn, LogOut, User, Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HistorySidebar({
  isOpen,
  onClose,
  history = [],
  onSelect,
  onDelete,
  isLoading,
  apiStatus = 'checking',
  checkHealth,
  setShowDisconnectModal,
  isGenerating,
  isTerminalOpen,
  onToggleTerminal,
  logCount,
  onOpenAuthModal,
  onOpenApiKeySettings
}) {
  const { currentUser, getUserDisplayName, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Format date to human-readable string
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' ' + d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration in minutes and seconds
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Filter history by search query
  const filteredHistory = history.filter(item => {
    const title = item.metadata?.title?.toLowerCase() || '';
    const channel = item.metadata?.channel?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return title.includes(query) || channel.includes(query);
  });

  return (
    <>
      {/* Backdrop overlay (dimming background & blur - only on mobile) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 top-[53px] z-[70] bg-black/60 backdrop-blur-sm transition-all duration-300 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
        }`}
      />

      {/* Sliding Drawer Container */}
      <div className={`bg-zinc-950 flex flex-col transition-all duration-300
        /* Phone & Tablet: Slide in from right */
        fixed top-[53px] right-0 h-[calc(100vh-53px)] w-full max-w-[340px] xs:max-w-[400px] z-[80] border-l border-zinc-900 shadow-2xl
        /* Windows / Desktop: Docked to right side like Terminal */
        lg:fixed lg:top-[76px] lg:right-6 lg:left-auto lg:h-[calc(100vh-150px)] lg:w-[420px] xl:w-[480px] lg:max-w-none lg:rounded-xl lg:border lg:border-zinc-800 lg:z-30
        /* Open/Close states */
        ${isOpen 
          ? 'translate-x-0 opacity-100 pointer-events-auto visible' 
          : 'translate-x-full opacity-0 pointer-events-none invisible lg:translate-x-12'
        }`}>

        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none"></div>

        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-900 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-mono font-bold tracking-wider uppercase text-zinc-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              Notes History
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Manage and review your study guides</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Navbar Controls (Only visible on mobile/tablet screens) */}
        <div className="p-4 border-b border-zinc-900 bg-zinc-900/10 space-y-3 lg:hidden shrink-0">
          <h4 className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500">
            System Menu & Controls
          </h4>

          <div className="flex flex-wrap items-center gap-2">
            {/* API Status Badge */}
            <div
              onClick={() => {
                if (apiStatus === 'unhealthy') {
                  setShowDisconnectModal(true);
                } else {
                  checkHealth();
                }
              }}
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 transition text-xs font-medium text-zinc-300"
            >
              {apiStatus === 'checking' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-zinc-400">Connecting...</span>
                </>
              )}
              {apiStatus === 'healthy' && (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400">API Connected</span>
                </>
              )}
              {apiStatus === 'unhealthy' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span className="text-rose-400">Connect API</span>
                </>
              )}
            </div>

            {/* Terminal Toggle Button */}
            <button
              onClick={() => {
                onToggleTerminal();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm ${isTerminalOpen
                ? 'bg-zinc-100 text-zinc-900 font-semibold'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                }`}
            >
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Console</span>
              {logCount > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-950 text-zinc-300 border border-zinc-800">
                  {logCount}
                </span>
              )}
            </button>
          </div>

          {/* User Auth Control */}
          <div className="pt-1.5 border-t border-zinc-900">
            {currentUser ? (
              <div className="flex flex-col gap-2 p-2 bg-zinc-950 rounded-lg border border-zinc-900">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-zinc-700 text-zinc-200 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                    {getUserDisplayName(currentUser).charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-zinc-300 truncate">
                    {getUserDisplayName(currentUser)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose(); // Close sidebar
                      onOpenApiKeySettings();
                    }}
                    className="flex-1 text-center text-[10px] font-semibold text-zinc-305 hover:bg-zinc-900 py-1.5 px-2 rounded transition border border-zinc-800 flex items-center justify-center gap-1"
                  >
                    <Key className="w-3 h-3 text-zinc-400" />
                    API Keys
                  </button>
                  <button
                    onClick={async () => {
                      onClose(); // Close sidebar
                      try {
                        await logout();
                      } catch (err) {
                        console.error('Logout failed:', err);
                      }
                    }}
                    className="flex-1 text-center text-[10px] font-semibold text-rose-450 hover:bg-zinc-900 py-1.5 px-2 rounded transition border border-rose-950/40 hover:border-rose-900/60"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onClose(); // Close sidebar
                  onOpenAuthModal('login');
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 animate-pulse" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-zinc-900 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by title or channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 hover:text-zinc-300 px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {!currentUser ? (
            <div className="h-60 flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xs font-bold text-zinc-300">Sign in to view history</p>
              <p className="text-[10px] text-zinc-500 max-w-[200px] mt-1.5 mb-4 leading-relaxed">
                You must be authenticated to save and load your notes history.
              </p>
            </div>
          ) : isLoading ? (
            <div className="h-40 flex flex-col items-center justify-center text-zinc-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              <span className="text-xs">Loading history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center p-4">
              <Video className="w-8 h-8 text-zinc-700 mb-2" />
              <p className="text-xs font-bold text-zinc-400">No notes found</p>
              <p className="text-[10px] text-zinc-500 max-w-[200px] mt-1">
                {searchQuery ? 'Try adjusting your search query.' : 'Pasted URLs and generated study guides will save here.'}
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="group relative bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/80 rounded-xl p-3 flex gap-3 transition cursor-pointer"
                onClick={() => onSelect(item)}
              >
                {/* Thumbnail Preview */}
                <div className="relative shrink-0 w-20 aspect-video rounded overflow-hidden bg-zinc-950 border border-zinc-900">
                  {item.metadata?.thumbnail ? (
                    <img
                      src={item.metadata.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                      <Video className="w-4 h-4" />
                    </div>
                  )}
                  {item.metadata?.duration && (
                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 text-[8px] bg-black/85 text-zinc-300 rounded font-mono">
                      {formatDuration(item.metadata.duration)}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1 pr-6">
                  <h4 className="text-xs font-bold text-zinc-200 line-clamp-2 leading-snug group-hover:text-zinc-100 transition">
                    {item.metadata?.title || 'Study Notes'}
                  </h4>
                  <p className="text-[9px] text-zinc-400 truncate">
                    {item.metadata?.channel || 'YouTube Video'}
                  </p>
                  <p className="text-[9px] text-zinc-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-600" />
                    {formatDate(item.createdAtDate)}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid triggering selection
                    if (confirm('Are you sure you want to delete these study notes from your history?')) {
                      onDelete(item.id);
                    }
                  }}
                  className="absolute right-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-800/80 transition duration-150"
                  title="Delete from history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
