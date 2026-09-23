import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import MarkdownRenderer from '../common/MarkdownRenderer';

export default function ChatMessage({ message, isStreaming = false }) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user' || message.sender === 'user';
  const text = message.content || message.text || '';

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return null;
    try {
      const date = typeof timestamp?.toDate === 'function' 
        ? timestamp.toDate() 
        : new Date(timestamp);
      if (isNaN(date.getTime())) return null;

      const isCurrentYear = date.getFullYear() === new Date().getFullYear();
      const datePart = date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        ...(isCurrentYear ? {} : { year: 'numeric' })
      });
      const timePart = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${datePart}, ${timePart}`;
    } catch {
      return null;
    }
  };

  const formattedDateTime = formatDateTime(message.timestamp || message.createdAt || message.created_at || message.date);

  if (isUser) {
    return (
      <div className="flex flex-col items-end w-full py-1.5 sm:py-2 px-1 sm:px-2">
        <div className={`max-w-[88%] rounded-2xl rounded-tr-xs px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm leading-relaxed font-sans shadow-xs break-words border ${
          isDark 
            ? 'bg-zinc-800 border-zinc-700/50 text-zinc-100' 
            : 'bg-zinc-100 border-zinc-200/80 text-zinc-900 font-medium'
        }`}>
          <div className="whitespace-pre-wrap">{text}</div>
        </div>
        {formattedDateTime && (
          <span className={`text-[9px] sm:text-[10px] mt-0.5 pr-1 font-mono select-none ${
            isDark ? 'text-zinc-600' : 'text-zinc-400'
          }`}>
            {formattedDateTime}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-2.5 w-full py-2 sm:py-3 px-1 sm:px-2 transition duration-150 relative">
      {/* Guruji Avatar Badge */}
      <div className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded flex items-center justify-center text-[10px] sm:text-[11px] font-black shrink-0 mt-0.5 select-none border ${
        isDark 
          ? 'bg-orange-950/30 border-orange-900/40 text-orange-400 shadow-sm' 
          : 'bg-orange-500/10 border-orange-500/20 text-orange-600 shadow-xs'
      }`} title="Guruji">
        G
      </div>

      <div className="flex-1 min-w-0">
        <div className={`max-w-none text-xs sm:text-sm leading-relaxed ${
          isDark 
            ? 'text-zinc-200 selection:bg-zinc-800' 
            : 'text-zinc-900 selection:bg-zinc-200'
        }`}>
          {!text && isStreaming ? (
            <div className="space-y-2 py-1 max-w-md w-full animate-pulse">
              <div className={`h-3 sm:h-3.5 w-4/5 rounded-md ${isDark ? 'bg-zinc-800/90' : 'bg-zinc-200'}`} />
              <div className={`h-3 sm:h-3.5 w-full rounded-md ${isDark ? 'bg-zinc-800/90' : 'bg-zinc-200'}`} />
              <div className={`h-3 sm:h-3.5 w-3/5 rounded-md ${isDark ? 'bg-zinc-800/90' : 'bg-zinc-200'}`} />
            </div>
          ) : (
            <MarkdownRenderer content={text} className="chat-markdown" />
          )}
        </div>

        {/* Copy Button */}
        {!isStreaming && text && (
          <div className="flex items-center gap-3.5 mt-2.5 text-zinc-500">
            <button
              type="button"
              onClick={handleCopy}
              className="hover:text-zinc-300 transition duration-150 cursor-pointer p-0.5"
              title={copied ? "Copied!" : "Copy message to clipboard"}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-orange-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
