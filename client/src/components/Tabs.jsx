import { BookOpen, MessageSquare, BarChart2, Sparkles, StepBackIcon, StepBack, ArrowLeft } from 'lucide-react';

export default function Tabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'notes', label: 'Study Notes', icon: BookOpen },
    { id: 'summary', label: 'Summary Dashboard', icon: BarChart2 },
    { id: 'qa', label: 'Video Q&A', icon: MessageSquare },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-2 sm:px-0">
      <div className="flex border-b border-zinc-800/80 max-w-2xl mx-auto w-full relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 text-[10px] sm:text-xs font-semibold tracking-wide transition-all duration-300 relative ${
                isActive
                  ? 'text-zinc-50 font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isActive ? 'text-orange-500' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className="hidden sm:inline-flex text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/25 font-bold uppercase tracking-wider ml-1">
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full animate-fadeIn" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
