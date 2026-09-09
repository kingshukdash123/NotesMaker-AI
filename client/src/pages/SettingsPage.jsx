import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Palette,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Target,
  Lightbulb,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  EDUCATION_LEVELS,
  FIELDS_OF_STUDY,
  EXPLANATION_STYLES,
  MENTOR_TONES,
  DEFAULT_STUDENT_PREFERENCES,
} from '../models/userModel';
import DocSectionCard from '../components/common/DocSectionCard';
import TabPillSwitcher from '../components/common/TabPillSwitcher';
import DocPageHeader from '../components/common/DocPageHeader';

const EDUCATION_OPTIONS = EDUCATION_LEVELS.map((l) => l.id);
const STREAM_OPTIONS = FIELDS_OF_STUDY.map((f) => f.id);
const STYLE_OPTIONS = EXPLANATION_STYLES.map((s) => s.id);
const TONE_OPTIONS = MENTOR_TONES.map((t) => t.id);

const TABS = [
  { id: 'mentor', label: 'Mentor Profile', icon: GraduationCap },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function SettingsPage() {
  const { isDark, setTheme } = useTheme();
  const { currentUser, userProfile, savePreferences } = useAuth();

  const [activeTab, setActiveTab] = useState('mentor');

  // ─── Mentor Preferences State ──────────────────────────────────────────────
  const [educationLevel, setEducationLevel] = useState(DEFAULT_STUDENT_PREFERENCES.educationLevel);
  const [fieldOfStudy, setFieldOfStudy] = useState(DEFAULT_STUDENT_PREFERENCES.fieldOfStudy);
  const [targetGoal, setTargetGoal] = useState(DEFAULT_STUDENT_PREFERENCES.targetGoal);
  const [explanationStyle, setExplanationStyle] = useState(DEFAULT_STUDENT_PREFERENCES.explanationStyle);
  const [mentorTone, setMentorTone] = useState(DEFAULT_STUDENT_PREFERENCES.mentorTone);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState('');
  const [prefError, setPrefError] = useState('');

  // Load preferences from user profile
  useEffect(() => {
    if (userProfile?.preferences) {
      setEducationLevel(userProfile.preferences.educationLevel || DEFAULT_STUDENT_PREFERENCES.educationLevel);
      setFieldOfStudy(userProfile.preferences.fieldOfStudy || DEFAULT_STUDENT_PREFERENCES.fieldOfStudy);
      setTargetGoal(userProfile.preferences.targetGoal || DEFAULT_STUDENT_PREFERENCES.targetGoal);
      setExplanationStyle(userProfile.preferences.explanationStyle || DEFAULT_STUDENT_PREFERENCES.explanationStyle);
      setMentorTone(userProfile.preferences.mentorTone || DEFAULT_STUDENT_PREFERENCES.mentorTone);
    }
  }, [userProfile]);

  const handleSavePreferences = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser) return;

    setIsSavingPrefs(true);
    setPrefError('');
    setPrefSuccess('');

    try {
      await savePreferences({
        educationLevel,
        fieldOfStudy,
        targetGoal: targetGoal.trim() || 'General Learning & Exams',
        explanationStyle,
        mentorTone,
      });
      setPrefSuccess('Mentor preferences updated successfully!');
      setTimeout(() => setPrefSuccess(''), 3500);
    } catch (err) {
      console.error('Failed to update mentor preferences:', err);
      setPrefError('Failed to save mentor preferences. Please try again.');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // ─── Theme Colors matching Legal Docs / PolicyPage ────────────────────────
  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const textPrimary = isDark ? 'text-zinc-50' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-500' : 'text-zinc-500';
  const inputBg = isDark ? 'bg-zinc-900 border-zinc-800 placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-zinc-400';

  return (
    <div className={`flex-1 w-full h-full flex flex-col min-h-0 overflow-hidden ${bg}`}>
      {/* ── Pinned Header Section ── */}
      <div className="w-full shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-4 space-y-4">
          {/* ── Page Header using Reusable DocPageHeader ── */}
          <DocPageHeader
            title="Application Settings"
            subtitle="Configure your Guruji mentor persona and theme appearance."
          />

          {/* ── Main Tab Switcher using Reusable TabPillSwitcher ── */}
          <TabPillSwitcher
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* ── Tab Context Subtitle ── */}
          <div className={`text-xs ${textMuted}`}>
            {activeTab === 'mentor' && 'Adjust your academic preferences, focus milestones, and mentor interaction style.'}
            {activeTab === 'appearance' && 'Customize theme mode and color aesthetics.'}
          </div>
        </div>
      </div>

      {/* ── Scrollable Settings Content Area ── */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* ════════════════════════════════════════════════════════════════
              TAB 1: MENTOR PROFILE
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'mentor' && (
            <div className="space-y-5">
              {/* Feedback Alerts */}
              {prefSuccess && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 shadow-xs text-emerald-900'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span className="font-semibold">{prefSuccess}</span>
                </div>
              )}
              {prefError && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
                  isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-900'
                }`}>
                  <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <span className="font-semibold">{prefError}</span>
                </div>
              )}

              {/* Card 1: Personalized Guruji Guidance Form */}
              <DocSectionCard
                title="Personalized Guruji Guidance"
                icon={GraduationCap}
                subtitle="These preferences instruct Guruji how to communicate with you — calibrating explanation depth, problem difficulty, analogies, and pacing specifically to your academic level."
              >
                <form onSubmit={handleSavePreferences} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Academic Level */}
                    <div className="space-y-1.5">
                      <label className={`block text-xs font-semibold flex items-center gap-1.5 ${textPrimary}`}>
                        <GraduationCap className="w-3.5 h-3.5 text-orange-500" />
                        <span>Academic Level</span>
                      </label>
                      <select
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 transition cursor-pointer ${inputBg} ${textPrimary}`}
                      >
                        {EDUCATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className={isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stream / Field */}
                    <div className="space-y-1.5">
                      <label className={`block text-xs font-semibold flex items-center gap-1.5 ${textPrimary}`}>
                        <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                        <span>Stream / Field of Study</span>
                      </label>
                      <select
                        value={fieldOfStudy}
                        onChange={(e) => setFieldOfStudy(e.target.value)}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 transition cursor-pointer ${inputBg} ${textPrimary}`}
                      >
                        {STREAM_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className={isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Goal */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className={`block text-xs font-semibold flex items-center gap-1.5 ${textPrimary}`}>
                        <Target className="w-3.5 h-3.5 text-orange-500" />
                        <span>Current Goal or Target Exam</span>
                      </label>
                      <input
                        type="text"
                        value={targetGoal}
                        onChange={(e) => setTargetGoal(e.target.value)}
                        placeholder="e.g. Semester Exams, JEE Advanced, GATE CS, Placement Prep"
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 transition ${inputBg} ${textPrimary}`}
                      />
                    </div>

                    {/* Explanation Style */}
                    <div className="space-y-1.5">
                      <label className={`block text-xs font-semibold flex items-center gap-1.5 ${textPrimary}`}>
                        <Lightbulb className="w-3.5 h-3.5 text-orange-500" />
                        <span>Preferred Explanation Style</span>
                      </label>
                      <select
                        value={explanationStyle}
                        onChange={(e) => setExplanationStyle(e.target.value)}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 transition cursor-pointer ${inputBg} ${textPrimary}`}
                      >
                        {STYLE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className={isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mentor Tone */}
                    <div className="space-y-1.5">
                      <label className={`block text-xs font-semibold flex items-center gap-1.5 ${textPrimary}`}>
                        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                        <span>Guruji Mentor Tone</span>
                      </label>
                      <select
                        value={mentorTone}
                        onChange={(e) => setMentorTone(e.target.value)}
                        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 transition cursor-pointer ${inputBg} ${textPrimary}`}
                      >
                        {TONE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className={isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingPrefs}
                      className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      {isSavingPrefs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Mentor Preferences</span>
                    </button>
                  </div>
                </form>
              </DocSectionCard>

              {/* Card 2: Active Persona Snapshot */}
              <DocSectionCard
                title="Active Persona Snapshot"
                icon={BookOpen}
                subtitle="A quick summary of how Guruji recognizes your current academic profile in real time:"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Level</p>
                    <p className={`text-xs font-semibold truncate mt-0.5 ${textPrimary}`} title={educationLevel}>
                      {educationLevel}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Field</p>
                    <p className={`text-xs font-semibold truncate mt-0.5 ${textPrimary}`} title={fieldOfStudy}>
                      {fieldOfStudy}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border col-span-2 sm:col-span-1 ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Goal</p>
                    <p className={`text-xs font-semibold truncate mt-0.5 ${textPrimary}`} title={targetGoal || 'General Learning & Exams'}>
                      {targetGoal || 'General Learning & Exams'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Style</p>
                    <p className={`text-xs font-semibold truncate mt-0.5 ${textPrimary}`} title={explanationStyle}>
                      {explanationStyle}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Tone</p>
                    <p className={`text-xs font-semibold truncate mt-0.5 ${textPrimary}`} title={mentorTone}>
                      {mentorTone}
                    </p>
                  </div>
                </div>
              </DocSectionCard>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              TAB 2: APPEARANCE
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
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
          )}

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
