import React from 'react';
import { BookOpen, MessageSquare, BarChart2, Maximize2, Minimize2 } from 'lucide-react';

export default function Tabs({ activeTab, setActiveTab, isFullscreen = false, onToggleFullscreen }) {
  const tabs = [
    { id: 'notes', label: 'Study Notes', icon: BookOpen },
    { id: 'summary', label: 'Summary Dashboard', icon: BarChart2 },
    { id: 'qa', label: 'Video Q&A', icon: MessageSquare },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 px-2 sm:px-0">
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full relative px-10">
        <div className="flex flex-1 justify-center border-b border-zinc-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 text-[10px] sm:text-xs font-semibold tracking-wide transition-all duration-300 relative ${isActive
                    ? 'text-zinc-50 font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                <Icon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isActive ? 'text-orange-500' : 'text-zinc-500'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full animate-fadeIn" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onToggleFullscreen && onToggleFullscreen(!isFullscreen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          title={isFullscreen ? "Exit full screen" : "Enter full screen"}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
