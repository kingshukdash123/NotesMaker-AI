import { ChevronLeft, ChevronRight, Crown } from 'lucide-react';

export default function MonthlyCalendar({ 
  monthTasks = [], 
  currentDate, // Date object or formatted string for current date context
  onMonthChange, 
  onSelectDate 
}) {
  const date = new Date(currentDate);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed

  // Heading e.g. "August 2026"
  const formattedMonthHeading = date.toLocaleDateString([], { month: 'long', year: 'numeric' });

  // Get calendar details
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create list of days in grid
  const days = [];

  // Add padding days for previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, prevMonthDays - i);
    days.push({
      dateObj: prevDate,
      dayNumber: prevMonthDays - i,
      isCurrentMonth: false,
      dateStr: formatDateStr(prevDate)
    });
  }

  // Add current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const currDate = new Date(year, month, i);
    days.push({
      dateObj: currDate,
      dayNumber: i,
      isCurrentMonth: true,
      dateStr: formatDateStr(currDate)
    });
  }

  // Add padding days for next month to complete 6-row grid (42 cells)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    days.push({
      dateObj: nextDate,
      dayNumber: i,
      isCurrentMonth: false,
      dateStr: formatDateStr(nextDate)
    });
  }

  // Date formatter helper: YYYY-MM-DD local
  function formatDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const todayStr = formatDateStr(new Date());

  // Group tasks by date string for O(1) cell lookup
  const taskGroups = {};
  monthTasks.forEach(task => {
    if (!taskGroups[task.date]) {
      taskGroups[task.date] = { total: 0, completedCount: 0, taskList: [] };
    }
    taskGroups[task.date].total++;
    if (task.completed) {
      taskGroups[task.date].completedCount++;
    }
    taskGroups[task.date].taskList.push(task);
  });

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Handle Month Navigation
  const handlePrevMonth = () => {
    const prevMonth = new Date(year, month - 1, 1);
    if (onMonthChange) onMonthChange(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(year, month + 1, 1);
    if (onMonthChange) onMonthChange(nextMonth);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Month Navigation Control Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-2">
        <h3 className="text-xs sm:text-sm font-bold text-zinc-100">{formattedMonthHeading}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="btn-icon"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="btn-icon"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Titles */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold text-zinc-550 select-none pb-1">
        {weekdays.map(day => <span key={day}>{day}</span>)}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const stats = taskGroups[cell.dateStr] || { total: 0, completedCount: 0, taskList: [] };
          const allDone = stats.total > 0 && stats.completedCount === stats.total;
          
          return (
            <div
              key={idx}
              onClick={() => onSelectDate && onSelectDate(cell.dateObj)}
              className={`min-h-[46px] sm:min-h-[60px] p-1 sm:p-1.5 border rounded-xl flex flex-col justify-between cursor-pointer transition select-none ${
                cell.isCurrentMonth
                  ? isToday
                    ? 'bg-orange-500/5 border-orange-500 hover:bg-orange-500/10'
                    : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-800'
                  : 'bg-zinc-950/10 border-zinc-950/20 text-zinc-700 hover:border-zinc-900/60'
              }`}
            >
              {/* Cell Header: Crown on Left, Day Number on Right */}
              <div className="flex items-center justify-between w-full min-h-[16px]">
                {allDone ? (
                  <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500/20 shrink-0" title="All goals completed! 👑" />
                ) : (
                  <div className="w-3 h-3" />
                )}
                
                <span className={`text-[10px] font-bold ${
                  isToday && cell.isCurrentMonth
                    ? 'text-orange-400'
                    : cell.isCurrentMonth ? 'text-zinc-400' : 'text-zinc-750'
                }`}>
                  {cell.dayNumber}
                </span>
              </div>

              {/* Task Dot List */}
              {stats.total > 0 && (
                <div className="flex flex-wrap gap-0.5 justify-center pb-0.5 max-w-full">
                  {stats.taskList.map((t, tIdx) => {
                    if (t.completed) {
                      return (
                        <span 
                          key={tIdx} 
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" 
                          title={`${t.title} (Completed)`} 
                        />
                      );
                    } else {
                      let dotStyle = 'bg-zinc-700';
                      if (t.priority === 'high') dotStyle = 'bg-red-950/40 border border-red-500/50';
                      else if (t.priority === 'medium') dotStyle = 'bg-yellow-950/40 border border-yellow-500/50';
                      else if (t.priority === 'low') dotStyle = 'bg-emerald-950/40 border border-emerald-500/50';
                      return (
                        <span 
                          key={tIdx} 
                          className={`w-1.5 h-1.5 rounded-full ${dotStyle} shrink-0`} 
                          title={`${t.title} (Pending)`} 
                        />
                      );
                    }
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center text-[9px] font-mono text-zinc-550 pt-2 select-none">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Completed Task
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-950/40 border border-red-500/50" />
          High Pending
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-950/40 border border-yellow-500/50" />
          Medium Pending
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/50" />
          Low Pending
        </span>
        <span className="flex items-center gap-1">
          <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20" />
          All Completed
        </span>
      </div>
    </div>
  );
}
