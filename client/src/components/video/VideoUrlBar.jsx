import { useState } from 'react';
import { PlayCircle, Loader2 } from 'lucide-react';
import { extractYoutubeVideoId } from '../../services/firebase/notesService';

export default function VideoUrlBar({ onUrlSubmit, isLoading = false }) {
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const videoId = extractYoutubeVideoId(inputUrl);
    if (!videoId) {
      alert('Please enter a valid YouTube video URL.');
      return;
    }
    if (onUrlSubmit) {
      onUrlSubmit(inputUrl, videoId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative group">
      <div className="relative flex items-center">
        <PlayCircle className="absolute left-4 w-4 h-4 text-zinc-500 group-focus-within:text-orange-500 transition duration-200" />
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Paste any YouTube lecture URL to directly load & watch..."
          className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl pl-11 pr-24 py-2.5 text-xs text-zinc-150 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputUrl.trim()}
          className="btn-primary absolute right-1.5 px-3 py-1.5 text-xs font-bold"
        >
          {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>Load Video</span>
        </button>
      </div>
    </form>
  );
}
