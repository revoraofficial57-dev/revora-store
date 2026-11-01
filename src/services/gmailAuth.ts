import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const resolvedFirebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApp();
export const auth = getAuth(app);

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://mail.google.com/',
];

const provider = new GoogleAuthProvider();
// Add Workspace Gmail scopes
GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
provider.addScope('email');
provider.addScope('profile');
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to track sign-in state
let isSigningIn = false;
const TOKEN_SESSION_KEY = 'revora_gmail_access_token_v1';
const STORE_SENDER_KEY = 'revora_gmail_sender_email_v1';
const STORE_AUTHORIZED_KEY = 'revora_gmail_authorized_v1';

// Cache access token with session fallback
let cachedAccessToken: string | null = (() => {
  try {
    return sessionStorage.getItem(TOKEN_SESSION_KEY);
  } catch {
    return null;
  }
})();
let cachedUser: User | null = null;

export const setStoreGmailAuthorized = (email = 'revoraofficial57@gmail.com', token?: string) => {
  try {
    localStorage.setItem(STORE_AUTHORIZED_KEY, 'true');
    localStorage.setItem(STORE_SENDER_KEY, email);
    if (token) {
      sessionStorage.setItem(TOKEN_SESSION_KEY, token);
      cachedAccessToken = token;
    }
  } catch {}
};

export const getStoreAuthorizedSender = (): string => {
  try {
    return localStorage.getItem(STORE_SENDER_KEY) || 'revoraofficial57@gmail.com';
  } catch {
    return 'revoraofficial57@gmail.com';
  }
};

// Listen to auth changes
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      const token = await getAccessToken();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      try {
        sessionStorage.removeItem(TOKEN_SESSION_KEY);
      } catch {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token. Ensure Gmail permissions were approved.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    try {
      sessionStorage.setItem(TOKEN_SESSION_KEY, credential.accessToken);
      setStoreGmailAuthorized(result.user.email || 'revoraofficial57@gmail.com', credential.accessToken);
    } catch {}
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const errorCode = error?.code || '';
    if (errorCode === 'auth/popup-blocked') {
      console.warn('Google Sign-In popup was blocked by browser. Please allow popups.');
    } else if (errorCode === 'auth/popup-closed-by-user') {
      console.warn('Google Sign-In popup was closed by user.');
    } else {
      console.warn('Google Sign-In error:', error?.message || error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const stored = sessionStorage.getItem(TOKEN_SESSION_KEY);
    if (stored) {
      cachedAccessToken = stored;
      return stored;
    }
  } catch {}
  return null;
};

export const isGoogleConnected = (): boolean => {
  // Always true for Revora store dispatch desk (revoraofficial57@gmail.com)
  return true;
};

export const ensureGoogleToken = async (): Promise<string> => {
  const existing = await getAccessToken();
  if (existing) return existing;
  const res = await googleSignIn();
  if (!res?.accessToken) {
    throw new Error('Google Sign-In was cancelled or did not provide a valid Gmail token.');
  }
  return res.accessToken;
};

export const getCurrentUser = (): User | null => {
  if (cachedUser) return cachedUser;
  if (auth.currentUser) return auth.currentUser;
  const senderEmail = getStoreAuthorizedSender();
  return {
    email: senderEmail,
    displayName: 'Revora Dispatch Desk',
  } as any;
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch {}
  cachedAccessToken = null;
  cachedUser = null;
  try {
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
    localStorage.removeItem(STORE_AUTHORIZED_KEY);
  } catch {}
};

