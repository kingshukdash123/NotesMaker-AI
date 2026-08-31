import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function AddTaskForm({ onAddTask, placeholder = "e.g. Complete Thermodynamics chapter outline..." }) {
  const { isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    
    if (onAddTask) {
      onAddTask(cleanTitle, priority);
    }
    setTitle('');
    setPriority('medium');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      {/* Task input box */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none border transition ${
          isDark 
            ? 'bg-zinc-950 border-zinc-900 text-zinc-100 placeholder-zinc-500 focus:border-orange-500/60' 
            : 'bg-white border-orange-200 text-orange-950 placeholder-orange-400 focus:border-orange-500 shadow-xs'
        }`}
        required
        maxLength={100}
      />

      <div className="flex items-center gap-3 shrink-0">
        {/* Priority Selector */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className={`rounded-xl px-3 py-2.5 text-xs font-semibold outline-none cursor-pointer border transition ${
            isDark 
              ? 'bg-zinc-950 border-zinc-900 text-zinc-200 focus:border-zinc-800' 
              : 'bg-white border-orange-200 text-orange-950 focus:border-orange-300 shadow-xs'
          }`}
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>

        {/* Add Button */}
        <button
          type="submit"
          disabled={!title.trim()}
          className="btn-primary px-4 py-2.5 text-xs font-bold shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Add Task</span>
        </button>
      </div>
    </form>
  );
}
