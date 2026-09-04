import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getUserNotes, deleteNotes } from '../../services/firebase/notesService';
import LibraryVideoCard from './LibraryVideoCard';
import VideoGridSkeleton from '../skeletons/VideoGridSkeleton';
import { BookOpen } from 'lucide-react';

export default function NotesTab({ 
  onOpenVideo,
  playlists = [],
  onTogglePlaylistAssociation,
  onCreatePlaylist,
  onToggleSave,
  savedVideos = []
}) {
  const { currentUser } = useAuth();
  const { showConfirm } = useApp();
  const [notesList, setNotesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const data = await getUserNotes(currentUser.uid);
      setNotesList(data);
    } catch (err) {
      console.error('Error fetching user notes archive:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleDelete = async (noteId) => {
    if (!currentUser) return;
    const confirmed = await showConfirm('Are you sure you want to delete this study note and syllabus outline?');
    if (confirmed) {
      try {
        await deleteNotes(currentUser.uid, noteId);
        setNotesList(prev => prev.filter(item => item.id !== noteId));
      } catch (err) {
        console.error('Failed to delete study note document:', err);
      }
    }
  };

  const handleOpenNote = (note) => {
    if (onOpenVideo) {
      onOpenVideo({
        videoId: note.metadata?.video_id || '',
        videoUrl: note.videoUrl,
        metadata: note.metadata,
        id: note.id,
        result: note.result
      });
    }
  };

  if (isLoading) {
    return <VideoGridSkeleton count={8} layout="grid" />;
  }

  if (notesList.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-950/20 border border-zinc-900 rounded-2xl py-16 gap-4 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-550">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-300">No study notes yet</h3>
          <p className="text-[10px] sm:text-xs text-zinc-550 max-w-xs mx-auto leading-relaxed">
            All your educational lecture notes and syllabus summaries will be saved here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {/* Archive Header (Pinned) */}
      <div className="border-b border-zinc-900/50 pb-2 shrink-0">
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-550">GENERATED STUDY OUTLINES</span>
      </div>

      {/* Grid listing (Only Grid is Scrollable!) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {notesList.map((note) => {
            const videoObject = {
              videoId: note.metadata?.video_id || '',
              videoUrl: note.videoUrl,
              metadata: note.metadata,
            };

            return (
              <LibraryVideoCard
                key={note.id}
                video={videoObject}
                playlists={playlists}
                onOpen={() => handleOpenNote(note)}
                onDelete={() => handleDelete(note.id)}
                onAddToPlaylist={onTogglePlaylistAssociation}
                onCreatePlaylist={onCreatePlaylist}
                onSave={() => onToggleSave(videoObject)}
                isSaved={savedVideos.some(v => v.videoId === (note.metadata?.video_id || ''))}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
