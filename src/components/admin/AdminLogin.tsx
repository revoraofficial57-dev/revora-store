import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Shield, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onClose }) => {
  const { login } = useAdmin();

  // Single authorized admin login state
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginUser.trim() || !loginPassword) {
      setErrorMessage('Please provide both administrator username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await login(loginUser, loginPassword);
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
      <div className="bg-white border border-neutral-300 max-w-md w-full p-6 sm:p-8 rounded-xs space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-black cursor-pointer text-sm font-mono"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
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
            Authorized store owner credentials required. Customer account role escalation and public registration are strictly disabled.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Secure Login Form - No Registration or Staff Creation */}
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
              placeholder="Username"
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-neutral-800 text-white py-3 px-4 rounded-xs text-xs font-bold uppercase tracking-wider cursor-pointer font-display transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Verifying Security Token...' : 'Authenticate Admin Session'}</span>
            </button>
          </div>
        </form>

        <div className="border-t border-neutral-200 pt-4 text-center">
          <p className="text-[11px] font-mono text-neutral-500">
            Protected with session expiration and automated brute-force rate limiting.
          </p>
        </div>
      </div>
    </div>
  );
};
