import { useState, useEffect } from 'react';
import { 
  X, 
  LogOut, 
  User, 
  Mail, 
  Phone, 
  Edit3, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Lock,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileModal() {
  const { isDark } = useTheme();
  const { isProfileOpen, setIsProfileOpen, setActiveSection, resetActiveVideo } = useApp();
  const { 
    currentUser, 
    userProfile, 
    logout, 
    getUserDisplayName,
    updateProfileDetails 
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const displayName = getUserDisplayName(currentUser);
  const phoneNumber = userProfile?.phoneNumber || currentUser?.phoneNumber || 'Not available';
  const currentEmail = userProfile?.email || currentUser?.email || '';
  const firstChar = displayName ? displayName.charAt(0) : (phoneNumber.slice(-2) || 'U');

  // Sync edit form values whenever modal opens or profile changes
  useEffect(() => {
    if (isProfileOpen) {
      setName(displayName === 'Student' && !userProfile?.displayName ? '' : displayName);
      setEmail(currentEmail || '');
      setIsEditing(false);
      setError('');
      setSuccessMsg('');
    }
  }, [isProfileOpen, displayName, currentEmail]);

  if (!isProfileOpen || !currentUser) return null;

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    try {
      await logout();
      if (resetActiveVideo) resetActiveVideo();
      if (setActiveSection) setActiveSection('dashboard');
      window.history.replaceState(null, '', '/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter a full name with at least 2 characters.');
      return;
    }

    if (email.trim() && !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileDetails({
        displayName: name.trim(),
        email: email.trim() || null
      });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        setIsEditing(false);
        setSuccessMsg('');
      }, 900);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(displayName === 'Student' && !userProfile?.displayName ? '' : displayName);
    setEmail(currentEmail || '');
    setError('');
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fadeIn">
      {/* Modal Card */}
      <div className={`relative max-w-md w-full border rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar ${
        isDark 
          ? 'bg-zinc-950/90 border-zinc-800 text-zinc-100 glass-panel' 
          : 'bg-white border-orange-200 text-orange-950 shadow-orange-500/10'
      }`}>
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsProfileOpen(false)}
          className="btn-icon absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"
          title="Close profile"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className={`flex flex-col items-center text-center space-y-3 pb-5 border-b mb-5 ${
          isDark ? 'border-zinc-900' : 'border-orange-100'
        }`}>
          <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-xl font-black uppercase shadow-inner select-none ${
            isDark 
              ? 'bg-zinc-900 border-zinc-800 text-orange-500' 
              : 'bg-orange-100 border-orange-300 text-orange-600 shadow-xs'
          }`}>
            {firstChar}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-zinc-50' : 'text-orange-950'}`}>
              {displayName}
            </h3>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-orange-700'}`}>
              {phoneNumber}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
            isDark 
              ? 'bg-red-950/50 border-red-500/40 text-red-200' 
              : 'bg-red-50 border-red-200 text-red-950'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
            isDark 
              ? 'bg-orange-950/60 border-orange-500/50 text-orange-200' 
              : 'bg-orange-50 border-orange-300 text-orange-950'
          }`}>
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* VIEW MODE */}
        {!isEditing ? (
          <div className="space-y-4">
            <div className={`border rounded-xl p-3.5 space-y-3 text-xs ${
              isDark ? 'bg-zinc-900/30 border-zinc-900' : 'bg-orange-50/50 border-orange-200/80'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-orange-800'}`}>
                  <User className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
                  Full Name
                </span>
                <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>{displayName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-orange-800'}`}>
                  <Phone className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
                  Phone Number
                </span>
                <span className={`font-semibold font-mono ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>{phoneNumber}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-orange-800'}`}>
                  <Mail className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
                  Email Address
                </span>
                <span className={`font-semibold truncate max-w-[200px] ${
                  currentEmail 
                    ? (isDark ? 'text-zinc-300' : 'text-orange-950')
                    : 'text-zinc-500 italic'
                }`} title={currentEmail || 'Not provided'}>
                  {currentEmail || 'Not provided'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setName(displayName === 'Student' && !userProfile?.displayName ? '' : displayName);
                  setEmail(currentEmail || '');
                  setError('');
                  setIsEditing(true);
                }}
                className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-850 hover:border-zinc-700'
                    : 'bg-orange-50 border-orange-200 text-orange-950 hover:bg-orange-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="btn-danger-subtle w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* EDIT MODE */
          <form onSubmit={handleSaveProfile} className="space-y-4 animate-fadeIn">
            <div className="space-y-3.5 text-xs">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Full Name <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Sharma"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              {/* Phone Field (Read-only) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-zinc-400">
                    Phone Number
                  </label>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Verified & Locked
                  </span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    value={phoneNumber}
                    disabled
                    className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-400 cursor-not-allowed select-none font-mono"
                  />
                </div>
              </div>

              {/* Email Field (Optional) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Email Address
                  </label>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Optional
                  </span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Edit Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className={`w-1/2 py-2.5 px-4 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary w-1/2 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/10 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
