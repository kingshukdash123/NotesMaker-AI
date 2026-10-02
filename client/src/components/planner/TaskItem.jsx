import { useState } from 'react';
import { Trash2, Pencil, Check, X, Loader2, Flame, Clock, ArrowDown, CheckCircle2, Circle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ThreeDotMenu from '../common/ThreeDotMenu';
import CustomSelect from '../common/CustomSelect';

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', icon: <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" /> },
  { value: 'medium', label: 'Medium', icon: <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> },
  { value: 'low', label: 'Low', icon: <ArrowDown className="w-3.5 h-3.5 text-sky-500 shrink-0" /> }
];

export default function TaskItem({ 
  task, 
  onToggle, 
  onDelete, 
  onUpdate,
  isMenuOpen,
  onToggleMenu
}) {
  const { isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState(task.priority || 'medium');
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (e) => {
    if (e) e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (onToggle) {
        await onToggle(task.id, task.completed);
      }
    } catch (err) {
      console.error('Failed to toggle task in TaskItem:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleSave = () => {
    if (!editTitle.trim()) return;
    if (onUpdate) {
      onUpdate(task.id, editTitle.trim(), editPriority);
    }
    setIsEditing(false);
  };

  const getPriorityBadge = (priority = 'medium') => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high') {
      return (
        <div 
          title="High Priority" 
          aria-label="High Priority"
          className={`w-6 h-6 rounded-full relative select-none shrink-0 ${
            isDark 
              ? 'bg-rose-950/40 text-rose-400' 
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          <Flame size={14} className="text-rose-500 absolute inset-0 m-auto" />
        </div>
      );
    }
    if (p === 'low') {
      return (
        <div 
          title="Low Priority" 
          aria-label="Low Priority"
          className={`w-6 h-6 rounded-full relative select-none shrink-0 ${
            isDark 
              ? 'bg-sky-950/40 text-sky-400' 
              : 'bg-sky-100 text-sky-700'
          }`}
        >
          <ArrowDown size={14} className="text-sky-500 absolute inset-0 m-auto" />
        </div>
      );
    }
    return (
      <div 
        title="Medium Priority" 
        aria-label="Medium Priority"
        className={`w-6 h-6 rounded-full relative select-none shrink-0 ${
          isDark 
            ? 'bg-amber-950/40 text-amber-400' 
            : 'bg-amber-100 text-amber-800'
        }`}
      >
        <Clock size={14} className="text-amber-500 absolute inset-0 m-auto" />
      </div>
    );
  };

  const menuItems = [
    {
      label: 'Rename',
      icon: Pencil,
      onClick: () => setIsEditing(true)
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'danger',
      onClick: () => onDelete(task.id)
    }
  ];

  return (
    <div 
      className={`group relative min-h-[38px] sm:min-h-[42px] flex items-center justify-between gap-2.5 px-3 py-1.5 sm:py-2 rounded-xl transition duration-150 select-none ${
        task.completed
          ? isDark 
            ? 'bg-zinc-900/20 text-zinc-500' 
            : 'bg-zinc-100/60 text-zinc-400'
          : isDark
            ? 'bg-zinc-900/40 hover:bg-zinc-900/70 text-zinc-200'
            : 'bg-white hover:bg-zinc-50 text-zinc-900 shadow-2xs'
      }`}
      style={{ zIndex: isMenuOpen ? 50 : 1 }}
    >
      {isEditing ? (
        /* Edit Mode */
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={`flex-1 rounded-lg px-2.5 py-1 text-xs outline-none border border-transparent transition ${
              isDark 
                ? 'bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:bg-zinc-850 focus:border-zinc-700' 
                : 'bg-zinc-100 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-zinc-300'
            }`}
            required
            autoFocus
          />
          <div className="flex items-center gap-2">
            <CustomSelect
              value={editPriority}
              onChange={setEditPriority}
              options={PRIORITY_OPTIONS}
              placement="auto"
              size="xs"
              className="shrink-0"
              triggerClassName={`!border-0 !shadow-none !py-1 !px-2 !rounded-lg text-[10px] sm:text-xs font-semibold ${
                isDark ? '!bg-zinc-900 hover:!bg-zinc-850' : '!bg-zinc-100 hover:!bg-zinc-200'
              }`}
              ariaLabel="Edit task priority"
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleSave}
                className="btn-icon !text-emerald-500 hover:!text-emerald-400"
                title="Save changes"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditTitle(task.title);
                  setEditPriority(task.priority);
                  setIsEditing(false);
                }}
                className="btn-icon !text-red-500 hover:!text-red-400"
                title="Cancel editing"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Read Mode */
        <>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Custom Borderless Checkbox matching Dashboard */}
            <button
              type="button"
              onClick={handleToggle}
              disabled={isToggling}
              className={`p-1.5 -m-1.5 text-zinc-400 shrink-0 focus:outline-none transition-transform ${
                isToggling ? 'cursor-wait' : 'cursor-pointer active:scale-90'
              }`}
              aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              ) : task.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              )}
            </button>

            {/* Task Title text */}
            <span className={`text-xs sm:text-sm font-medium truncate ${
              task.completed 
                ? isDark ? 'line-through text-zinc-600' : 'line-through text-zinc-400'
                : isDark ? 'text-zinc-200' : 'text-zinc-900'
            }`} title={task.title}>
              {task.title}
            </span>
          </div>

          <div 
            className="flex items-center gap-2 shrink-0 relative"
            style={{ zIndex: isMenuOpen ? 50 : 1 }}
          >
            {/* Priority Badge with Icon */}
            {getPriorityBadge(task.priority)}

            {/* Reusable 3-Dot Options Menu (Smart Auto Placement) */}
            <ThreeDotMenu
              items={menuItems}
              isOpen={isMenuOpen}
              onToggle={onToggleMenu}
              placement="auto"
              title="Task options"
              ariaLabel="Task options"
            />
          </div>
        </>
      )}
    </div>
  );
}
