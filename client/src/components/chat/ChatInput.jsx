import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Sliders, Plus, ChevronUp } from 'lucide-react';
import SlashCommandMenu from './SlashCommandMenu';

export default function ChatInput({ value, onChange, onSubmit, isLoading, isStreaming }) {
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
      setSearchQuery(lastWordMatch[0]); // include the slash e.g. "/exp"
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
      
      // Replace the active slash search (e.g. "/exp") with the command placeholder
      const slashIndex = textBeforeCursor.lastIndexOf('/');
      const newTextBefore = textBeforeCursor.substring(0, slashIndex) + cmd.placeholder;
      
      const newText = newTextBefore + textAfterCursor;
      onChange(newText);
      setShowMenu(false);

      // Focus and place cursor at correct index after placeholder
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
        // Let the SlashCommandMenu handle Enter selection
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
    <div className="relative w-full flex flex-col gap-2">
      <SlashCommandMenu
        visible={showMenu}
        searchQuery={searchQuery}
        onSelect={handleCommandSelect}
        onClose={() => setShowMenu(false)}
      />

      {/* Input textarea */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Do anything with AI..."
        className="w-full max-h-36 resize-none bg-transparent outline-none border-none py-1 text-xs text-zinc-100 placeholder-zinc-550 custom-scrollbar font-sans leading-relaxed"
        disabled={isLoading}
      />

      {/* Bottom control row */}
      <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2 shrink-0">
        {/* Left tools icons */}
        <div className="flex items-center gap-2 text-zinc-500">
          <button
            type="button"
            onClick={handlePlusClick}
            className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-350 transition cursor-pointer"
            title="Add command"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-350 transition cursor-pointer"
            title="AI settings"
          >
            {/* <Sliders className="w-3.5 h-3.5" /> */}
          </button>
        </div>

        {/* Right send button with Auto text */}
        <div className="flex items-center gap-2">
          {/* <span className="text-[10px] text-zinc-550 select-none font-medium">Auto</span> */}
          <button
            type="button"
            disabled={isLoading || isStreaming || !value.trim()}
            onClick={onSubmit}
            className="shrink-0 w-6 h-6 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 transition disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-650 cursor-pointer flex items-center justify-center"
          >
            {isStreaming ? (
              <Loader2 className="w-3 h-3 animate-spin text-zinc-950" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
