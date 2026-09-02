import { useEffect, useRef, useState } from 'react';
import { Loader2, Plus, ChevronUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import SlashCommandMenu from './SlashCommandMenu';

export default function ChatInput({ value, onChange, onSubmit, isLoading, isStreaming }) {
  const { isDark } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 140)}px`;
    }
  }, [value]);

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

  return (
    <div className="relative w-full flex items-end gap-2">
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
        className="btn-icon !w-7 !h-7 !p-1 text-zinc-400 hover:text-orange-500 shrink-0"
        title="Add command (/)"
        aria-label="Add command"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Input textarea */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask Guruji anything..."
        className={`flex-1 max-h-32 resize-none bg-transparent outline-none border-none py-1.5 text-sm custom-scrollbar font-sans leading-relaxed ${
          isDark ? 'text-zinc-100 placeholder-zinc-550' : 'text-orange-950 placeholder-orange-400'
        }`}
        disabled={isLoading}
      />

      {/* Send message button */}
      <button
        type="button"
        disabled={isLoading || isStreaming || !value.trim()}
        onClick={onSubmit}
        className="btn-primary !w-7 !h-7 !p-0 !rounded-full shrink-0 shadow-xs flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
        title="Send message"
        aria-label="Send message"
      >
        {isStreaming ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ChevronUp className="w-4 h-4 stroke-[2.5]" />
        )}
      </button>
    </div>
  );
}
