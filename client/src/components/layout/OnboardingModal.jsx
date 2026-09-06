import { useState } from 'react';
import { 
  GraduationCap, 
  Target, 
  Lightbulb, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Loader2,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  UserModel,
  EDUCATION_LEVELS, 
  FIELDS_OF_STUDY, 
  TARGET_GOALS, 
  EXPLANATION_STYLES, 
  MENTOR_TONES,
  DEFAULT_STUDENT_PREFERENCES
} from '../../models/userModel';

export default function OnboardingModal({ isOpen, onClose }) {
  const { isDark } = useTheme();
  const { savePreferences, skipUserOnboarding, userProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial state from existing profile or defaults from UserModel
  const [formData, setFormData] = useState({
    educationLevel: userProfile?.preferences?.educationLevel || DEFAULT_STUDENT_PREFERENCES.educationLevel,
    fieldOfStudy: userProfile?.preferences?.fieldOfStudy || DEFAULT_STUDENT_PREFERENCES.fieldOfStudy,
    targetGoal: userProfile?.preferences?.targetGoal || DEFAULT_STUDENT_PREFERENCES.targetGoal,
    customGoal: '',
    explanationStyle: userProfile?.preferences?.explanationStyle || DEFAULT_STUDENT_PREFERENCES.explanationStyle,
    mentorTone: userProfile?.preferences?.mentorTone || DEFAULT_STUDENT_PREFERENCES.mentorTone,
  });

  if (!isOpen) return null;

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      if (skipUserOnboarding) {
        await skipUserOnboarding();
      }
      onClose();
    } catch (err) {
      console.error('Failed to skip onboarding:', err);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const finalGoal = UserModel.formatTargetGoal(formData.targetGoal, formData.customGoal);

      await savePreferences({
        educationLevel: formData.educationLevel,
        fieldOfStudy: formData.fieldOfStudy,
        targetGoal: finalGoal,
        explanationStyle: formData.explanationStyle,
        mentorTone: formData.mentorTone,
      });

      onClose();
    } catch (err) {
      console.error('Failed to save onboarding preferences:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className={`relative w-full max-w-xl border rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] ${
          isDark 
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
            : 'bg-white border-orange-200 text-orange-950 shadow-xl shadow-orange-500/5'
        }`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-orange-500/[0.04] rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header & Progress */}
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2.5">
            <span className={`p-2 rounded-xl border flex-shrink-0 ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-orange-400' : 'bg-orange-100 border-orange-200 text-orange-600'
            }`}>
              <Compass className="w-5 h-5" />
            </span>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-orange-950'}`}>
                Personalize Your AI Mentor
              </h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-orange-800/70'}`}>
                Help Guruji understand your academic background to give tailored guidance
              </p>
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    step <= currentStep 
                      ? 'bg-orange-500' 
                      : (isDark ? 'bg-zinc-800' : 'bg-orange-100')
                  }`} 
                />
              </div>
            ))}
          </div>
          <div className={`flex justify-between text-[11px] font-medium mt-1.5 px-0.5 ${isDark ? 'text-zinc-500' : 'text-orange-800/60'}`}>
            <span className={currentStep === 1 ? (isDark ? 'text-zinc-200 font-semibold' : 'text-orange-950 font-bold') : ''}>1. Academic Stage</span>
            <span className={currentStep === 2 ? (isDark ? 'text-zinc-200 font-semibold' : 'text-orange-950 font-bold') : ''}>2. Target Goal</span>
            <span className={currentStep === 3 ? (isDark ? 'text-zinc-200 font-semibold' : 'text-orange-950 font-bold') : ''}>3. Mentor Style</span>
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">
          {/* STEP 1: Academic Level & Stream */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <label className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>
                  <GraduationCap className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-orange-600'}`} />
                  <span>What stage of education are you in?</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EDUCATION_LEVELS.map((level) => {
                    const isSelected = formData.educationLevel === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, educationLevel: level.id }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? (isDark 
                                ? 'border-orange-500 bg-zinc-900/90 text-zinc-100 shadow-sm shadow-orange-500/10' 
                                : 'border-orange-500 bg-orange-100/60 text-orange-950 ring-1 ring-orange-500/20 shadow-xs')
                            : (isDark 
                                ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900/70' 
                                : 'border-orange-200/80 bg-orange-50/40 hover:border-orange-300 text-orange-900 hover:bg-orange-50/80')
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-zinc-100' : 'text-orange-950') : (isDark ? 'text-zinc-300' : 'text-orange-900')}`}>{level.label}</p>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                        </div>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-orange-900/70'}`}>{level.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>
                  <BookOpen className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-orange-600'}`} />
                  <span>What is your primary stream or field?</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FIELDS_OF_STUDY.map((field) => {
                    const isSelected = formData.fieldOfStudy === field.id;
                    return (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, fieldOfStudy: field.id }))}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? (isDark 
                                ? 'border-orange-500 bg-zinc-900/90 text-zinc-100 shadow-sm shadow-orange-500/10' 
                                : 'border-orange-500 bg-orange-100/60 text-orange-950 ring-1 ring-orange-500/20 shadow-xs')
                            : (isDark 
                                ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900/70' 
                                : 'border-orange-200/80 bg-orange-50/40 hover:border-orange-300 text-orange-900 hover:bg-orange-50/80')
                        }`}
                      >
                        <span className="text-base mb-1">{field.icon}</span>
                        <p className={`text-xs font-semibold leading-tight ${isSelected ? (isDark ? 'text-zinc-100' : 'text-orange-950') : (isDark ? 'text-zinc-300' : 'text-orange-900')}`}>{field.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Target Goal & Exams */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <label className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>
                  <Target className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-orange-600'}`} />
                  <span>What are you currently preparing for?</span>
                </label>
                <div className="space-y-2">
                  {TARGET_GOALS.map((goal) => {
                    const isSelected = formData.targetGoal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, targetGoal: goal.id }))}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? (isDark 
                                ? 'border-orange-500 bg-zinc-900/90 text-zinc-100 shadow-sm shadow-orange-500/10' 
                                : 'border-orange-500 bg-orange-100/60 text-orange-950 ring-1 ring-orange-500/20 shadow-xs')
                            : (isDark 
                                ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900/70' 
                                : 'border-orange-200/80 bg-orange-50/40 hover:border-orange-300 text-orange-900 hover:bg-orange-50/80')
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-zinc-100' : 'text-orange-950') : (isDark ? 'text-zinc-300' : 'text-orange-900')}`}>{goal.label}</p>
                          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-orange-900/70'}`}>{goal.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-orange-400 flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
                  Optional: Specific Exam or Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. GATE CS 2026, Calculus 2, NEET Biology, UPSC Prelims"
                  value={formData.customGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, customGoal: e.target.value }))}
                  maxLength={60}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition ${
                    isDark 
                      ? 'bg-zinc-900/60 border-zinc-800 focus:border-orange-500 text-zinc-100 placeholder-zinc-500' 
                      : 'bg-orange-50/50 border-orange-200 focus:border-orange-500 text-orange-950 placeholder-orange-900/40'
                  }`}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Explanation Style & Mentor Tone */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <label className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>
                  <Lightbulb className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-orange-600'}`} />
                  <span>How do you prefer Guruji to explain concepts?</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXPLANATION_STYLES.map((style) => {
                    const isSelected = formData.explanationStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, explanationStyle: style.id }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? (isDark 
                                ? 'border-orange-500 bg-zinc-900/90 text-zinc-100 shadow-sm shadow-orange-500/10' 
                                : 'border-orange-500 bg-orange-100/60 text-orange-950 ring-1 ring-orange-500/20 shadow-xs')
                            : (isDark 
                                ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900/70' 
                                : 'border-orange-200/80 bg-orange-50/40 hover:border-orange-300 text-orange-900 hover:bg-orange-50/80')
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-zinc-100' : 'text-orange-950') : (isDark ? 'text-zinc-300' : 'text-orange-900')}`}>{style.label}</p>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                        </div>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-orange-900/70'}`}>{style.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  <span>Guruji&apos;s Mentor Persona & Tone</span>
                </label>
                <div className="space-y-2">
                  {MENTOR_TONES.map((tone) => {
                    const isSelected = formData.mentorTone === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, mentorTone: tone.id }))}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? (isDark 
                                ? 'border-orange-500 bg-zinc-900/90 text-zinc-100 shadow-sm shadow-orange-500/10' 
                                : 'border-orange-500 bg-orange-100/60 text-orange-950 ring-1 ring-orange-500/20 shadow-xs')
                            : (isDark 
                                ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900/70' 
                                : 'border-orange-200/80 bg-orange-50/40 hover:border-orange-300 text-orange-900 hover:bg-orange-50/80')
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-zinc-100' : 'text-orange-950') : (isDark ? 'text-zinc-300' : 'text-orange-900')}`}>{tone.label}</p>
                          <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-orange-900/70'}`}>{tone.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-orange-400 flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className={`mt-6 pt-4 border-t flex items-center justify-between gap-3 flex-shrink-0 ${
          isDark ? 'border-zinc-800' : 'border-orange-100'
        }`}>
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={isSubmitting}
              className="hero-static-btn !py-2 !px-4 !text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className={`text-xs transition cursor-pointer px-2 ${
                isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-orange-800/60 hover:text-orange-950'
              }`}
            >
              Skip for now
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="hero-rotating-border-btn group cursor-pointer"
            >
              <div className="rotating-beam" />
              <div className="inner-content !py-2.5 !px-5 !text-xs !font-bold">
                <span>Continue</span>
                <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="hero-rotating-border-btn group disabled:opacity-50 cursor-pointer"
            >
              <div className="rotating-beam" />
              <div className="inner-content !py-2.5 !px-5 !text-xs !font-bold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 text-orange-400" />
                    <span>Start Learning with Guruji</span>
                  </>
                )}
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
