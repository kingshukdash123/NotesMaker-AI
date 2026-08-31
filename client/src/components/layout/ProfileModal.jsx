import { X, LogOut, User, Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileModal() {
  const { isDark } = useTheme();
  const { isProfileOpen, setIsProfileOpen } = useApp();
  const { currentUser, logout, getUserDisplayName } = useAuth();

  if (!isProfileOpen || !currentUser) return null;

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName = getUserDisplayName(currentUser);
  const firstChar = displayName ? displayName.charAt(0) : 'U';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
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
        <div className={`flex flex-col items-center text-center space-y-3 pb-6 border-b mb-5 ${
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
            <h3 className={`text-lg font-bold ${isDark ? 'text-zinc-50' : 'text-orange-950'}`}>{displayName}</h3>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-orange-700'}`}>{currentUser.email}</p>
          </div>
        </div>

        {/* Profile Info Grid */}
        <div className="space-y-4">
          <div className={`border rounded-xl p-3.5 space-y-3 text-xs ${
            isDark ? 'bg-zinc-900/30 border-zinc-900' : 'bg-orange-50/50 border-orange-200/80'
          }`}>
            <div className="flex justify-between items-center">
              <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-orange-800'}`}>
                <User className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
                Display Name
              </span>
              <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>{displayName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-orange-800'}`}>
                <Mail className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
                Email Address
              </span>
              <span className={`font-semibold truncate max-w-[200px] ${isDark ? 'text-zinc-300' : 'text-orange-950'}`} title={currentUser.email}>
                {currentUser.email}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-500' : 'text-orange-800'}`}>
                <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
                Auth Provider
              </span>
              <span className={`font-semibold ${isDark ? 'text-zinc-350' : 'text-orange-950'}`}>Email / Password</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="btn-danger-subtle w-full py-2.5 px-4 text-xs font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
