import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Bookmark,
  Trash2,
  Loader2
} from 'lucide-react';
import AddToPlaylistPopover from './AddToPlaylistPopover';

export default function VideoActionButtons({
  video,
  playlists = [],
  isSaved = false,
  onSave,
  onAddToPlaylist,
  onCreatePlaylist,
  onDelete,
  popoverPlacement = 'top', // 'top' | 'bottom'
  popoverAlign = 'right' // 'right' | 'left'
}) {
  const { isDark } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (isSaving || !onSave) return;
    setIsSaving(true);
    try {
      await onSave();
    } catch (err) {
      console.error('Error saving video:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error('Error deleting video:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="flex items-center gap-1 shrink-0 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Direct Save / Bookmark Button */}
      {onSave && (
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className={`p-1.5 rounded-lg transition cursor-pointer disabled:cursor-wait ${
            isSaved
              ? 'text-orange-500 bg-orange-500/15 hover:bg-orange-500/25'
              : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
          title={isSaving ? 'Saving...' : isSaved ? 'Saved in Library' : 'Save to Library'}
          aria-label={isSaved ? 'Remove from saved' : 'Save video'}
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
          ) : (
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          )}
        </button>
      )}

      {/* 2. Direct Add to Playlist Button with Popover */}
      {onAddToPlaylist && (
        <AddToPlaylistPopover
          video={video}
          videoId={video?.videoId}
          playlists={playlists}
          onAddToPlaylist={onAddToPlaylist}
          onCreatePlaylist={onCreatePlaylist}
          placement={popoverPlacement}
          align={popoverAlign}
        />
      )}

      {/* 3. Direct Remove Button (Only shown if onDelete exists) */}
      {onDelete && (
        <button
          type="button"
          disabled={isDeleting}
          onClick={handleDelete}
          className={`p-1.5 rounded-lg transition cursor-pointer disabled:cursor-wait ${
            isDark
              ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
              : 'text-zinc-400 hover:text-red-600 hover:bg-red-50'
          }`}
          title={isDeleting ? 'Removing...' : 'Remove'}
          aria-label="Remove video"
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

