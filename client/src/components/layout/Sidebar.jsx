import {
  BarChart2,
  Search,
  Library,
  Calendar,
  Timer,
  Users,
  Trophy,
  CreditCard,
  Gift,
  Settings,
  Scale,
  Wrench,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { LEGAL_SECTIONS } from '../../constants';
import OrbitIcon from '../common/OrbitIcon';

export default function Sidebar({
  isSidebarMobileOpen,
  setIsSidebarMobileOpen
}) {
  const {
    activeSection,
    setActiveSection,
    activeVideoId,
    resetActiveVideo,
    isSidebarCollapsed,
    setIsSidebarCollapsed
  } = useApp();

  const { isDark } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'assistant', label: 'Orbit', icon: OrbitIcon },
    { 
      id: 'timer', 
      label: 'Timer', 
      icon: Timer, 
      disabled: true, 
      badge: 'Soon',
      maintenance: true 
    },
    { 
      id: 'leaderboard', 
      label: 'Leaderboard', 
      icon: Trophy, 
      disabled: true, 
      badge: 'Soon',
      maintenance: true 
    },
    { 
      id: 'community', 
      label: 'Community', 
      icon: Users, 
      disabled: true, 
      badge: 'Soon',
      maintenance: true 
    },
  ];

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay with smooth fade in/out */}
      <div
        onClick={() => setIsSidebarMobileOpen(false)}
        className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-[79] lg:hidden mt-[53px] transition-opacity duration-300 ease-in-out ${
          isSidebarMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Left Navigation Sidebar with smooth width & transform transitions */}
      <aside
        className={`fixed top-[53px] bottom-0 left-0 border-r z-[80] flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden overflow-y-auto custom-scrollbar p-3 ${
          isSidebarCollapsed ? 'w-64 md:w-16 md:items-center' : 'w-64'
        } ${
          isSidebarMobileOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full md:translate-x-0'
        } ${
          isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'
        }`}
      >
        {/* Toggle Collapse Button for Desktop */}
        <div className={`hidden md:flex items-center mb-3 min-h-[32px] w-full ${
          isSidebarCollapsed ? 'justify-center' : 'justify-between px-1'
        }`}>
          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => {
                resetActiveVideo();
                setActiveSection('dashboard');
              }}
              className={`text-[10px] font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer text-left whitespace-nowrap truncate ${
                isDark ? 'text-zinc-500 hover:text-orange-400' : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="Go to Dashboard"
            >
              Studyspace
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isSidebarCollapsed ? 'w-10 h-8' : 'w-7 h-7'
            } ${
              isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Mobile Header indicator with Close button */}
        <div className="md:hidden flex items-center justify-between px-1.5 mb-3 min-h-[32px]">
          <button
            type="button"
            onClick={() => {
              resetActiveVideo();
              setActiveSection('dashboard');
              if (setIsSidebarMobileOpen) setIsSidebarMobileOpen(false);
            }}
            className={`text-[11px] font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer text-left ${
              isDark ? 'text-zinc-400 hover:text-orange-400' : 'text-zinc-500 hover:text-zinc-900'
            }`}
            title="Go to Dashboard"
          >
            Workspace
          </button>
          <button
            type="button"
            onClick={() => setIsSidebarMobileOpen?.(false)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Close menu"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className={`flex-1 flex flex-col gap-1.5 w-full ${isSidebarCollapsed ? 'md:items-center' : ''}`}>
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
                  className={`flex items-center rounded-xl text-xs font-semibold tracking-wide select-none cursor-not-allowed opacity-60 overflow-hidden transition-colors w-full h-10 px-2.5 ${
                    isSidebarCollapsed ? 'md:w-10 md:h-10 md:justify-center md:p-0' : ''
                  } ${
                    isDark
                      ? 'text-zinc-500 hover:text-zinc-400 bg-zinc-900/10'
                      : 'text-zinc-400 hover:text-zinc-500 bg-zinc-50/50'
                  }`}
                  title={`${item.label} (${item.badge || 'Coming Soon'})`}
                >
                  <div className="relative shrink-0 flex items-center justify-center w-5 h-5">
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <span className={`truncate whitespace-nowrap text-left max-w-[140px] ml-3 ${
                    isSidebarCollapsed ? 'block md:hidden' : 'block'
                  }`}>
                    {item.label}
                  </span>
                  {item.maintenance && (
                    <span className={`ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap ${
                      isSidebarCollapsed ? 'inline-flex md:hidden' : 'inline-flex'
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
                className={`flex items-center rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer overflow-hidden w-full h-10 px-2.5 ${
                  isSidebarCollapsed ? 'md:w-10 md:h-10 md:justify-center md:p-0' : ''
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
                <div className="shrink-0 flex items-center justify-center w-5 h-5">
                  <Icon className={`${item.id === 'assistant' ? 'w-6 h-6' : 'w-4 h-4'} shrink-0`} />
                </div>
                <span className={`truncate whitespace-nowrap text-left max-w-[160px] ml-3 ${
                  isSidebarCollapsed ? 'block md:hidden' : 'block'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer controls: Billing, Refer, Legal, Settings */}
        <div className={`pt-3 border-t space-y-1.5 w-full ${isSidebarCollapsed ? 'flex flex-col md:items-center' : ''} ${isDark ? 'border-zinc-900' : 'border-zinc-200'}`}>
          {/* Billing & Usage Tab */}
          <button
            type="button"
            onClick={() => {
              if (activeVideoId) {
                resetActiveVideo();
              }
              setActiveSection('billing');
              setIsSidebarMobileOpen(false);
            }}
            className={`flex items-center rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer overflow-hidden w-full h-10 px-2.5 ${
              isSidebarCollapsed ? 'md:w-10 md:h-10 md:justify-center md:p-0' : ''
            } ${
              activeSection === 'billing'
                ? isDark
                  ? 'bg-orange-950/20 text-orange-400 font-bold'
                  : 'bg-zinc-100 text-zinc-900 font-bold'
                : isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Billing & Resource Usage"
          >
            <div className="shrink-0 flex items-center justify-center w-5 h-5">
              <CreditCard className="w-4 h-4 shrink-0" />
            </div>
            <span className={`truncate whitespace-nowrap text-left max-w-[160px] ml-3 ${
              isSidebarCollapsed ? 'block md:hidden' : 'block'
            }`}>
              Billing &amp; Usage
            </span>
          </button>

          {/* Refer & Rewards Tab (Disabled / Maintenance) */}
          <button
            type="button"
            disabled
            className={`flex items-center rounded-xl text-xs font-semibold tracking-wide select-none cursor-not-allowed opacity-60 overflow-hidden transition-colors w-full h-10 px-2.5 ${
              isSidebarCollapsed ? 'md:w-10 md:h-10 md:justify-center md:p-0' : ''
            } ${
              isDark
                ? 'text-zinc-500 hover:text-zinc-400 bg-zinc-900/10'
                : 'text-zinc-400 hover:text-zinc-500 bg-zinc-50/50'
            }`}
            title="Refer & Rewards (Under Maintenance)"
          >
            <div className="relative shrink-0 flex items-center justify-center w-5 h-5">
              <Gift className="w-4 h-4 shrink-0" />
            </div>
            <span className={`truncate whitespace-nowrap text-left max-w-[140px] ml-3 ${
              isSidebarCollapsed ? 'block md:hidden' : 'block'
            }`}>
              Refer &amp; Rewards
            </span>
            <span className={`ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap ${
              isSidebarCollapsed ? 'inline-flex md:hidden' : 'inline-flex'
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
            className={`flex items-center rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer overflow-hidden w-full h-10 px-2.5 ${
              isSidebarCollapsed ? 'md:w-10 md:h-10 md:justify-center md:p-0' : ''
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
            <div className="shrink-0 flex items-center justify-center w-5 h-5">
              <Scale className="w-4 h-4 shrink-0" />
            </div>
            <span className={`truncate whitespace-nowrap text-left max-w-[160px] ml-3 ${
              isSidebarCollapsed ? 'block md:hidden' : 'block'
            }`}>
              Legal &amp; Policies
            </span>
          </button>

          {/* Settings Trigger (Temporarily commented out) */}
          {/* <button
            type="button"
            onClick={() => {
              if (activeVideoId) {
                resetActiveVideo();
              }
              setActiveSection('settings');
              setIsSidebarMobileOpen(false);
            }}
            className={`flex items-center rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer overflow-hidden w-full h-10 px-2.5 ${
              isSidebarCollapsed ? 'md:w-10 md:h-10 md:justify-center md:p-0' : ''
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
            <div className="shrink-0 flex items-center justify-center w-5 h-5">
              <Settings className="w-4 h-4 shrink-0" />
            </div>
            <span className={`truncate whitespace-nowrap text-left max-w-[160px] ml-3 ${
              isSidebarCollapsed ? 'block md:hidden' : 'block'
            }`}>
              Settings
            </span>
          </button> */}
        </div>
      </aside>
    </>
  );
}
