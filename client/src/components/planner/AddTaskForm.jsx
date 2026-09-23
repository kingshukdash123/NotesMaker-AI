import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import CustomSelect from '../common/CustomSelect';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', dotColor: 'bg-emerald-500' },
  { value: 'medium', label: 'Med', dotColor: 'bg-amber-500' },
  { value: 'high', label: 'High', dotColor: 'bg-rose-500' }
];

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
    <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-2.5 w-full">
      {/* Task input box */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 min-w-0 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none border-0 transition focus:ring-1 focus:ring-orange-500/50 ${
          isDark 
            ? 'bg-zinc-900/60 text-zinc-100 placeholder-zinc-500 focus:bg-zinc-900' 
            : 'bg-zinc-100/80 text-zinc-900 placeholder-zinc-400 focus:bg-zinc-100/90'
        }`}
        required
        maxLength={100}
      />

      {/* Priority Custom Dropup (Opens upward so it is never clipped by screen bottom) */}
      <CustomSelect
        value={priority}
        onChange={setPriority}
        options={PRIORITY_OPTIONS}
        placement="top"
        align="right"
        size="md"
        className="shrink-0"
        triggerClassName={`!border-0 !shadow-none !py-2 sm:!py-2.5 !px-2.5 sm:!px-3 !rounded-xl text-xs font-semibold ${
          isDark ? '!bg-zinc-900/60 hover:!bg-zinc-900' : '!bg-zinc-100/80 hover:!bg-zinc-100'
        }`}
        ariaLabel="Task priority"
      />

      {/* Add Button (+) */}
      <button
        type="submit"
        disabled={!title.trim()}
        className="btn-primary shrink-0 p-2 sm:px-3.5 sm:py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
        title="Add Task"
        aria-label="Add Task"
      >
        <Plus className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Add Task</span>
      </button>
    </form>
  );
}
