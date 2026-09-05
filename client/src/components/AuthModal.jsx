import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COMPANY_NAME } from '../constants';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Phone, 
  User, 
  Mail, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Edit3,
  Info
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', notice = null }) {
  const { isDark } = useTheme();
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  // Status & Confirmation
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [infoNotice, setInfoNotice] = useState(notice || '');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const nameInputRef = useRef(null);
  const otpInputRef = useRef(null);

  const { 
    sendPhoneOtp, 
    verifyOtpAndSignUp, 
    verifyOtpAndSignIn, 
    checkPhoneRegistered, 
    clearRecaptcha 
  } = useAuth();

  // Reset modal state on open or mode change
  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'signup');
      setStep('input');
      setError('');
      setSuccessMsg('');
      setOtp('');
      setInfoNotice(notice || '');
    } else {
      clearRecaptcha();
    }
  }, [isOpen, initialMode, notice]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus OTP input when entering OTP step
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  if (!isOpen) return null;

  // Format clean E.164 phone number
  const getFormattedPhone = () => {
    const trimmed = phone.trim();
    if (!trimmed) return '';
    const cleanDigits = trimmed.replace(/[^0-9]/g, '');
    if (!cleanDigits) return '';
    // If user explicitly typed a leading '+' (e.g. +91 9876543210 or +1 2345678901)
    if (trimmed.startsWith('+')) {
      return '+' + cleanDigits;
    }
    // Default country prefix (+91)
    return `+91${cleanDigits}`;
  };

  const handleAuthError = (err) => {
    console.error('Auth error:', err);
    const code = err.code || err.message || '';
    if (code.includes('invalid-phone-number')) {
      return 'Please enter a valid 10-digit mobile number.';
    } else if (code.includes('invalid-verification-code')) {
      return 'Incorrect verification code. Please check and try again.';
    } else if (code.includes('code-expired')) {
      return 'Verification code has expired. Please request a new code.';
    } else if (code.includes('too-many-requests')) {
      return 'Too many attempts. Please wait a few minutes before trying again.';
    } else if (code.includes('quota-exceeded')) {
      return 'SMS limit reached. Please try again later.';
    } else if (code.includes('captcha-check-failed')) {
      return 'Security verification failed. Please try again.';
    } else if (code.includes('operation-not-allowed') || code.includes('billing-not-enabled')) {
      return 'SMS verification service is currently unavailable. Please try again shortly.';
    } else if (code.includes('network-request-failed')) {
      return 'Network connection issue. Please check your internet and try again.';
    } else {
      return 'Something went wrong. Please try again.';
    }
  };

  // Step 1: Send OTP handler
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');
    setInfoNotice('');

    const formattedPhone = getFormattedPhone();
    const rawDigits = phone.replace(/[^0-9]/g, '');

    if (!rawDigits || rawDigits.length < 8) {
      setError('Please enter a valid mobile number (at least 10 digits).');
      return;
    }

    if (isSignUp && (!name || name.trim().length < 2)) {
      setError('Please enter your full name (at least 2 characters).');
      nameInputRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      // Check if phone number is already registered in Firestore
      const isRegistered = await checkPhoneRegistered(formattedPhone);

      // 1. If user is trying to SIGN IN, but number is NOT registered:
      if (!isSignUp && !isRegistered) {
        setIsSignUp(true);
        setInfoNotice("We couldn't find an account with this number. Please enter your name to complete sign up!");
        setLoading(false);
        // Focus name input after mode switch
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 100);
        return;
      }

      // 2. If user is trying to SIGN UP, but number is ALREADY registered:
      if (isSignUp && isRegistered) {
        setIsSignUp(false);
        setInfoNotice("This phone number is already registered. Please sign in instead!");
        setLoading(false);
        return;
      }

      // Trigger Firebase Phone Auth with invisible reCAPTCHA
      const confirmation = await sendPhoneOtp(formattedPhone, 'recaptcha-container');
      setConfirmationResult(confirmation);
      setStep('otp');
      setResendCooldown(30);
      setSuccessMsg(`Verification code sent to ${formattedPhone}`);
    } catch (err) {
      setError(handleAuthError(err));
      clearRecaptcha('recaptcha-container');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const formattedPhone = getFormattedPhone();
    try {
      const confirmation = await sendPhoneOtp(formattedPhone, 'recaptcha-container');
      setConfirmationResult(confirmation);
      setResendCooldown(30);
      setSuccessMsg(`A new verification code was sent to ${formattedPhone}`);
    } catch (err) {
      setError(handleAuthError(err));
      clearRecaptcha('recaptcha-container');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanOtp = otp.trim().replace(/[^0-9]/g, '');
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (!confirmationResult) {
      setError('Verification session expired. Please request a new code.');
      setStep('input');
      return;
    }

    setLoading(true);
    const formattedPhone = getFormattedPhone();

    try {
      if (isSignUp) {
        await verifyOtpAndSignUp(confirmationResult, cleanOtp, {
          name: name.trim(),
          email: email.trim() || null,
          phoneNumber: formattedPhone
        });
        setSuccessMsg('Account created successfully! Logging you in...');
      } else {
        await verifyOtpAndSignIn(confirmationResult, cleanOtp);
        setSuccessMsg('Signed in successfully!');
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      {/* Modal Card */}
      <div className={`relative w-full max-w-md border rounded-2xl p-5 sm:p-7 shadow-2xl overflow-x-hidden overflow-y-auto custom-scrollbar max-h-[92vh] transition-colors ${
        isDark 
          ? 'bg-zinc-950 border-zinc-800 text-zinc-100' 
          : 'bg-white border-orange-200 text-orange-950 shadow-orange-500/10'
      }`}>
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`btn-icon absolute top-4 right-4 ${
            isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-orange-700 hover:text-orange-950'
          }`}
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-5">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border mb-2.5 shadow-inner ${
            isDark 
              ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
              : 'bg-orange-100 border-orange-300 text-orange-600'
          }`}>
            {step === 'otp' ? (
              <KeyRound className="w-6 h-6 animate-pulse" />
            ) : isSignUp ? (
              <UserPlus className="w-6 h-6" />
            ) : (
              <LogIn className="w-6 h-6" />
            )}
          </div>
          
          <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-zinc-50' : 'text-orange-950'}`}>
            {step === 'otp' 
              ? 'Verify Phone Number' 
              : isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h3>
          
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-orange-800/80'}`}>
            {step === 'otp'
              ? `We sent a 6-digit verification code to ${getFormattedPhone()}`
              : isSignUp
              ? 'Sign up with your phone number to get started'
              : 'Sign in with your phone number via SMS OTP'}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only visible on Step 1) */}
        {step === 'input' && (
          <div className={`grid grid-cols-2 gap-1 p-1 border rounded-xl mb-5 ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-orange-100/60 border-orange-200'
          }`}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setSuccessMsg('');
                setInfoNotice('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                !isSignUp
                  ? isDark 
                    ? 'bg-zinc-800 text-orange-400 shadow-xs' 
                    : 'bg-white text-orange-600 shadow-xs'
                  : isDark 
                    ? 'text-zinc-400 hover:text-zinc-200' 
                    : 'text-orange-800/70 hover:text-orange-950'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError('');
                setSuccessMsg('');
                setInfoNotice('');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                isSignUp
                  ? isDark 
                    ? 'bg-zinc-800 text-orange-400 shadow-xs' 
                    : 'bg-white text-orange-600 shadow-xs'
                  : isDark 
                    ? 'text-zinc-400 hover:text-zinc-200' 
                    : 'text-orange-800/70 hover:text-orange-950'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Informative Notice Banner */}
        {infoNotice && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
            isDark 
              ? 'bg-orange-950/40 border-orange-500/40 text-orange-200' 
              : 'bg-orange-50 border-orange-200 text-orange-950'
          }`}>
            <Info className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            <span className="leading-relaxed font-medium">{infoNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
            isDark 
              ? 'bg-red-950/50 border-red-500/50 text-red-200' 
              : 'bg-red-50 border-red-200 text-red-950'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Success Alert - Pure Warm Shades (No Grey) in Light Mode */}
        {successMsg && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn shadow-xs ${
            isDark 
              ? 'bg-orange-950/60 border-orange-500/60 text-orange-200' 
              : 'bg-orange-50 border border-orange-300 text-orange-950'
          }`}>
            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            <span className="leading-relaxed font-semibold">{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Phone & Details Form */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Full Name Field (Sign Up Only) */}
            {isSignUp && (
              <div className="animate-fadeIn">
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
                  Full Name <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-orange-400'}`} />
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Sharma"
                    required={isSignUp}
                    className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm transition focus:outline-none focus:border-orange-500 ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500' 
                        : 'bg-orange-50/50 border-orange-200 text-orange-950 placeholder-orange-400'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Phone Number Field */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
                Phone Number <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-orange-400'}`} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98765 43210"
                  required
                  className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm transition focus:outline-none focus:border-orange-500 ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500' 
                      : 'bg-orange-50/50 border-orange-200 text-orange-950 placeholder-orange-400'
                  }`}
                />
              </div>
              <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-500' : 'text-orange-800/70'}`}>
                We'll send a 6-digit SMS verification code to this number.
              </p>
            </div>

            {/* Email Field (Sign Up Only, Optional) */}
            {isSignUp && (
              <div className="animate-fadeIn">
                <div className="flex justify-between items-center mb-1.5">
                  <label className={`block text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
                    Email Address
                  </label>
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-500' : 'text-orange-700/60'}`}>
                    Optional
                  </span>
                </div>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-orange-400'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm transition focus:outline-none focus:border-orange-500 ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500' 
                        : 'bg-orange-50/50 border-orange-200 text-orange-950 placeholder-orange-400'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 px-4 text-sm font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-orange-500/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification Form */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
            {/* Phone Info & Change Number Button */}
            <div className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
              isDark 
                ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300' 
                : 'bg-orange-50/60 border-orange-200 text-orange-950'
            }`}>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-orange-500" />
                <span className="font-semibold">{getFormattedPhone()}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setError('');
                  setSuccessMsg('');
                  setOtp('');
                }}
                className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 font-semibold transition cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Change</span>
              </button>
            </div>

            {/* 6-Digit OTP Input */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
                6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-orange-400'}`} />
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  required
                  className={`w-full border rounded-xl pl-9 pr-4 py-3 text-center text-lg font-mono tracking-widest transition focus:outline-none focus:border-orange-500 placeholder:opacity-30 ${
                    isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500' 
                      : 'bg-orange-50/50 border-orange-200 text-orange-950 placeholder-orange-400'
                  }`}
                />
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="btn-primary w-full py-2.5 px-4 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying...</span>
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Verify & Create Account</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Verify & Sign In</span>
                </>
              )}
            </button>

            {/* Resend Code Footer */}
            <div className={`flex items-center justify-between pt-3 border-t text-xs ${
              isDark ? 'border-zinc-900 text-zinc-400' : 'border-orange-100 text-orange-800/80'
            }`}>
              <span>Didn't get the code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResendOtp}
                className={`flex items-center gap-1.5 font-semibold transition cursor-pointer ${
                  resendCooldown > 0 || loading
                    ? 'text-zinc-500 cursor-not-allowed'
                    : isDark ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'
                }`}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Modal Switch Footer (Step 1 only) */}
        {step === 'input' && (
          <div className={`mt-5 pt-4 border-t text-center text-xs ${
            isDark ? 'border-zinc-800/80 text-zinc-400' : 'border-orange-100 text-orange-800/80'
          }`}>
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                    setSuccessMsg('');
                    setInfoNotice('');
                  }}
                  className="text-orange-500 font-semibold hover:underline cursor-pointer"
                >
                  Sign In with Phone
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                    setSuccessMsg('');
                    setInfoNotice('');
                  }}
                  className="text-orange-500 font-semibold hover:underline cursor-pointer"
                >
                  Create One
                </button>
              </p>
            )}
          </div>
        )}

        {/* Legal Consent Notice (Sign Up step only) */}
        {step === 'input' && isSignUp && (
          <p className={`mt-3 text-center text-[10px] leading-relaxed ${
            isDark ? 'text-zinc-600' : 'text-orange-900/40'
          }`}>
            By creating an account, you agree to {COMPANY_NAME}&apos;s{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500/70 hover:text-orange-500 underline underline-offset-1 transition"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500/70 hover:text-orange-500 underline underline-offset-1 transition"
            >
              Privacy Policy
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
