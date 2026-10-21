import React, { useState } from 'react';
import { useAdmin, AdminTab } from '../../context/AdminContext';
import { AdminDashboard } from './AdminDashboard';
import { AdminProducts } from './AdminProducts';
import { AdminOrders } from './AdminOrders';
import { AdminInventory } from './AdminInventory';
import { AdminDiscounts } from './AdminDiscounts';
import { AdminDelivery } from './AdminDelivery';
import { AdminReviews } from './AdminReviews';
import { AdminImportExport } from './AdminImportExport';
import { AdminSettings } from './AdminSettings';
import { AdminComplaints } from './AdminComplaints';
import { AdminPolicies } from './AdminPolicies';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Tag,
  Truck,
  Star,
  FileSpreadsheet,
  Settings,
  MessageSquare,
  BookOpen,
  Bell,
  LogOut,
  ExternalLink,
  Shield,
  Menu,
  X,
} from 'lucide-react';

interface AdminPanelProps {
  onBackToStore: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToStore }) => {
  const {
    username,
    activeTab,
    setActiveTab,
    logout,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAdmin();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems: Array<{ id: AdminTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Command Hub', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders & Payments', icon: ShoppingBag },
    { id: 'products', label: 'Products & Designs', icon: Package },
    { id: 'inventory', label: 'Variant Inventory', icon: Boxes },
    { id: 'discounts', label: 'Discounts & Codes', icon: Tag },
    { id: 'delivery', label: 'Delivery Rules', icon: Truck },
    { id: 'complaints', label: 'Complaints & Support', icon: MessageSquare },
    { id: 'policies', label: 'Store Rules & Policies', icon: BookOpen },
    { id: 'reviews', label: 'Customer Reviews', icon: Star },
    { id: 'import-export', label: 'Bulk CSV Import', icon: FileSpreadsheet },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 bg-neutral-950 border-b border-neutral-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden text-neutral-400 hover:text-white"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white text-black flex items-center justify-center font-black text-xs">
              R
            </div>
            <span className="text-sm font-black tracking-widest text-white uppercase font-display">
              REVORA CONTROL
            </span>
          </div>

          <span className="hidden sm:inline text-xs font-mono text-neutral-400">
            [Store Administrator: <strong className="text-neutral-200">{username}</strong>]
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 text-neutral-400 hover:text-white transition-colors relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-neutral-950 border border-neutral-800 rounded-xs shadow-2xl p-4 space-y-3 z-50 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="font-bold text-white uppercase text-[11px]">Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[10px] text-neutral-400 hover:text-white underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-neutral-900">
                  {notifications.length === 0 ? (
                    <p className="text-neutral-500 text-center py-4 text-[11px]">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`pt-2 cursor-pointer ${n.isRead ? 'opacity-60' : 'opacity-100 font-semibold'}`}
                      >
                        <div className="text-white text-[11px]">{n.title}</div>
                        <div className="text-neutral-400 text-[10px] line-clamp-2">{n.message}</div>
                        <div className="text-neutral-600 text-[9px] mt-0.5">
                          {new Date(n.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onBackToStore}
            className="flex items-center gap-1.5 text-xs font-mono text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xs transition-colors cursor-pointer"
          >
            <span>Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={logout}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside
          className={`w-full md:w-64 bg-neutral-950 border-r border-neutral-800 p-4 space-y-1.5 shrink-0 ${
            isMobileNavOpen ? 'block' : 'hidden md:block'
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileNavOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xs text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Workspace Content */}
        <main className="flex-1 p-6 lg:p-8 bg-neutral-950 overflow-y-auto">
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'inventory' && <AdminInventory />}
          {activeTab === 'discounts' && <AdminDiscounts />}
          {activeTab === 'delivery' && <AdminDelivery />}
          {activeTab === 'complaints' && <AdminComplaints />}
          {activeTab === 'policies' && <AdminPolicies />}
          {activeTab === 'reviews' && <AdminReviews />}
          {activeTab === 'import-export' && <AdminImportExport />}
          {activeTab === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
};
