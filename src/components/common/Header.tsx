import React, { useState } from 'react';
import { ShoppingBag, Heart, Search, Shield, Menu, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
  const { cart, wishlist, setIsCartOpen } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navLinks = [
    { id: 'shop', label: 'Collection' },
    { id: 'designs', label: 'Design Matrix' },
    { id: 'winter', label: 'Winter Spec' },
    { id: 'track-order', label: 'Track Order' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'support', label: 'Support & Complaints' },
    { id: 'policies', label: 'Store Rules' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-colors text-neutral-900">
      {/* Slim Announcement Banner */}
      <div className="bg-neutral-900 text-[11px] font-medium tracking-wider text-neutral-300 py-1.5 px-4 text-center flex items-center justify-center gap-3">
        <span className="text-white font-semibold">FREE EXPRESS DELIVERY ACROSS PAKISTAN OVER RS. 6,000</span>
        <span className="hidden sm:inline text-neutral-500">·</span>
        <span className="hidden sm:inline text-neutral-300">REVORA AUTOMOTIVE STREETWEAR LAB</span>
      </div>

      {/* Main Top Bar: Clean 3-zone contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 group text-left cursor-pointer"
          >
            <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-black text-xs tracking-tighter rounded-xs group-hover:bg-neutral-800 transition-colors">
              R
            </div>
            <span className="text-xl font-black tracking-widest text-black whitespace-nowrap uppercase font-display">
              REVORA
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-wide uppercase font-mono">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`whitespace-nowrap transition-colors hover:text-black cursor-pointer pb-1 ${
                currentPage === link.id
                  ? 'text-black border-b-2 border-black font-bold'
                  : 'text-neutral-500'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            onClick={() => onNavigate('shop')}
            className="text-neutral-600 hover:text-black transition-colors p-1.5 cursor-pointer"
            title="Search Catalog"
            aria-label="Search Catalog"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('wishlist')}
            className="text-neutral-600 hover:text-black transition-colors relative p-1.5 cursor-pointer"
            title="Saved Items"
            aria-label="Saved Items"
          >
            <Heart className="w-4 h-4" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-xs transition-colors cursor-pointer text-xs font-semibold tracking-wider font-mono shadow-xs"
            title="View Shopping Bag"
            aria-label="View Shopping Bag"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">BAG</span>
            <span className="text-neutral-300 tabular-nums">({totalCartCount})</span>
          </button>

          <button
            onClick={() => onNavigate('admin')}
            className="text-neutral-400 hover:text-black transition-colors p-1.5 cursor-pointer"
            title="Admin Portal"
            aria-label="Admin Portal"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-neutral-700 hover:text-black p-1"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-neutral-200 px-4 py-4 space-y-3 font-mono text-xs">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 font-medium text-neutral-700 hover:text-black"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-neutral-200 flex items-center justify-end">
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="text-xs text-neutral-600 hover:text-black flex items-center gap-1 font-bold"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
