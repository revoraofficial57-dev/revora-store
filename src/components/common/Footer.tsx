import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Instagram, Facebook, Video, MessageCircle, Shield, ArrowUpRight, Mail } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useStore();

  return (
    <footer className="bg-neutral-50 border-t border-neutral-200 text-neutral-600 text-xs transition-colors">
      {/* Subtle Racing Accent Hairline */}
      <div className="h-0.5 w-full bg-gradient-to-r from-neutral-200 via-neutral-900 to-neutral-200 opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-black text-xs">
                R
              </div>
              <span className="text-lg font-black tracking-widest text-black uppercase font-display">
                REVORA
              </span>
            </div>
            <p className="text-neutral-500 text-xs leading-relaxed max-w-sm">
              Automotive culture and performance-inspired streetwear. Engineered with heavy cottons, track telemetry graphics, and minimalist design aesthetics for Pakistan's car enthusiast community.
            </p>
            <div className="text-[11px] text-neutral-500 font-mono space-y-1">
              <p>Currency: <span className="text-neutral-900 font-medium">PKR (Pakistani Rupee)</span></p>
              <p>HQ: <span className="text-neutral-700">{settings.address}</span></p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 font-mono">
            <h4 className="text-neutral-900 font-bold text-xs tracking-wider uppercase font-display">
              Collections
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  All Streetwear Pieces
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('winter')}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  Winter Performance Spec
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('designs')}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  Design Matrix (Multi-Cut Silhouettes)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  Heavyweight Hoodies (450 GSM)
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div className="space-y-3 font-mono">
            <h4 className="text-neutral-900 font-bold text-xs tracking-wider uppercase font-display">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('track-order')}
                  className="hover:text-black transition-colors cursor-pointer text-left flex items-center gap-1 text-neutral-700 font-medium"
                >
                  Track Your Order <ArrowUpRight className="w-3 h-3 text-neutral-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('support')}
                  className="hover:text-black transition-colors cursor-pointer text-left flex items-center gap-1 text-neutral-700 font-medium"
                >
                  Complaints & Support Portal <ArrowUpRight className="w-3 h-3 text-neutral-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('reviews')}
                  className="hover:text-black transition-colors cursor-pointer text-left flex items-center gap-1 text-neutral-700 font-medium"
                >
                  Customer Reviews & Feedback <ArrowUpRight className="w-3 h-3 text-neutral-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policies')}
                  className="hover:text-black transition-colors cursor-pointer text-left"
                >
                  Store Rules & Policies
                </button>
              </li>

              <li className="pt-1">
                <span className="text-neutral-700 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-neutral-500" />
                  <a href="mailto:revoraofficial57@gmail.com" className="text-black underline hover:text-neutral-600 font-medium">
                    revoraofficial57@gmail.com
                  </a>
                </span>
              </li>
            </ul>
          </div>

          {/* Social and WhatsApp */}
          <div className="space-y-4 font-mono">
            <h4 className="text-neutral-900 font-bold text-xs tracking-wider uppercase font-display">
              Motorsport Paddock
            </h4>
            <p className="text-neutral-500 text-xs">
              Connect with our paddock crew for order inquiries, size sizing consultations, and limited midnight drops.
            </p>
            <div className="flex items-center gap-3">
              {settings.socialLinks.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xs bg-white border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-black hover:border-black transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.socialLinks.facebook && (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xs bg-white border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-black hover:border-black transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings.socialLinks.tiktok && (
                <a
                  href={settings.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xs bg-white border border-neutral-300 flex items-center justify-center text-neutral-600 hover:text-black hover:border-black transition-colors"
                  aria-label="TikTok"
                >
                  <Video className="w-4 h-4" />
                </a>
              )}
              <a
                href="https://wa.me/923294862442"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-xs bg-white border border-neutral-300 flex items-center justify-center text-emerald-600 hover:border-emerald-600 transition-colors"
                aria-label="WhatsApp"
                title="Chat with REVORA on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('admin')}
                className="text-[11px] text-neutral-400 hover:text-black transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Store Owner Admin Portal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 font-mono">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} REVORA Apparel Lab.</span>
            <span>·</span>
            <span>revoraofficial57@gmail.com</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Verified Banking & COD</span>
            <span>·</span>
            <span>Nationwide Express Transit</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
