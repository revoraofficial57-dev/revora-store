import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Shield, Lock, Eye, EyeOff, AlertCircle, Key, RefreshCw, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onClose }) => {
  const { login, resetLockout, resetToDefault, isCustomPasswordSet } = useAdmin();

  // Single authorized admin login state
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSetupHint, setShowSetupHint] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFillDefaults = () => {
    setLoginUser('revora_admin');
    setLoginPassword('RevoraAdmin2026!');
    setErrorMessage(null);
    setResetMessage('Default admin credentials filled.');
  };

  const handleQuickLogin = async () => {
    setLoginUser('revora_admin');
    setLoginPassword('RevoraAdmin2026!');
    setErrorMessage(null);
    setIsLoading(true);
    try {
      resetLockout();
      const ok = await login('revora_admin', 'RevoraAdmin2026!');
      setIsLoading(false);
      if (ok) {
        onSuccess();
      } else {
        setErrorMessage('Could not authenticate. Click "Reset Credentials" below.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Authentication error.');
    }
  };

  const handleResetCredentials = async () => {
    try {
      await resetToDefault();
      setLoginUser('revora_admin');
      setLoginPassword('RevoraAdmin2026!');
      setErrorMessage(null);
      setResetMessage('Credentials restored to initial setup defaults. Please sign in and set your custom password in Settings.');
    } catch (err: any) {
      setErrorMessage('Failed to reset credentials.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResetMessage(null);

    if (!loginUser.trim() || !loginPassword) {
      setErrorMessage('Please provide both administrator username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await login(loginUser.trim(), loginPassword);
      setIsLoading(false);
      if (ok) {
        onSuccess();
      } else {
        setErrorMessage('Invalid administrator credentials. Access denied.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Authentication error.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-300 max-w-md w-full p-6 sm:p-8 rounded-xs space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-black cursor-pointer text-sm font-mono"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-neutral-100 border border-neutral-300 mx-auto rounded-full flex items-center justify-center text-black">
            <Shield className="w-6 h-6" />
          </div>
          <div className="text-[11px] font-mono tracking-widest text-neutral-500 uppercase">
            REVORA SECURITY PROTOCOL
          </div>
          <h2 className="text-xl font-bold text-neutral-900 uppercase font-display">
            Administrator Portal
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Authorized store owner portal. Access restricted to store administrators.
          </p>
        </div>

        {/* Security State Banner */}
        {isCustomPasswordSet ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs text-[11px] font-mono text-emerald-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Secured with custom master credentials. Default access disabled.</span>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowSetupHint(!showSetupHint)}
              className="w-full p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xs text-[11px] font-mono text-neutral-600 flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-1.5 font-bold text-neutral-800">
                <Key className="w-3.5 h-3.5 text-neutral-700" />
                <span>First-Time Setup Credentials Help</span>
              </span>
              {showSetupHint ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSetupHint && (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xs text-[11px] font-mono text-neutral-700 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-neutral-900 font-bold uppercase text-[10px] tracking-wider pb-1 border-b border-neutral-200">
                  <span>Initial Setup Credentials</span>
                  <button
                    type="button"
                    onClick={handleFillDefaults}
                    className="text-[10px] text-blue-700 hover:underline cursor-pointer uppercase font-bold"
                  >
                    Auto-Fill
                  </button>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-500">Username:</span>
                  <span className="font-bold text-black select-all">revora_admin <span className="font-normal text-neutral-500">(or admin)</span></span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-500">Password:</span>
                  <span className="font-bold text-black select-all">RevoraAdmin2026!</span>
                </div>
                <p className="text-[10px] text-amber-800 pt-1 leading-tight">
                  Notice: Once logged in, change your password in Settings to permanently lock down this portal.
                </p>
              </div>
            )}
          </div>
        )}

        {resetMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs space-y-2 font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            {!isCustomPasswordSet && (
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCredentials}
                  className="px-2.5 py-1 bg-red-800 hover:bg-red-900 text-white text-[10px] font-bold uppercase rounded-xs cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restore Setup Defaults</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Secure Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
              Administrator Username
            </label>
            <input
              type="text"
              required
              autoFocus
              autoComplete="username"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              placeholder="e.g. revora_admin"
              className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black font-mono transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 pr-10 rounded-xs focus:outline-none focus:border-black font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-neutral-800 text-white py-3 px-4 rounded-xs text-xs font-bold uppercase tracking-wider cursor-pointer font-display transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Verifying Security Token...' : 'Authenticate Admin Session'}</span>
            </button>

            {!isCustomPasswordSet && (
              <button
                type="button"
                onClick={handleQuickLogin}
                disabled={isLoading}
                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 py-2.5 px-4 rounded-xs text-xs font-semibold cursor-pointer font-display transition-colors flex items-center justify-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-neutral-600" />
                <span>Quick 1-Click Setup Login</span>
              </button>
            )}
          </div>
        </form>

        <div className="border-t border-neutral-200 pt-3 text-center">
          <p className="text-[11px] font-mono text-neutral-500">
            Protected with session expiration and automated brute-force rate limiting.
          </p>
        </div>
      </div>
    </div>
  );
};
