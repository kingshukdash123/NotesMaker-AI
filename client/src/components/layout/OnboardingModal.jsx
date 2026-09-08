import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Target, 
  Lightbulb, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Loader2,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { triggerConfetti } from '../../utils/confetti';
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
  const [isAllSet, setIsAllSet] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(isOpen);

  // Initial state from existing profile or defaults from UserModel
  const [formData, setFormData] = useState({
    educationLevel: userProfile?.preferences?.educationLevel || DEFAULT_STUDENT_PREFERENCES.educationLevel,
    fieldOfStudy: userProfile?.preferences?.fieldOfStudy || DEFAULT_STUDENT_PREFERENCES.fieldOfStudy,
    targetGoal: userProfile?.preferences?.targetGoal || DEFAULT_STUDENT_PREFERENCES.targetGoal,
    customGoal: '',
    explanationStyle: userProfile?.preferences?.explanationStyle || DEFAULT_STUDENT_PREFERENCES.explanationStyle,
    mentorTone: userProfile?.preferences?.mentorTone || DEFAULT_STUDENT_PREFERENCES.mentorTone,
  });

  // Track isOpen and reset if reopened fresh
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAllSet(false);
      setIsFadingOut(false);
      setCurrentStep(1);
    } else if (!isAllSet) {
      setIsVisible(false);
    }
  }, [isOpen, isAllSet]);

  // Handle celebration timing: big text for ~2.2s, then smooth fade-out for 700ms, then close
  useEffect(() => {
    if (isAllSet) {
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 2200);

      const closeTimer = setTimeout(() => {
        setIsVisible(false);
        setIsAllSet(false);
        setIsFadingOut(false);
        onClose?.();
      }, 2900);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [isAllSet, onClose]);

  const handleDismissCelebration = () => {
    if (isAllSet) {
      setIsVisible(false);
      setIsAllSet(false);
      setIsFadingOut(false);
      onClose?.();
    }
  };

  if (!isVisible && !isOpen && !isAllSet) return null;

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      if (skipUserOnboarding) {
        await skipUserOnboarding();
      }
      setIsVisible(false);
      onClose?.();
    } catch (err) {
      console.error('Failed to skip onboarding:', err);
      setIsVisible(false);
      onClose?.();
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

      setIsAllSet(true);
      setIsFadingOut(false);
      triggerConfetti({ particleCount: 160, duration: 3500 });
    } catch (err) {
      console.error('Failed to save onboarding preferences:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAllSet) {
    return (
      <div 
        onClick={handleDismissCelebration}
        className={`fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xs cursor-pointer select-none transition-opacity duration-700 ease-out ${
          isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <h1 
          className={`text-6xl sm:text-8xl md:text-9xl font-black tracking-tight text-white transition-all duration-700 ease-out ${
            isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          All set
        </h1>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div 
        className={`relative w-full max-w-xl border rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[92vh] ${
          isDark 
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
      >
        {/* Subtle Ambient Glow in dark mode only */}
        {isDark && (
          <div className="absolute top-0 right-1/4 w-48 h-48 bg-orange-500/[0.04] rounded-full blur-3xl pointer-events-none"></div>
        )}

        {/* Top Header & Progress */}
            <div className="mb-6 flex-shrink-0">
              <div className="flex items-center gap-3 mb-2.5">
                <span className={`p-2 rounded-xl border flex-shrink-0 ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-orange-400' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
                }`}>
                  <Compass className="w-5 h-5 text-orange-500" />
                </span>
                <div>
                  <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Personalize Your AI Mentor
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
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
                          : (isDark ? 'bg-zinc-800' : 'bg-zinc-200')
                      }`} 
                    />
                  </div>
                ))}
              </div>
              <div className={`flex justify-between text-[11px] font-medium mt-1.5 px-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <span className={currentStep === 1 ? (isDark ? 'text-zinc-200 font-semibold' : 'text-zinc-900 font-bold') : ''}>1. Academic Stage</span>
                <span className={currentStep === 2 ? (isDark ? 'text-zinc-200 font-semibold' : 'text-zinc-900 font-bold') : ''}>2. Target Goal</span>
                <span className={currentStep === 3 ? (isDark ? 'text-zinc-200 font-semibold' : 'text-zinc-900 font-bold') : ''}>3. Mentor Style</span>
              </div>
            </div>

            {/* Dynamic Step Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-5">
              {/* STEP 1: Academic Level & Stream */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div>
                    <label className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                      <GraduationCap className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-orange-500'}`} />
                      <span>What stage of education are you in?</span>
                    </label>
                    <div className="space-y-2">
                      {EDUCATION_LEVELS.map((level) => {
                        const isSelected = formData.educationLevel === level.id;
                        return (
                          <button
                            key={level.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, educationLevel: level.id }))}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? (isDark 
                                    ? 'border-orange-500 bg-zinc-900/90 text-zinc-100 shadow-sm shadow-orange-500/10' 
                                    : 'border-orange-500 bg-white text-zinc-900 ring-1 ring-orange-500/30 shadow-xs')
                                : (isDark 
                                    ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900/70' 
                                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-800 hover:bg-zinc-100')
                            }`}
                          >
                            <div>
                              <p className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-zinc-100' : 'text-zinc-900') : (isDark ? 'text-zinc-300' : 'text-zinc-700')}`}>{level.label}</p>
                              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{level.desc}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-orange-500 flex-shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                      <BookOpen className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-orange-500'}`} />
                      <span>Primary Subject Stream / Field</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FIELDS_OF_STUDY.map((field) => {
                        const isSelected = formData.fieldOfStudy === field.id;
                        return (
                          <button
                            key={field.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, fieldOfStudy: field.id }))}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? (isDark 
                                    ? 'border-orange-500 bg-zinc-900/90 text-zinc-100 shadow-sm shadow-orange-500/10' 
                                    : 'border-orange-500 bg-white text-zinc-900 ring-1 ring-orange-500/30 shadow-xs')
                                : (isDark 
                                    ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900/70' 
                                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-800 hover:bg-zinc-100')
                            }`}
                          >
                            <span className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-zinc-100' : 'text-zinc-900') : (isDark ? 'text-zinc-300' : 'text-zinc-700')}`}>{field.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Target Exam & Goals */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div>
                    <label className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                      <Target className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-orange-500'}`} />
                      <span>What is your current primary academic goal or target exam?</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TARGET_GOALS.map((goal) => {
                        const isSelected = formData.targetGoal === goal.id;
                        return (
                          <button
                            key={goal.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, targetGoal: goal.id }))}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? (isDark 
                                    ? 'border-orange-500 bg-zinc-900/90 text-zinc-100 shadow-sm shadow-orange-500/10' 
                                    : 'border-orange-500 bg-white text-zinc-900 ring-1 ring-orange-500/30 shadow-xs')
                                : (isDark 
                                    ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900/70' 
                                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-800 hover:bg-zinc-100')
                            }`}
                          >
                            <span className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-zinc-100' : 'text-zinc-900') : (isDark ? 'text-zinc-300' : 'text-zinc-700')}`}>{goal.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {formData.targetGoal === 'Other' && (
                    <div className="animate-in fade-in duration-150">
                      <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Specify Your Goal or Target
                      </label>
                      <input
                        type="text"
                        value={formData.customGoal}
                        onChange={(e) => setFormData(prev => ({ ...prev, customGoal: e.target.value }))}
                        placeholder="e.g. UPSC Prelims, SAT Physics, Coding Interviews"
                        className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-orange-500 transition ${
                          isDark 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-zinc-400'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Explanation Style & Mentor Tone */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div>
                    <label className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                      <Lightbulb className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-orange-500'}`} />
                      <span>Preferred Explanation Style</span>
                    </label>
                    <div className="space-y-2">
                      {EXPLANATION_STYLES.map((style) => {
                        const isSelected = formData.explanationStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, explanationStyle: style.id }))}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? (isDark 
                                    ? 'border-orange-500 bg-zinc-900/90 text-zinc-100 shadow-sm shadow-orange-500/10' 
                                    : 'border-orange-500 bg-white text-zinc-900 ring-1 ring-orange-500/30 shadow-xs')
                                : (isDark 
                                    ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900/70' 
                                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-800 hover:bg-zinc-100')
                            }`}
                          >
                            <div>
                              <p className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-zinc-100' : 'text-zinc-900') : (isDark ? 'text-zinc-300' : 'text-zinc-700')}`}>{style.label}</p>
                              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{style.desc}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-orange-500 flex-shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                      <Compass className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-orange-500'}`} />
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
                                    : 'border-orange-500 bg-white text-zinc-900 ring-1 ring-orange-500/30 shadow-xs')
                                : (isDark 
                                    ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900/70' 
                                    : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 text-zinc-800 hover:bg-zinc-100')
                            }`}
                          >
                            <div>
                              <p className={`text-xs font-semibold ${isSelected ? (isDark ? 'text-zinc-100' : 'text-zinc-900') : (isDark ? 'text-zinc-300' : 'text-zinc-700')}`}>{tone.label}</p>
                              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{tone.desc}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-orange-500 flex-shrink-0 ml-2" />}
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
              isDark ? 'border-zinc-800' : 'border-zinc-200'
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
                    isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-900'
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
                        <span>Start Learning</span>
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
