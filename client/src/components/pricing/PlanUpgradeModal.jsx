import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { updateUserSubscription } from '../../services/firebase/usageService';
import { triggerConfetti } from '../../utils/confetti';
import PlanQuotaBox from './PlanQuotaBox';

export default function PlanUpgradeModal({
  isOpen,
  onClose,
  plan,
  onSuccess,
}) {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();

  const [stage, setStage] = useState('countdown'); // 'countdown' | 'success' | 'error'
  const [timeLeft, setTimeLeft] = useState(3);
  const [errorMessage, setErrorMessage] = useState('');

  // Keep stable refs to prevent re-renders from resetting the timer
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const planRef = useRef(plan);
  planRef.current = plan;

  // Reset state when modal opens with a plan & run 3-second countdown
  useEffect(() => {
    if (!isOpen || !plan) {
      setStage('countdown');
      setTimeLeft(3);
      return;
    }

    const activeUser = currentUserRef.current;
    if (!activeUser) {
      setErrorMessage('Please sign in to complete subscription upgrade.');
      setStage('error');
      return;
    }

    setStage('countdown');
    setTimeLeft(3);
    setErrorMessage('');

    // Trigger Firestore update immediately in the background so it completes well before countdown ends
    let upgradeFailed = false;
    const upgradeTask = (async () => {
      try {
        const now = new Date();
        const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await updateUserSubscription(activeUser.uid, {
          planId: plan.id,
          status: 'active',
          startedAt: now.toISOString(),
          validUntil: validUntil.toISOString(),
        });
      } catch (err) {
        console.error('Failed to complete subscription upgrade:', err);
        upgradeFailed = true;
      }
    })();

    let current = 3;
    const timer = setInterval(async () => {
      current -= 1;
      if (current > 0) {
        setTimeLeft(current);
      } else {
        clearInterval(timer);
        await upgradeTask;
        if (upgradeFailed) {
          setErrorMessage('Failed to activate subscription. Please try again.');
          setStage('error');
        } else {
          setStage('success');
          triggerConfetti({ particleCount: 160, duration: 4000 });
          if (onSuccessRef.current) {
            onSuccessRef.current(planRef.current || plan);
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isOpen, plan?.id]);

  if (!isOpen || !plan) return null;

  const textPrimary = isDark ? 'text-zinc-100' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const modalBg = isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200';

  // ── STAGE 1: FULL SCREEN BLUR WITH LARGE 3 2 1 COUNTDOWN (Like Onboarding Welcome) ──
  if (stage === 'countdown') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md select-none transition-all duration-300 animate-fadeIn">
        <h1
          key={timeLeft}
          className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tight text-white transition-all duration-300 animate-fadeIn"
        >
          {timeLeft}
        </h1>
      </div>
    );
  }

  // ── STAGE 2 & 3: SUCCESS CELEBRATION MODAL OR ERROR MODAL ──
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-md rounded-2xl border p-6 sm:p-7 shadow-2xl transition-all duration-200 ${modalBg}`}
      >
        {/* ── STAGE 2: UPGRADATION WELCOME CELEBRATION ── */}
        {stage === 'success' && (
          <div className="flex flex-col items-center text-center space-y-5 py-2 animate-fadeIn">
            {/* Welcome Message with Plan Title */}
            <div className="space-y-1.5 pt-1">
              <h2 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
                Welcome to {plan.name} Plan! 🎉
              </h2>
              <p className={`text-xs leading-relaxed max-w-sm ${textSecondary}`}>
                Your subscription has been successfully upgraded. Your 30-day study cycle is active from today.
              </p>
            </div>

            {/* Unlocked Benefits Quick Specs - Shared PlanQuotaBox Component */}
            <PlanQuotaBox plan={plan} isDark={isDark} className="w-full" />

            {/* Action Button */}
            <div className="w-full pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-primary w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition"
              >
                <span>Start Studying with {plan.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 3: ERROR STATE ── */}
        {stage === 'error' && (
          <div className="flex flex-col items-center text-center space-y-4 py-2 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-500/30 text-red-500">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className={`text-lg font-bold ${textPrimary}`}>
                Upgrade Incomplete
              </h3>
              <p className="text-xs text-red-400">
                {errorMessage || 'An error occurred while upgrading. Please try again.'}
              </p>
            </div>

            <div className="w-full pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary w-full py-2.5 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
