import { useState, useEffect } from 'react';
import { X, Key, Save, Loader2, AlertCircle, CheckCircle2, ExternalLink, Sun, Moon, Palette } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { saveUserApiKeys, getUserApiKeys } from '../../services/firebase/notesService';

export default function SettingsModal({ apiStatus = 'healthy', onOpenApiModal }) {
  const { isSettingsOpen, setIsSettingsOpen } = useApp();
  const { currentUser } = useAuth();
  const { setTheme, isDark } = useTheme();

  const [googleApiKey, setGoogleApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [showGoogle, setShowGoogle] = useState(false);
  const [showGroq, setShowGroq] = useState(false);

  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [isFetchingKeys, setIsFetchingKeys] = useState(false);
  const [keysError, setKeysError] = useState('');
  const [keysSuccess, setKeysSuccess] = useState('');

  useEffect(() => {
    if (currentUser && isSettingsOpen) {
      const loadKeys = async () => {
        setIsFetchingKeys(true);
        setKeysError('');
        setKeysSuccess('');
        try {
          const keys = await getUserApiKeys(currentUser.uid);
          if (keys) {
            setGoogleApiKey(keys.googleApiKey || '');
            setGroqApiKey(keys.groqApiKey || '');
          }
        } catch (err) {
          console.error('Failed to load user API keys:', err);
          setKeysError('Failed to load saved API keys.');
        } finally {
          setIsFetchingKeys(false);
        }
      };
      loadKeys();
    }
  }, [currentUser, isSettingsOpen]);

  const handleSaveApiKeys = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSavingKeys(true);
    setKeysError('');
    setKeysSuccess('');

    try {
      await saveUserApiKeys(currentUser.uid, googleApiKey.trim(), groqApiKey.trim());
      setKeysSuccess('API keys updated successfully!');
      setTimeout(() => setKeysSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save API keys:', err);
      setKeysError('Failed to save API keys. Please try again.');
    } finally {
      setIsSavingKeys(false);
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-md border rounded-2xl p-6 sm:p-7 shadow-2xl animate-in scale-in duration-200 max-h-[90vh] overflow-x-hidden overflow-y-auto custom-scrollbar ${
          isDark 
            ? 'bg-zinc-950 border-zinc-900 text-zinc-100' 
            : 'bg-white border-orange-200 text-orange-950 shadow-orange-500/10'
        }`}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(false)}
          className="btn-icon absolute top-4 right-4"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className={`pb-4 border-b mb-5 pr-8 ${isDark ? 'border-zinc-900' : 'border-orange-100'}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold ${isDark ? 'text-zinc-50' : 'text-orange-950'}`}>Application Settings</h3>
              {/* Dot Status */}
              <button
                type="button"
                onClick={onOpenApiModal}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition hover:opacity-80 active:scale-95 cursor-pointer ${apiStatus === 'healthy'
                    ? isDark
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : apiStatus === 'checking'
                      ? isDark
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-amber-100 border-amber-300 text-amber-800'
                      : isDark
                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : 'bg-red-100 border-red-300 text-red-800'
                  }`}
                title={apiStatus === 'healthy' ? 'API Connected (Click to view)' : apiStatus === 'checking' ? 'API Connecting (Click to view)' : 'API Offline (Click to reconnect)'}
              >
                <span className="relative flex h-2 w-2">
                  {apiStatus === 'healthy' && (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  )}
                  {apiStatus === 'checking' && (
                    <span className="animate-pulse relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  )}
                  {apiStatus === 'unhealthy' && (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  )}
                </span>
                <span className="font-bold tracking-wide">
                  {apiStatus === 'healthy' ? 'Connected' : apiStatus === 'checking' ? 'Connecting' : 'Offline'}
                </span>
              </button>
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-orange-700'}`}>Configure theme appearance and AI keys for note generation.</p>
          </div>
        </div>

        {/* Appearance & Theme Section */}
        <div className="mb-6 space-y-2.5">
          <label className={`block text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
            <Palette className="w-3.5 h-3.5 text-orange-500" />
            <span>Theme & Appearance</span>
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Dark Theme Option */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${isDark
                ? 'bg-zinc-900 border-orange-500 text-orange-400 ring-1 ring-orange-500/50'
                : 'bg-orange-50/50 border-orange-200 text-orange-900/70 hover:text-orange-950 hover:bg-orange-100/50'
                }`}
            >
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-zinc-800 text-orange-400' : 'bg-orange-200/60 text-orange-700'}`}>
                <Moon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">Dark Mode</p>
                <p className={`text-[10px] leading-tight mt-0.5 ${isDark ? 'text-zinc-500' : 'text-orange-600/70'}`}>Deep black</p>
              </div>
            </button>

            {/* Light Theme Option */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${!isDark
                ? 'bg-orange-50 border-orange-500 text-orange-600 ring-1 ring-orange-500/50 shadow-xs'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
            >
              <div className="p-1.5 rounded-lg bg-orange-500 text-white">
                <Sun className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">Light Mode</p>
                <p className={`text-[10px] leading-tight mt-0.5 ${!isDark ? 'text-orange-700' : 'text-zinc-500'}`}>Orange flavor</p>
              </div>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className={`border-t pt-4 mb-4 ${isDark ? 'border-zinc-900' : 'border-orange-100'}`}>
          <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-zinc-50' : 'text-orange-950'}`}>API Key Configurations</h4>
          <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-orange-700'}`}>Keys are stored securely and only used for generating study guides.</p>
        </div>

        {/* Status Alerts */}
        {keysError && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
            isDark 
              ? 'bg-red-950/50 border-red-500/40 text-red-200' 
              : 'bg-red-50 border-red-200 text-red-950'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <span className="font-semibold">{keysError}</span>
          </div>
        )}

        {keysSuccess && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
            isDark 
              ? 'bg-orange-950/60 border-orange-500/50 text-orange-200' 
              : 'bg-orange-50 border-orange-300 text-orange-950'
          }`}>
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            <span className="font-semibold">{keysSuccess}</span>
          </div>
        )}

        {isFetchingKeys ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-xs">Loading api settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveApiKeys} className="space-y-4">
            <div className={`p-3 rounded-xl border text-[10px] leading-relaxed ${isDark ? 'bg-orange-950/10 border-orange-900/20 text-zinc-400' : 'bg-orange-50 border-orange-200 text-orange-900'
              }`}>
              <span className="font-bold text-orange-500 block mb-1">💡 Gemini API Configuration</span>
              Provide a Gemini API Key to enable study guides generation. If left blank, the application will use the default system API keys.
            </div>

            {/* Gemini API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[10px] flex items-center gap-1 font-semibold underline underline-offset-2 ${isDark ? 'text-zinc-450 hover:text-white' : 'text-orange-600 hover:text-orange-900'
                    }`}
                >
                  Get Key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <Key className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-orange-400'}`} />
                <input
                  type={showGoogle ? 'text' : 'password'}
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  placeholder="AIzaSy... (Gemini Key)"
                  className={`w-full border rounded-xl pl-9 pr-10 py-2.5 text-xs focus:outline-none transition font-mono ${isDark
                      ? 'bg-zinc-900/60 border-zinc-800 text-zinc-150 placeholder-zinc-650 focus:border-orange-500'
                      : 'bg-orange-50/50 border-orange-200 text-orange-950 placeholder-orange-400 focus:border-orange-500'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowGoogle(!showGoogle)}
                  className={`btn-icon absolute right-2.5 top-1/2 -translate-y-1/2 !p-1 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-orange-500 hover:text-orange-800'}`}
                >
                  {showGoogle ? <X className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Groq API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  Groq API Key
                </label>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[10px] flex items-center gap-1 font-semibold underline underline-offset-2 ${isDark ? 'text-zinc-450 hover:text-white' : 'text-orange-600 hover:text-orange-900'
                    }`}
                >
                  Get Key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <Key className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-orange-400'}`} />
                <input
                  type={showGroq ? 'text' : 'password'}
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_... (Groq Key)"
                  className={`w-full border rounded-xl pl-9 pr-10 py-2.5 text-xs focus:outline-none transition font-mono ${isDark
                      ? 'bg-zinc-900/60 border-zinc-800 text-zinc-150 placeholder-zinc-650 focus:border-orange-500'
                      : 'bg-orange-50/50 border-orange-200 text-orange-950 placeholder-orange-400 focus:border-orange-500'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowGroq(!showGroq)}
                  className={`btn-icon absolute right-2.5 top-1/2 -translate-y-1/2 !p-1 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-orange-500 hover:text-orange-800'}`}
                >
                  {showGroq ? <X className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSavingKeys}
              className="btn-primary w-full mt-4 py-2.5 px-4 text-xs font-bold"
            >
              {isSavingKeys ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Configurations</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
