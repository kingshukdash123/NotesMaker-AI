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

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  if (isUser) {
    return (
      <div className="flex flex-col items-end w-full py-2.5 px-2">
        <div className={`max-w-[88%] rounded-2xl rounded-tr-xs px-3.5 py-2.5 sm:px-4 sm:py-2.5 text-xs leading-relaxed font-sans shadow-xs break-words ${
          isDark 
            ? 'bg-zinc-900 text-zinc-100' 
            : 'bg-orange-100 text-orange-950 font-medium'
        }`}>
          <div className="whitespace-pre-wrap">{text}</div>
        </div>
        {formattedTime && (
          <span className={`text-[9px] mt-1 pr-1 font-mono select-none ${
            isDark ? 'text-zinc-600' : 'text-orange-900/60'
          }`}>
            {formattedTime}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 w-full py-3.5 px-2 transition duration-150 border-b relative ${
      isDark ? 'border-zinc-900/40' : 'border-orange-100'
    }`}>
      {/* Bot Icon */}
      <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 select-none border ${
        isDark 
          ? 'bg-orange-950/20 border-orange-900/30 text-orange-400 shadow-sm' 
          : 'bg-orange-100 border-orange-300 text-orange-600 shadow-xs'
      }`}>
        N
      </div>

      <div className="flex-1 min-w-0">
        <div className={`max-w-none text-xs leading-relaxed ${
          isDark 
            ? 'text-zinc-200 selection:bg-zinc-800' 
            : 'text-orange-950 selection:bg-orange-100'
        }`}>
          <MarkdownRenderer content={text} className="chat-markdown" />
          
          {isStreaming && !text && (
            <div className="flex items-center gap-1 py-1">
              <span className="w-1 h-1 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-orange-500 rounded-full animate-bounce"></span>
            </div>
          )}
          
          {isStreaming && text && (
            <span className="inline-block w-1 h-3 bg-orange-500 animate-pulse ml-0.5 align-middle"></span>
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
