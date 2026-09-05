import {
  BarChart2,
  Search,
  Library,
  Calendar,
  Bot,
  Settings,
  Scale,
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
          } w-64 ${isSidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-orange-200/90'
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
              className={`text-[10px] font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer text-left ${isDark ? 'text-zinc-500 hover:text-orange-400' : 'text-orange-700 hover:text-orange-900'
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
            className={`text-[10px] font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer text-left ${isDark ? 'text-zinc-500 hover:text-orange-400' : 'text-orange-700 hover:text-orange-900'
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
                className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5' : 'gap-3 px-3.5 py-2.5'
                  } ${isActive
                    ? isDark
                      ? 'bg-orange-950/20 text-orange-400 border border-orange-900/30 font-bold'
                      : 'bg-orange-100 text-orange-700 border border-orange-300 font-bold shadow-xs'
                    : isDark
                      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
                      : 'text-orange-950/80 hover:text-orange-700 hover:bg-orange-50/80 border border-transparent'
                  }`}
                title={item.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer controls: Legal, Settings, Profile & API status */}
        <div className={`pt-3 border-t space-y-1.5 ${isDark ? 'border-zinc-900' : 'border-orange-200/80'}`}>
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
                  ? 'bg-orange-950/20 text-orange-400 border border-orange-900/30 font-bold'
                  : 'bg-orange-100 text-orange-700 border border-orange-300 font-bold shadow-xs'
                : isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
                  : 'text-orange-950/80 hover:text-orange-700 hover:bg-orange-50/80 border border-transparent'
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
              setIsSettingsOpen(true);
              setIsSidebarMobileOpen(false);
            }}
            className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${
              isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5' : 'gap-3 px-3.5 py-2.5'
            } ${
              isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                : 'text-orange-950/80 hover:text-orange-700 hover:bg-orange-50/80'
            }`}
            title="Configure Settings"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Settings</span>
          </button>

          {/* Profile Trigger */}
          {/* <button
            onClick={() => {
              setIsProfileOpen(true);
              setIsSidebarMobileOpen(false);
            }}
            className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-2.5' : 'gap-3 px-3.5 py-2.5'
              } ${isDark
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                : 'text-orange-950/80 hover:text-orange-700 hover:bg-orange-50/80'
              }`}
            title="User Profile"
          >
            <User className="w-4 h-4 shrink-0" />
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Profile</span>
          </button> */}
        </div>
      </aside>
    </>
  );
}
