import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogIn, UserPlus, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', notice = null }) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
    setError('');
    setSuccessMsg('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleAuthError = (err) => {
    console.error('Firebase Auth error:', err);
    const code = err.code || '';
    if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('wrong-password')) {
      return 'Invalid User ID/Email or password. Please try again.';
    } else if (code.includes('email-already-in-use')) {
      return 'This User ID / Email is already registered. Please sign in instead.';
    } else if (code.includes('weak-password')) {
      return 'Password should be at least 6 characters long.';
    } else if (code.includes('invalid-email')) {
      return 'Please enter a valid User ID or email address.';
    } else {
      return err.message || 'An error occurred during authentication.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setError('Please enter a User ID or email.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signup(identifier, password);
        setSuccessMsg('Account created successfully! Logging you in...');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        await login(identifier, password);
        onClose();
      }
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card Container */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 mb-3 shadow-inner">
            {isSignUp ? <UserPlus className="w-6 h-6 text-zinc-200" /> : <LogIn className="w-6 h-6 text-zinc-200" />}
          </div>
          <h3 className="text-xl font-bold text-zinc-50 tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {isSignUp
              ? 'Sign up with a simple User ID & password to start generating notes.'
              : 'Sign in to access video processing and note synthesis.'}
          </p>
        </div>

        {notice && (
          <div className="mb-4 p-3 rounded-lg bg-orange-950/20 border border-orange-500/30 text-orange-300 text-xs flex items-center gap-2.5">
            <LogIn className="w-4 h-4 shrink-0 text-orange-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-orange-950/20 border border-orange-500/30 text-orange-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-orange-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User ID / Email Field */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              User ID or Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.replace(/\s+/g, '_'))}
                placeholder="e.g. alex or alex@example.com"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Switch mode footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-zinc-100 font-semibold underline underline-offset-2 hover:text-white"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="text-zinc-100 font-semibold underline underline-offset-2 hover:text-white"
              >
                Create One
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
