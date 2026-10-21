import React, { useState } from 'react';
import { googleSignIn, getCurrentUser } from '../../services/gmailAuth';
import { AlertCircle, RefreshCw, X, ExternalLink } from 'lucide-react';

interface GoogleSignInButtonProps {
  onSuccess?: (userEmail: string, token: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  className?: string;
  variant?: 'standard' | 'minimal' | 'compact';
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  buttonText = 'Sign in with Google',
  className = '',
  variant = 'standard',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const currentUser = getCurrentUser();

  const handleSignIn = async () => {
    setIsLoading(true);
    setPopupBlocked(false);
    try {
      const res = await googleSignIn();
      if (res && res.user) {
        setPopupBlocked(false);
        if (onSuccess) onSuccess(res.user.email || '', res.accessToken);
      }
    } catch (err: any) {
      const errorCode = err?.code;
      if (errorCode === 'auth/popup-blocked' || err?.message?.includes('popup-blocked')) {
        setPopupBlocked(true);
        const msg = 'Browser blocked the pop-up window. Please allow pop-ups in your browser address bar.';
        if (onError) onError(msg);
      } else if (errorCode === 'auth/popup-closed-by-user') {
        if (onError) onError('Google sign-in was closed before completing.');
      } else {
        const msg = err?.message || 'Google Sign-In failed. Please try again.';
        if (onError) onError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const buttonElement =
    variant === 'compact' ? (
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className={`inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-300 rounded-xs bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium cursor-pointer shadow-2xs transition-colors ${className}`}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
        <span>{isLoading ? 'Connecting...' : buttonText}</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className={`inline-flex items-center justify-center gap-3 px-4 py-2.5 border border-neutral-300 rounded-xs bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-800 text-xs font-semibold tracking-wide cursor-pointer shadow-xs transition-all ${className}`}
        title="Connect with your Google account to access Gmail features"
      >
        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
          <svg className="w-4.5 h-4.5" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        </div>
        <span className="font-display font-medium text-neutral-800">
          {isLoading ? 'Connecting Google Account...' : buttonText}
        </span>
      </button>
    );

  return (
    <div className="relative inline-block text-left">
      {buttonElement}

      {popupBlocked && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-300 text-amber-950 rounded-xs text-xs space-y-2 max-w-sm shadow-md animate-in fade-in">
          <div className="flex items-start justify-between gap-2 border-b border-amber-200 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold font-display text-[11px] uppercase tracking-wide text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Browser Blocked Pop-Up</span>
            </div>
            <button
              type="button"
              onClick={() => setPopupBlocked(false)}
              className="text-amber-700 hover:text-amber-950 p-0.5 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-amber-900 leading-normal">
            Your browser prevented Google&apos;s authentication pop-up from opening.
          </p>

          <div className="text-[10px] text-amber-900 space-y-1 font-mono bg-white/70 p-2 rounded-xs border border-amber-200">
            <div>1. Click the pop-up blocked icon (🚫) in your browser address bar.</div>
            <div>2. Select <strong>&ldquo;Always allow pop-ups and redirects&rdquo;</strong>.</div>
            <div>3. Click Retry below.</div>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading}
              className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xs text-[10px] font-bold uppercase font-display flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Retrying...' : 'Retry Sign-In'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPopupBlocked(false)}
              className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-xs text-[10px] font-medium cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
