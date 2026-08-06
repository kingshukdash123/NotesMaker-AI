import { BookOpen, MessageSquare, BarChart2, Sparkles, StepBackIcon, StepBack, ArrowLeft } from 'lucide-react';

export default function Tabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'generator', label: 'Generator', icon: ArrowLeft },
    { id: 'notes', label: 'Study Notes', icon: BookOpen },
    { id: 'summary', label: 'Summary Dashboard', icon: BarChart2 },
    { id: 'qa', label: 'Video Q&A', icon: MessageSquare },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-2 sm:px-0">
      <div className="flex p-1 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/60 rounded-xl max-w-2xl mx-auto shadow-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-semibold tracking-wide transition-all duration-300 relative ${
                isActive
                  ? 'bg-zinc-100 text-zinc-950 shadow-md font-bold scale-[1.02]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className="hidden sm:inline-flex text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 font-bold uppercase tracking-wider ml-1">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
