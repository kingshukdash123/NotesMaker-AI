import { useState } from 'react';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function CreatePlaylistModal({ isOpen, onClose, onCreate }) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (onCreate) {
        await onCreate(name.trim());
      }
      setName('');
      onClose();
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
      <div className={`relative max-w-sm w-full ${isDark ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xl'} border rounded-2xl p-5 max-h-[90vh] overflow-y-auto custom-scrollbar`}>
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`btn-icon absolute right-4 top-4 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className={`space-y-1 pb-3 border-b ${isDark ? 'border-zinc-900' : 'border-zinc-100'} mb-4`}>
          <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-50' : 'text-zinc-900'} flex items-center gap-2`}>
            <FolderPlus className="w-4.5 h-4.5 text-orange-500" />
            Create Playlist
          </h3>
          <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Group your study videos by course or subject.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Playlist Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. JEE Physics, Linear Algebra"
              className={`w-full ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-700' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:bg-white'} border rounded-xl px-3 py-2 text-xs transition`}
              required
              maxLength={30}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="btn-primary w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating Playlist...</span>
              </>
            ) : (
              <span>Create Playlist</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
