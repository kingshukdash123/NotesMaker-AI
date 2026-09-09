import {
  BarChart2,
  Search,
  Library,
  Calendar,
  Timer,
  Bot,
  CreditCard,
  Gift,
  Settings,
  Scale,
  Wrench,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { LEGAL_SECTIONS } from '../../constants';

export default function Sidebar({
  isSidebarMobileOpen,
  setIsSidebarMobileOpen
}) {
  const {
    activeSection,
    setActiveSection,
    activeVideoId,
    resetActiveVideo,
    setIsSettingsOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed
  } = useApp();

  const { isDark } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { 
      id: 'timer', 
      label: 'Timer', 
      icon: Timer, 
      disabled: true, 
      badge: 'Soon',
      maintenance: true 
    },
    { id: 'assistant', label: 'Guruji', icon: Bot },
  ];

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarMobileOpen && (
        <div
          onClick={() => setIsSidebarMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-[79] lg:hidden mt-[53px]"
        />
      )}

      {/* Left Navigation Sidebar */}
      <aside
        className={`fixed top-[53px] bottom-0 left-0 border-r z-[80] flex flex-col p-3 transition-all duration-300 lg:translate-x-0 overflow-y-auto custom-scrollbar ${isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
          } w-64 ${isSidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'
          }`}
      >
        {/* Toggle Collapse Button for Desktop */}
        <div className={`hidden lg:flex items-center mb-4 px-1.5 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => {
                resetActiveVideo();
                setActiveSection('dashboard');
              }}
              className={`text-[10px] font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer text-left ${isDark ? 'text-zinc-500 hover:text-orange-400' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              title="Go to Dashboard"
            >
              Pathshala
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="btn-icon"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Mobile Header indicator */}
        <div className="lg:hidden block px-2 mb-4">
          <button
            type="button"
            onClick={() => {
              resetActiveVideo();
              setActiveSection('dashboard');
              if (setIsSidebarMobileOpen) setIsSidebarMobileOpen(false);
            }}
            className={`text-[10px] font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer text-left ${isDark ? 'text-zinc-500 hover:text-orange-400' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            title="Go to Dashboard"
          >
            Pathshala
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isDisabled = Boolean(item.disabled);

            if (isDisabled) {
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled
                  className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide select-none cursor-not-allowed opacity-60 ${
                    isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5' : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isDark
                      ? 'text-zinc-500 hover:text-zinc-400 bg-zinc-900/10'
                      : 'text-zinc-400 hover:text-zinc-500 bg-zinc-50/50'
                  }`}
                  title={`${item.label} (Under Maintenance)`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon className="w-4 h-4 shrink-0" />
                    {isSidebarCollapsed && (
                      <span className={`hidden lg:block absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500 ring-1.5 ${isDark ? 'ring-zinc-950' : 'ring-white'}`} />
                    )}
                  </div>
                  <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                  {item.maintenance && (
                    <span className={`${isSidebarCollapsed ? 'lg:hidden' : ''} ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                      isDark 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <Wrench className="w-2.5 h-2.5 shrink-0" />
                      <span>{item.badge || 'Soon'}</span>
                    </span>
                  )}
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (activeVideoId) {
                    resetActiveVideo();
                  }
                  setActiveSection(item.id);
                  setIsSidebarMobileOpen(false);
                }}
                className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
                  isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5' : 'gap-3 px-3.5 py-2.5'
                } ${
                  isActive
                    ? isDark
                      ? 'bg-orange-950/20 text-orange-400 font-bold'
                      : 'bg-zinc-100 text-zinc-900 font-bold'
                    : isDark
                      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer controls: Billing, Refer, Legal, Settings */}
        <div className={`pt-3 border-t space-y-1.5 ${isDark ? 'border-zinc-900' : 'border-zinc-200'}`}>
          {/* Billing & Plans Tab (Disabled / Maintenance) */}
          <button
            type="button"
            disabled
            className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide select-none cursor-not-allowed opacity-60 ${
              isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5' : 'gap-3 px-3.5 py-2.5'
            } ${
              isDark
                ? 'text-zinc-500 hover:text-zinc-400 bg-zinc-900/10'
                : 'text-zinc-400 hover:text-zinc-500 bg-zinc-50/50'
            }`}
            title="Billing & Plans (Under Maintenance)"
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <CreditCard className="w-4 h-4 shrink-0" />
              {isSidebarCollapsed && (
                <span className={`hidden lg:block absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500 ring-1.5 ${isDark ? 'ring-zinc-950' : 'ring-white'}`} />
              )}
            </div>
            <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>Billing &amp; Plans</span>
            <span className={`${isSidebarCollapsed ? 'lg:hidden' : ''} ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 ${
              isDark 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <Wrench className="w-2.5 h-2.5 shrink-0" />
              <span>Soon</span>
            </span>
          </button>

          {/* Refer & Rewards Tab (Disabled / Maintenance) */}
          <button
            type="button"
            disabled
            className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide select-none cursor-not-allowed opacity-60 ${
              isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5' : 'gap-3 px-3.5 py-2.5'
            } ${
              isDark
                ? 'text-zinc-500 hover:text-zinc-400 bg-zinc-900/10'
                : 'text-zinc-400 hover:text-zinc-500 bg-zinc-50/50'
            }`}
            title="Refer & Rewards (Under Maintenance)"
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <Gift className="w-4 h-4 shrink-0" />
              {isSidebarCollapsed && (
                <span className={`hidden lg:block absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500 ring-1.5 ${isDark ? 'ring-zinc-950' : 'ring-white'}`} />
              )}
            </div>
            <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>Refer &amp; Rewards</span>
            <span className={`${isSidebarCollapsed ? 'lg:hidden' : ''} ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 ${
              isDark 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <Wrench className="w-2.5 h-2.5 shrink-0" />
              <span>Soon</span>
            </span>
          </button>

          {/* Legal / Policy Tab */}
          <button
            type="button"
            onClick={() => {
              if (activeVideoId) {
                resetActiveVideo();
              }
              setActiveSection(LEGAL_SECTIONS.has(activeSection) ? activeSection : 'privacy');
              setIsSidebarMobileOpen(false);
            }}
            className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
              isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5' : 'gap-3 px-3.5 py-2.5'
            } ${
              LEGAL_SECTIONS.has(activeSection)
                ? isDark
                  ? 'bg-orange-950/20 text-orange-400 font-bold'
                  : 'bg-zinc-100 text-zinc-900 font-bold'
                : isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Legal & Policies"
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Legal &amp; Policies</span>
          </button>

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => {
              if (activeVideoId) {
                resetActiveVideo();
              }
              setActiveSection('settings');
              setIsSidebarMobileOpen(false);
            }}
            className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
              isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5' : 'gap-3 px-3.5 py-2.5'
            } ${
              activeSection === 'settings'
                ? isDark
                  ? 'bg-orange-950/20 text-orange-400 font-bold'
                  : 'bg-zinc-100 text-zinc-900 font-bold'
                : isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Configure Settings"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
