import { Palette, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import DocSectionCard from '../components/common/DocSectionCard';
import DocPageHeader from '../components/common/DocPageHeader';

export default function SettingsPage() {
  const { isDark, setTheme } = useTheme();

  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const textMuted = isDark ? 'text-zinc-500' : 'text-zinc-500';

  return (
    <div className={`flex-1 w-full h-full flex flex-col min-h-0 overflow-hidden ${bg}`}>
      {/* ── Pinned Header Section ── */}
      <div className="w-full shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-4 space-y-4">
          <DocPageHeader
            title="Application Settings"
            subtitle="Manage your visual appearance and interface theme settings."
          />
        </div>
      </div>

      {/* ── Scrollable Settings Content Area ── */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="space-y-5">
            {/* Theme & Color Mode Card */}
            <DocSectionCard
              title="Theme & Color Mode"
              icon={Palette}
              subtitle="Choose your preferred visual aesthetic for Pathshala AI:"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Dark Theme Button */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition cursor-pointer ${
                    isDark
                      ? 'bg-zinc-900 border-orange-500 text-zinc-100 ring-1 ring-orange-500/50 shadow-sm'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-orange-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                  }`}>
                    <Moon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold">Dark Mode</p>
                      {isDark && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${textMuted}`}>Deep obsidian black theme</p>
                  </div>
                </button>

                {/* Light Theme Button */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition cursor-pointer ${
                    !isDark
                      ? 'bg-white border-orange-500 text-zinc-900 ring-1 ring-orange-500/50 shadow-sm'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                    !isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}>
                    <Sun className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold">Light Mode</p>
                      {!isDark && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/15 text-orange-600 border border-orange-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${textMuted}`}>Clean white &amp; neutral black aesthetic</p>
                  </div>
                </button>
              </div>
            </DocSectionCard>
          </div>

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
