import { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

export default function CreatePlaylistModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (onCreate) {
      onCreate(name.trim());
    }
    setName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
      <div className="relative max-w-sm w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl glass-panel animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn-icon absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pb-3 border-b border-zinc-900 mb-4">
          <h3 className="text-sm font-bold text-zinc-50 flex items-center gap-2">
            <FolderPlus className="w-4.5 h-4.5 text-orange-500" />
            Create Playlist
          </h3>
          <p className="text-[11px] text-zinc-500">Group your study videos by course or subject.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Playlist Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. JEE Physics, Linear Algebra"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-550 focus:outline-none focus:border-zinc-700 transition"
              required
              maxLength={30}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="btn-primary w-full py-2.5 px-4 text-xs font-bold"
          >
            <span>Create Playlist</span>
          </button>
        </form>
      </div>
    </div>
  );
}
