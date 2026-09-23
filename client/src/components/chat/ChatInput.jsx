import { useEffect, useRef, useState } from 'react';
import { Loader2, Plus, ChevronUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import SlashCommandMenu from './SlashCommandMenu';

export default function ChatInput({ value, onChange, onSubmit, isLoading, isStreaming, isFullScreen = false }) {
  const { isDark } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, isFullScreen ? 180 : 140)}px`;
    }
  }, [value, isFullScreen]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange(text);

    // Detect cursor position and check if it's currently on a word starting with "/"
    const cursor = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursor);
    const lastWordMatch = textBeforeCursor.match(/\/(\w*)$/);

    if (lastWordMatch) {
      setShowMenu(true);
      setSearchQuery(lastWordMatch[0]);
    } else {
      setShowMenu(false);
    }
  };

  const handleCommandSelect = (cmd) => {
    if (textareaRef.current) {
      const text = textareaRef.current.value;
      const cursor = textareaRef.current.selectionStart;
      const textBeforeCursor = text.substring(0, cursor);
      const textAfterCursor = text.substring(cursor);
      
      const slashIndex = textBeforeCursor.lastIndexOf('/');
      const newTextBefore = textBeforeCursor.substring(0, slashIndex) + cmd.placeholder;
      
      const newText = newTextBefore + textAfterCursor;
      onChange(newText);
      setShowMenu(false);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = newTextBefore.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (showMenu) {
        return;
      }
      e.preventDefault();
      if (!isLoading && !isStreaming && value.trim()) {
        onSubmit();
      }
    }
  };

  const handlePlusClick = () => {
    if (textareaRef.current) {
      const text = value || '';
      const cursor = textareaRef.current.selectionStart || 0;
      const textBeforeCursor = text.substring(0, cursor);
      const textAfterCursor = text.substring(cursor);
      
      const newText = textBeforeCursor + '/' + textAfterCursor;
      onChange(newText);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = cursor + 1;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 50);
      
      setShowMenu(true);
      setSearchQuery('/');
    } else {
      onChange((value || '') + '/');
      setShowMenu(true);
      setSearchQuery('/');
    }
  };

  const hasValue = Boolean(value?.trim());

  return (
    <div className={`relative w-full flex items-center ${isFullScreen ? 'gap-2 sm:gap-2.5' : 'gap-1.5 sm:gap-2'}`}>
      <SlashCommandMenu
        visible={showMenu}
        searchQuery={searchQuery}
        onSelect={handleCommandSelect}
        onClose={() => setShowMenu(false)}
      />

      {/* Plus / Commands Button */}
      <button
        type="button"
        onClick={handlePlusClick}
        className={`${
          isFullScreen ? 'w-6 h-6 md:w-7 md:h-7' : 'w-5.5 h-5.5 sm:w-6 sm:h-6'
        } rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${
          isDark
            ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
        }`}
        title="Add command (/)"
        aria-label="Add command"
      >
        <Plus className={isFullScreen ? 'w-3.5 h-3.5 md:w-4 md:h-4' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} />
      </button>

      {/* Input textarea */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask Guruji..."
        className={`flex-1 ${isFullScreen ? 'max-h-36' : 'max-h-28'} resize-none bg-transparent outline-none border-none py-0.5 sm:py-1 ${
          isFullScreen ? 'text-xs sm:text-sm md:text-base' : 'text-xs'
        } custom-scrollbar font-sans leading-relaxed ${
          isDark ? 'text-zinc-100 placeholder-zinc-500' : 'text-zinc-900 placeholder-zinc-400'
        }`}
        disabled={isLoading}
      />

      {/* Send message button */}
      <button
        type="button"
        disabled={isLoading || isStreaming || !hasValue}
        onClick={onSubmit}
        className={`${
          isFullScreen ? 'w-6 h-6 md:w-7 md:h-7' : 'w-5.5 h-5.5 sm:w-6 sm:h-6'
        } rounded-full shrink-0 flex items-center justify-center transition shadow-xs ${
          hasValue && !isLoading && !isStreaming
            ? 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer'
            : isDark
            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
            : 'bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-50'
        }`}
        title="Send message"
        aria-label="Send message"
      >
        {isStreaming ? (
          <Loader2 className={`${isFullScreen ? 'w-3.5 h-3.5 md:w-4 md:h-4' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} animate-spin`} />
        ) : (
          <ChevronUp className={`${isFullScreen ? 'w-4 h-4 md:w-4.5 md:h-4.5' : 'w-3.5 h-3.5'} stroke-[2.5]`} />
        )}
      </button>
    </div>
  );
}
