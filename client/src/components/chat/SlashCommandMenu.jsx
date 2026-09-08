import { useEffect, useState, useRef } from 'react';
import { Search, FileText, CheckSquare, Mail, Calculator, Code, Trash2, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const COMMANDS = [
  { name: '/explain', description: 'Break down a complex study concept', icon: Search, placeholder: '/explain ' },
  { name: '/summarize', description: 'Condense a text or topic', icon: FileText, placeholder: '/summarize ' },
  { name: '/todo', description: 'Create a structured study checklist', icon: CheckSquare, placeholder: '/todo ' },
  { name: '/email', description: 'Draft a professional email/letter', icon: Mail, placeholder: '/email ' },
  { name: '/math', description: 'Solve a math problem step-by-step', icon: Calculator, placeholder: '/math ' },
  { name: '/code', description: 'Write or debug code in any language', icon: Code, placeholder: '/code ' },
  { name: '/clear', description: 'Clear active chat history and memory', icon: Trash2, placeholder: '/clear' }
];

export default function SlashCommandMenu({ visible, searchQuery, onSelect, onClose }) {
  const { isDark } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Filter commands based on search query
  const filtered = COMMANDS.filter(cmd => 
    cmd.name.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!visible || filtered.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onSelect(filtered[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [visible, filtered, selectedIndex, onSelect, onClose]);

  // Scroll active item into view if needed
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div 
      className={`absolute bottom-[calc(100%+8px)] left-0 w-full max-w-sm max-w-[calc(100vw-2.5rem)] ${
        isDark ? 'bg-zinc-950 border-zinc-800/80 shadow-2xl' : 'bg-white border-zinc-200 shadow-xl'
      } border rounded-xl p-1.5 z-[150] animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md`}
    >
      <div className={`px-2.5 py-1.5 flex items-center justify-between border-b ${
        isDark ? 'border-zinc-900/60' : 'border-zinc-100'
      } mb-1`}>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Slash Commands</span>
        <button
          type="button"
          onClick={onClose}
          className="btn-icon !p-0.5"
          title="Close (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div 
        ref={containerRef}
        className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-0.5"
      >
        {filtered.map((cmd, idx) => {
          const isSelected = idx === selectedIndex;
          const Icon = cmd.icon;
          return (
            <button
              key={cmd.name}
              type="button"
              onClick={() => onSelect(cmd)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-150 cursor-pointer ${
                isSelected 
                  ? isDark 
                    ? 'bg-orange-950/20 border border-orange-900/30 text-orange-400 font-bold' 
                    : 'bg-orange-500/10 border border-orange-500/20 text-orange-600 font-bold'
                  : isDark 
                    ? 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent' 
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
              }`}
            >
              <div className={`p-1 rounded ${
                isDark ? 'bg-zinc-900/80 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
              } border shrink-0`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono">{cmd.name}</div>
                <div className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">{cmd.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
