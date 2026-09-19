import {
  X,
  Zap,
  AlertTriangle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { usePlans } from '../../context/PlansContext';
import { PLAN_IDS } from '../../models';

export default function UpgradeModal({
  isOpen,
  onClose,
  reason = null,
}) {
  const { isDark } = useTheme();
  const { userProfile } = useAuth();
  const { setActiveSection, resetActiveVideo } = useApp();
  const { getPlan } = usePlans();

  if (!isOpen) return null;

  const currentPlanId = userProfile?.subscription?.planId || PLAN_IDS.STARTER;
  const currentPlan = getPlan(currentPlanId);

  const handleGoToBilling = () => {
    onClose();
    if (resetActiveVideo) {
      resetActiveVideo();
    }
    setActiveSection('billing');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-6 sm:p-7 transition-all ${
          isDark
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 shadow-orange-500/10'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition cursor-pointer ${
            isDark
              ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon Badge */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-orange-500/10 border border-orange-500/20 text-orange-500 shadow-inner">
              <AlertTriangle className="w-7 h-7 text-orange-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-orange-600 text-white shadow-xs">
              <Zap className="w-3 h-3 fill-current" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Quota Limit Reached
            </h2>
          </div>

          {/* Reason Card */}
          <div className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left space-y-1.5 ${
            isDark
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
              <p className="text-xs font-semibold leading-relaxed">
                {reason || "You have reached the limit for this feature on your current plan."}
              </p>
            </div>
          </div>

          {/* Description */}
          {/* <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Upgrade to <strong>Learner</strong> or <strong>Scholar</strong> to unlock unlimited subject playlists, extended marathon lecture processing, and higher AI tutoring limits.
          </p> */}

          {/* Action Button */}
          <div className="w-full pt-2">
            <button
              type="button"
              onClick={handleGoToBilling}
              className="btn-primary w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition"
            >
              <Zap className="w-4 h-4" />
              <span>Upgrade in Billing &amp; Usage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Guarantee Note */}
          <div className={`pt-1 flex items-center justify-center gap-1.5 text-[11px] ${
            isDark ? 'text-zinc-500' : 'text-zinc-500'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>UPI &amp; Card Support &bull; Instant Activation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

