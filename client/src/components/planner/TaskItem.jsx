import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function TaskItem({ task, onToggle, onDelete, onUpdate }) {
  const { isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState(task.priority || 'medium');

  const handleSave = () => {
    if (!editTitle.trim()) return;
    if (onUpdate) {
      onUpdate(task.id, editTitle.trim(), editPriority);
    }
    setIsEditing(false);
  };

  const getPriorityColor = (priority) => {
    if (isDark) {
      switch (priority) {
        case 'high': return 'bg-red-950/20 text-red-500 border-red-900/30';
        case 'medium': return 'bg-yellow-955/20 text-yellow-500 border-yellow-900/30';
        case 'low': return 'bg-emerald-950/20 text-emerald-500 border-emerald-900/30';
        default: return 'bg-zinc-900 text-zinc-500 border-zinc-800';
      }
    } else {
      switch (priority) {
        case 'high': return 'bg-red-50 text-red-600 border-red-200';
        case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        default: return 'bg-orange-50 text-orange-700 border-orange-200';
      }
    }
  };

  const getPriorityDotColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-orange-400';
    }
  };

  return (
    <div className={`group flex items-center justify-between gap-3 p-3.5 border rounded-xl transition duration-200 ${
      isDark 
        ? 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/20' 
        : 'bg-white border-orange-200 hover:border-orange-300 shadow-xs'
    }`}>
      {isEditing ? (
        /* Edit Mode */
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className={`flex-1 rounded-lg px-2.5 py-1 text-xs outline-none border transition ${
              isDark 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-700' 
                : 'bg-orange-50/50 border-orange-200 text-orange-950 focus:border-orange-500'
            }`}
            required
            autoFocus
          />
          <div className="flex items-center gap-2">
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              className={`rounded-lg px-2 py-1 text-[10px] sm:text-xs font-semibold outline-none border ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
                  : 'bg-white border-orange-200 text-orange-950'
              }`}
            >
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
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
          <div className="flex items-center gap-3 min-w-0">
            {/* Custom Checkbox */}
            <button
              type="button"
              onClick={() => onToggle(task.id, task.completed)}
              className={`w-4.5 h-4.5 rounded border transition flex items-center justify-center cursor-pointer shrink-0 ${
                task.completed
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : isDark 
                    ? 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50' 
                    : 'border-orange-300 hover:border-orange-400 hover:bg-orange-50'
              }`}
            >
              {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
            </button>

            {/* Task Title text */}
            <span className={`text-xs sm:text-sm font-medium truncate ${
              task.completed 
                ? isDark ? 'line-through text-zinc-600' : 'line-through text-orange-900/40'
                : isDark ? 'text-zinc-200' : 'text-orange-950'
            }`} title={task.title}>
              {task.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Priority Badge */}
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase flex items-center gap-1 select-none ${getPriorityColor(task.priority)}`}>
              <span className={`w-1 h-1 rounded-full ${getPriorityDotColor(task.priority)}`} />
              {task.priority}
            </span>

            {/* Hover Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-icon"
                title="Edit Task"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="btn-icon hover:!text-red-500"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
