import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { triggerConfetti } from '../../utils/confetti';

/**
 * Onboarding Celebration Overlay (First Sign Up)
 * Full-screen welcome celebration with high-blast confetti animation.
 * Automatically fades out after 3 seconds and dismisses at 3.7s.
 */
export default function OnboardingModal({ isOpen, onClose }) {
  const { skipUserOnboarding } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasTriggeredRef = useRef(false);
  const onCloseRef = useRef(onClose);

  // Keep latest onClose callback reference without resetting timers
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 1. Trigger celebration and activate overlay when isOpen is true
  useEffect(() => {
    if (isOpen && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setIsActive(true);
      setIsFadingOut(false);

      // Trigger high-blast celebratory confetti
      triggerConfetti({ particleCount: 240, duration: 4800 });

      // Persist onboarding completion in Firestore in background
      if (skipUserOnboarding) {
        skipUserOnboarding().catch((err) => {
          console.error('Failed to persist onboarding completion:', err);
        });
      }
    }
  }, [isOpen, skipUserOnboarding]);

  // 2. Guaranteed countdown timers tied strictly to active overlay state
  useEffect(() => {
    if (!isActive) return;

    // Start fade out at exactly 3.0 seconds
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 5000);

    // Completely unmount and reveal dashboard at 3.7 seconds
    const closeTimer = setTimeout(() => {
      setIsActive(false);
      setIsFadingOut(false);
      onCloseRef.current?.();
    }, 5700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [isActive]);

  const handleDismissCelebration = () => {
    setIsActive(false);
    setIsFadingOut(false);
    onCloseRef.current?.();
  };

  if (!isActive) return null;

  return (
    <div 
      onClick={handleDismissCelebration}
      className={`fixed inset-0 z-[160] flex flex-col items-center justify-center p-6 text-center bg-black/90 backdrop-blur-md cursor-pointer select-none transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div 
        className={`max-w-5xl w-full px-4 space-y-3 sm:space-y-4 transition-all duration-700 ease-out ${
          isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <h1 className="text-2xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white select-none whitespace-nowrap">
          Welcome To Pathshala <span className="text-orange-500">A<i>I</i></span>
        </h1>
        <p className="text-sm sm:text-lg md:text-xl font-medium text-zinc-300 max-w-2xl mx-auto leading-relaxed select-none">
          Your all-in-one platform for distraction-free study and maximum productivity
        </p>
      </div>
    </div>
  );
}
