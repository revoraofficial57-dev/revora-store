import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminNotification } from '../types';
import {
  getAdminAuthState,
  getAdminSession,
  setupAdminAccount,
  loginAdmin,
  logoutAdmin,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  resetAdminLockout,
  resetAdminToDefault,
  changeAdminCredentials,
} from '../services/storage';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'designs'
  | 'orders'
  | 'inventory'
  | 'discounts'
  | 'delivery'
  | 'reviews'
  | 'customers'
  | 'complaints'
  | 'policies'
  | 'settings'
  | 'import-export';

interface AdminContextType {
  isConfigured: boolean;
  isCustomPasswordSet: boolean;
  isAuthenticated: boolean;
  username: string;
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  notifications: AdminNotification[];
  unreadNotificationCount: number;
  setupAdmin: (username: string, passwordPlain: string, recoveryCode: string) => Promise<boolean>;
  login: (username: string, passwordPlain: string) => Promise<boolean>;
  changePassword: (newUsername: string, newPasswordPlain: string) => Promise<boolean>;
  resetLockout: () => void;
  resetToDefault: () => Promise<void>;
  logout: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshNotifications: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isCustomPasswordSet, setIsCustomPasswordSet] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const checkAuth = () => {
    const authState = getAdminAuthState();
    setIsConfigured(authState.isConfigured);
    setIsCustomPasswordSet(Boolean(authState.isCustomPasswordSet));
    const session = getAdminSession();
    if (session) {
      setIsAuthenticated(true);
      setUsername(session.username);
    } else {
      setIsAuthenticated(false);
      setUsername('');
    }
  };

  const refreshNotifications = () => {
    setNotifications(getAdminNotifications());
  };

  useEffect(() => {
    checkAuth();
    refreshNotifications();
  }, []);

  const handleSetup = async (user: string, pass: string, recovery: string): Promise<boolean> => {
    const ok = await setupAdminAccount(user, pass, recovery);
    if (ok) {
      checkAuth();
      refreshNotifications();
    }
    return ok;
  };

  const handleLogin = async (user: string, pass: string): Promise<boolean> => {
    const ok = await loginAdmin(user, pass);
    if (ok) {
      checkAuth();
      refreshNotifications();
    }
    return ok;
  };

  const handleLogout = () => {
    logoutAdmin();
    checkAuth();
  };

  const handleMarkRead = (id: string) => {
    markNotificationAsRead(id);
    refreshNotifications();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    refreshNotifications();
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AdminContext.Provider
      value={{
        isConfigured,
        isCustomPasswordSet,
        isAuthenticated,
        username,
        activeTab,
        setActiveTab,
        notifications,
        unreadNotificationCount,
        setupAdmin: handleSetup,
        login: handleLogin,
        changePassword: async (newUser: string, newPass: string) => {
          const ok = await changeAdminCredentials(newUser, newPass);
          if (ok) checkAuth();
          return ok;
        },
        resetLockout: resetAdminLockout,
        resetToDefault: async () => {
          await resetAdminToDefault();
          checkAuth();
        },
        logout: handleLogout,
        markNotificationRead: handleMarkRead,
        markAllNotificationsRead: handleMarkAllRead,
        refreshNotifications,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
