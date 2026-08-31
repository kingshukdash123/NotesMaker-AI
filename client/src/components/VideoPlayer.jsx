import { useState, useEffect, useRef } from 'react';
import { User, Subtitles, PlayCircle, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Tabs from './Tabs';

export default function VideoPlayer({ 
  videoId, 
  videoUrl,
  metadata, 
  activeTab, 
  setActiveTab, 
  currentUser, 
  isSaved, 
  onToggleSave, 
  isCheckingSaved, 
  hasNotes = false, 
  onBack, 
  isFullscreen = false 
}) {
  const { isDark } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVideoCollapsed, setIsVideoCollapsed] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleSeek = (event) => {
      const seconds = event.detail?.seconds;
      if (typeof seconds === 'number' && iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
            '*'
          );
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
        } catch (err) {
          console.warn('Failed to postMessage to YouTube iframe:', err);
        }
      }
    };

    window.addEventListener('seek-video', handleSeek);
    return () => {
      window.removeEventListener('seek-video', handleSeek);
    };
  }, []);

  if (!videoId) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-6 text-center rounded-xl glass-panel min-h-[300px] border ${
        isDark ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-orange-200/80'
      }`}>
        <PlayCircle className={`w-12 h-12 mb-3 animate-pulse ${isDark ? 'text-zinc-600' : 'text-orange-300'}`} />
        <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-orange-950'}`}>No video tutorial loaded</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0`;

  return (
    <div className={`flex-1 flex flex-col min-h-0 border rounded-xl overflow-hidden shadow-2xl glass-panel animate-in fade-in duration-300 ${
      isDark ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-orange-200/80'
    }`}>
      {/* Player Header with Back Button, Title and Mobile Collapse Toggle */}
      {!isFullscreen && (
        <div className={`shrink-0 flex items-center justify-between px-3 py-2 border-b ${
          isDark ? 'bg-zinc-900/50 border-zinc-900' : 'bg-orange-50/50 border-orange-100'
        }`}>
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="btn-icon"
                title="Back to Discover"
                aria-label="Back to Discover"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>
              Watch & Learn
            </h3>
          </div>

          {/* Collapse Video Toggle in Header on Phone & Tablet */}
          <button
            type="button"
            onClick={() => setIsVideoCollapsed(!isVideoCollapsed)}
            className="btn-icon lg:hidden flex items-center gap-1 text-[11px] font-semibold px-2 py-1"
            title={isVideoCollapsed ? "Expand YouTube video" : "Collapse YouTube video"}
            aria-label={isVideoCollapsed ? "Expand YouTube video" : "Collapse YouTube video"}
          >
            {isVideoCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-orange-400 font-bold">Show Video</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide Video</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Video Embed IFrame */}
      <div className={`relative w-full aspect-video bg-black video-player-surface shrink-0 border-b overflow-hidden transition-all duration-300 ${
        isVideoCollapsed ? 'hidden lg:block' : 'block'
      } ${
        isDark ? 'border-zinc-900' : 'border-orange-100'
      }`}>
        {!isLoaded && (
          <div className="absolute inset-0 skeleton-shimmer bg-zinc-900/90 z-10 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-zinc-950/80 border border-zinc-800 flex items-center justify-center shadow-lg">
              <PlayCircle className="w-6 h-6 text-orange-500/70" />
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={metadata?.title || 'YouTube video player'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
          className="w-full h-full"
        />
      </div>

      {/* Collapsed Video Quick-Expand Banner */}
      {isVideoCollapsed && (
        <div 
          onClick={() => setIsVideoCollapsed(false)}
          className={`lg:hidden px-3.5 py-2.5 flex items-center justify-center gap-2 border-b cursor-pointer transition select-none ${
            isDark 
              ? 'bg-orange-950/25 border-orange-900/30 text-orange-400 hover:bg-orange-950/35' 
              : 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100'
          }`}
        >
          <PlayCircle className="w-4 h-4 text-orange-500 animate-pulse shrink-0" />
          <span className="text-xs font-semibold">YouTube video collapsed (Tap to show)</span>
        </div>
      )}

      {/* Study Tools & Actions Tabs Bar */}
      <div className={`shrink-0 px-4 py-3 sm:py-3.5 border-b ${
        isDark ? 'border-zinc-900/80 bg-transparent' : 'border-orange-100/80 bg-transparent'
      }`}>
        <Tabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentUser={currentUser}
          videoId={videoId}
          videoUrl={videoUrl}
          metadata={metadata}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
          isCheckingSaved={isCheckingSaved}
          hasNotes={hasNotes}
        />
      </div>

      {/* Video Information & Subtitles */}
      {!isFullscreen && (
        <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4 ${hasNotes ? 'hidden lg:block' : 'block'}`}>
          <div>
            <h2 className={`text-sm sm:text-base font-bold leading-snug ${
              isDark ? 'text-zinc-100' : 'text-orange-950'
            }`}>
              {metadata?.title || 'YouTube Video'}
            </h2>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <User className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
              <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-orange-900'}`}>{metadata?.channel || 'Unknown Creator'}</span>
            </div>
          </div>

          {/* Available Languages Display */}
          {metadata?.available_languages && metadata.available_languages.length > 0 && (
            <div className={`space-y-2 pt-2 border-t ${
              isDark ? 'border-zinc-900/60' : 'border-orange-100'
            }`}>
              <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold ${
                isDark ? 'text-zinc-500' : 'text-orange-700'
              }`}>
                <Subtitles className="w-3.5 h-3.5" />
                <span>Available Video Subtitles ({metadata.available_languages.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {metadata.available_languages.map((lang) => (
                  <span
                    key={lang.code}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100' 
                        : 'bg-orange-50 border-orange-200 text-orange-950 hover:bg-orange-100'
                    }`}
                  >
                    {lang.name} ({lang.code})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
