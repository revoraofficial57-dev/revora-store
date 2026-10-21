import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { getAllOrders } from '../../services/storage';
import { Order } from '../../types';
import { User, Package, Heart, LogOut, Clock, Shield, AlertCircle } from 'lucide-react';

interface CustomerAccountPageProps {
  onTrackOrder: (orderNumber: string) => void;
  onExploreProducts: () => void;
  onNavigate?: (page: string) => void;
}

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({
  onTrackOrder,
  onExploreProducts,
  onNavigate,
}) => {
  const { customer, customerLogin, customerRegister, customerLogout, wishlist, products, formatPKR } = useStore();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Orders associated with customer's email
  const customerOrders: Order[] = customer
    ? getAllOrders().filter((o) => o.customerEmail.toLowerCase() === customer.email.toLowerCase())
    : [];

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const res = await customerLogin(loginEmail, loginPassword);
    if (!res.success) {
      setAuthError(res.error || 'Login failed.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    const res = await customerRegister(regName, regEmail, regPhone, regPassword);
    if (!res.success) {
      setAuthError(res.error || 'Registration failed.');
    }
  };

  if (!customer) {
    return (
      <div className="py-16 bg-white min-h-screen text-neutral-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-neutral-100 border border-neutral-300 mx-auto rounded-full flex items-center justify-center text-neutral-700">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-black uppercase font-display">
              {isLoginTab ? 'Customer Sign In' : 'Create Customer Account'}
            </h1>
            <p className="text-xs text-neutral-600">
              Optional customer membership for fast order lookup & wishlist sync. Guest checkout is always available.
            </p>
          </div>

          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => {
                setIsLoginTab(true);
                setAuthError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-wider text-center cursor-pointer transition-colors ${
                isLoginTab ? 'border-b-2 border-black text-black font-bold' : 'text-neutral-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLoginTab(false);
                setAuthError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-wider text-center cursor-pointer transition-colors ${
                !isLoginTab ? 'border-b-2 border-black text-black font-bold' : 'text-neutral-500'
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {isLoginTab ? (
            <form onSubmit={handleLoginSubmit} className="bg-neutral-50 border border-neutral-200 p-6 rounded-xs space-y-4 shadow-xs">
              <div>
                <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black hover:bg-neutral-800 text-white py-3 px-4 rounded-xs text-xs font-bold uppercase tracking-wider cursor-pointer font-display transition-colors shadow-xs"
              >
                Sign In to Account
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="bg-neutral-50 border border-neutral-200 p-6 rounded-xs space-y-4 shadow-xs">
              <div>
                <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ali Reza"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">Mobile Phone (WhatsApp)</label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="0300 1234567"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">Create Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black hover:bg-neutral-800 text-white py-3 px-4 rounded-xs text-xs font-bold uppercase tracking-wider cursor-pointer font-display transition-colors shadow-xs"
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-white min-h-screen text-neutral-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Card */}
        <div className="bg-neutral-50 border border-neutral-200 p-6 sm:p-8 rounded-xs shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg font-display">
              {customer.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                REVORA VERIFIED CUSTOMER
              </div>
              <h1 className="text-2xl font-black text-black uppercase font-display">
                {customer.fullName}
              </h1>
              <div className="text-xs text-neutral-600 font-mono mt-0.5 flex flex-wrap gap-3">
                <span>{customer.email}</span>
                <span>·</span>
                <span>{customer.phone}</span>
              </div>
            </div>
          </div>

          <button
            onClick={customerLogout}
            className="self-start sm:self-auto flex items-center gap-2 text-xs font-mono text-neutral-600 hover:text-black bg-white border border-neutral-300 px-4 py-2 rounded-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* 5-Day Data Retention Disclaimer */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xs flex items-start gap-3 text-xs text-neutral-600">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-black block mb-0.5 font-mono">
              Privacy & Automatic 5-Day Data Retention Policy:
            </span>
            <span>
              To safeguard customer privacy, personal delivery addresses and payment proof receipts are automatically scheduled for anonymization 5 days after delivery fulfillment.
            </span>
          </div>
        </div>

        {/* Content Columns: Orders vs Wishlist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Order History (Left 8 Cols) */}
          <div className="lg:col-span-8 bg-white border border-neutral-200 p-6 rounded-xs space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-bold text-black uppercase font-display flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>Your Order History ({customerOrders.length})</span>
              </h3>
            </div>

            {customerOrders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Clock className="w-8 h-8 mx-auto text-neutral-400" />
                <p className="text-xs text-neutral-600">You haven't placed any orders with this email yet.</p>
                <button
                  onClick={onExploreProducts}
                  className="bg-black text-white hover:bg-neutral-800 px-4 py-2 text-xs font-bold uppercase rounded-xs cursor-pointer"
                >
                  Browse Storefront
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {customerOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 bg-neutral-50 border border-neutral-200 rounded-xs space-y-3 font-mono text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                      <div>
                        <span className="font-bold text-black text-sm">{ord.orderNumber}</span>
                        <span className="text-neutral-500 text-[11px] block">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded-xs text-[10px] font-bold">
                          {ord.orderStatus.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xs text-[10px]">
                          {ord.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-neutral-700">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.quantity}x {it.productName} ({it.clothingType}, {it.size})</span>
                          <span className="font-bold text-black">{formatPKR(it.price * it.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-neutral-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-black">Total: {formatPKR(ord.total)}</span>
                        <div className="flex items-center gap-3">
                          {onNavigate && (
                            <button
                              onClick={() => onNavigate('reviews')}
                              className="text-neutral-600 hover:text-black font-semibold text-[11px] underline cursor-pointer"
                            >
                              ★ Leave Review
                            </button>
                          )}
                          <button
                            onClick={() => onTrackOrder(ord.orderNumber)}
                            className="text-black font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Live Telemetry</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>

                      {ord.isPartialPayment && (
                        <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-xs text-[11px] text-amber-950 flex flex-wrap justify-between gap-2">
                          <span>Advance ({ord.advancePercentage}%): <strong>{formatPKR(ord.advanceAmount)}</strong></span>
                          <span>Paid: <strong className="text-emerald-700">{formatPKR(ord.amountReceived)}</strong></span>
                          <span>Remaining Balance: <strong className="text-black">{formatPKR(ord.remainingBalance)}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Wishlist (Right 4 Cols) */}
          <div className="lg:col-span-4 bg-neutral-50 border border-neutral-200 p-6 rounded-xs space-y-4 shadow-xs">
            <h3 className="font-bold text-black uppercase font-display flex items-center gap-2 pb-3 border-b border-neutral-200">
              <Heart className="w-4 h-4" />
              <span>Saved Pieces ({wishlistedProducts.length})</span>
            </h3>

            {wishlistedProducts.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">No pieces saved in your wishlist.</p>
            ) : (
              <div className="space-y-3">
                {wishlistedProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 bg-white border border-neutral-200 rounded-xs">
                    <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded-xs bg-neutral-100" />
                    <div className="flex-1 text-xs">
                      <h4 className="font-semibold text-black line-clamp-1">{p.name}</h4>
                      <div className="font-mono text-black font-bold mt-0.5">{formatPKR(p.salePrice || p.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
