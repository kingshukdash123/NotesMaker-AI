import { 
  NotebookPen, 
  BarChart2, 
  MessageSquare, 
  Bookmark, 
  Loader2,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import AddToPlaylistPopover from './common/AddToPlaylistPopover';

export default function Tabs({ 
  activeTab, 
  setActiveTab, 
  currentUser,
  videoId,
  videoUrl,
  metadata,
  isSaved,
  onToggleSave,
  isCheckingSaved,
  hasNotes = false,
  isVideoCollapsed = false,
  onToggleCollapseVideo,
  isFullscreen = false,
  onToggleFullscreen,
  isVertical = false,
  className = '' 
}) {
  const { isDark } = useTheme();

  const tools = [
    { id: 'notes', label: 'Study Notes', icon: NotebookPen },
    { id: 'summary', label: 'Summary Dashboard', icon: BarChart2 },
    { id: 'qa', label: 'Video Q&A Companion', icon: MessageSquare },
  ];

  return (
    <div className={`w-full flex flex-col ${isVertical ? 'md:items-center gap-2' : 'gap-1.5'} bg-transparent ${className}`}>
      {/* Header Titles Row (Hidden on mobile phone view & vertical desktop mode) */}
      {!isVertical && (
        <div className="hidden sm:flex items-center justify-between px-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            Study Tools
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            Quick Actions
          </span>
        </div>
      )}

      {/* Buttons Container */}
      <div className={`w-full flex ${
        isVertical 
          ? 'items-center justify-between md:flex-col md:justify-start gap-1.5 sm:gap-2' 
          : 'items-center justify-between gap-2 flex-wrap sm:flex-nowrap'
      }`}>
        {/* 1. Study Tools */}
        <div className={`flex ${isVertical ? 'flex-row md:flex-col' : 'flex-row'} items-center gap-1 sm:gap-1.5 shrink-0`}>
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTab(tool.id)}
                title={tool.label}
                aria-label={tool.label}
                className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center select-none ${
                  isActive
                    ? isDark 
                      ? 'bg-zinc-800 text-zinc-100 font-semibold' 
                      : 'bg-zinc-200 text-zinc-900 font-semibold shadow-2xs'
                    : isDark
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        {/* Divider in vertical desktop mode */}
        {isVertical && (
          <div className={`hidden md:block w-5 h-px my-0.5 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
        )}

        {/* 2. Quick Actions */}
        <div className={`flex ${isVertical ? 'flex-row md:flex-col' : 'flex-row'} items-center gap-1 sm:gap-1.5 shrink-0`}>
          {/* Toggle Hide/Show Video Button */}
          {onToggleCollapseVideo && (
            <button
              type="button"
              onClick={onToggleCollapseVideo}
              title={isVideoCollapsed ? 'Show Video' : 'Hide Video'}
              aria-label={isVideoCollapsed ? 'Show Video' : 'Hide Video'}
              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center select-none ${
                isVideoCollapsed
                  ? isDark 
                    ? 'bg-zinc-800 text-zinc-100 font-semibold' 
                    : 'bg-zinc-200 text-zinc-900 font-semibold shadow-2xs'
                  : isDark
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {isVideoCollapsed ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Zoom / Fullscreen Workspace Toggle Button for all devices */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen / Zoom View'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen / Zoom View'}
              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center select-none ${
                isFullscreen
                  ? isDark 
                    ? 'bg-zinc-800 text-zinc-100 font-semibold' 
                    : 'bg-zinc-200 text-zinc-900 font-semibold shadow-2xs'
                  : isDark
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Save to Library Button */}
          {onToggleSave && (
            <button
              type="button"
              onClick={onToggleSave}
              disabled={isCheckingSaved}
              title={isSaved ? 'Saved to Library' : 'Save to Library'}
              aria-label={isSaved ? 'Saved to Library' : 'Save to Library'}
              className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center select-none ${
                isSaved
                  ? isDark 
                    ? 'text-zinc-100 hover:text-white hover:bg-zinc-800/60' 
                    : 'text-zinc-900 hover:text-black hover:bg-zinc-100'
                  : isDark
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {isCheckingSaved ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              ) : (
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              )}
            </button>
          )}

          {/* Add to Playlist Button & Popover */}
          <AddToPlaylistPopover
            videoId={videoId}
            videoUrl={videoUrl}
            metadata={metadata}
            currentUser={currentUser}
            placement="top"
            align={isVertical ? 'left' : 'right'}
            popoverClassName={isVertical ? 'md:bottom-auto md:top-0 md:left-full md:ml-2 md:right-auto' : ''}
          />
        </div>
      </div>
    </div>
  );
}
