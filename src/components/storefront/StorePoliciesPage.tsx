import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { StorePolicy } from '../../types';
import { getPublishedPolicies } from '../../services/storage';
import {
  BookOpen,
  Search,
  CheckCircle2,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  PackageX,
  Sparkles,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface StorePoliciesPageProps {
  onNavigateHome: () => void;
  onExploreProducts: () => void;
}

export const StorePoliciesPage: React.FC<StorePoliciesPageProps> = ({
  onNavigateHome,
  onExploreProducts,
}) => {
  const [policies, setPolicies] = useState<StorePolicy[]>(() => getPublishedPolicies());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    setPolicies(getPublishedPolicies());
  }, []);

  const categories = [
    'All',
    'Order Rules',
    'Payment & Advance Rules',
    'Cash on Delivery Rules',
    'Delivery & Shipping',
    'Replacement & Exchange',
    'Damaged/Defective Claims',
    'Refund Policy',
    'Cancellation Policy',
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Order Rules':
        return <FileText className="w-4 h-4 text-neutral-800" />;
      case 'Payment & Advance Rules':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'Cash on Delivery Rules':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'Delivery & Shipping':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'Replacement & Exchange':
        return <RotateCcw className="w-4 h-4 text-indigo-600" />;
      case 'Cancellation Policy':
        return <PackageX className="w-4 h-4 text-red-600" />;
      case 'Refund Policy':
        return <RotateCcw className="w-4 h-4 text-emerald-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-neutral-600" />;
    }
  };

  const filtered = policies
    .filter((p) => p.isPublished)
    .filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchContent = p.content.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchCat) return false;
      }
      return true;
    })
    .sort((a, b) => a.order - b.order);

  return (
    <div className="py-12 bg-neutral-50 min-h-screen text-neutral-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-3 border-b border-neutral-200 pb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <button onClick={onNavigateHome} className="hover:text-black cursor-pointer">
              Home
            </button>
            <span>/</span>
            <span className="text-black font-semibold">Store Rules & Policies</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-black uppercase font-display tracking-tight flex items-center gap-3">
                <BookOpen className="w-7 h-7 text-black" />
                <span>Store Rules & Operating Policies</span>
              </h1>
              <p className="text-xs font-mono text-neutral-600 mt-1 max-w-xl">
                Official rules governing orders, payments, doorstep inspection, dispatch logistics, and 7-day exchanges across Pakistan.
              </p>
            </div>

            <button
              onClick={onExploreProducts}
              className="bg-black hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xs text-xs font-mono font-bold uppercase tracking-wider shrink-0 cursor-pointer shadow-xs transition-colors"
            >
              Browse Collection
            </button>
          </div>
        </div>

        {/* Search Bar & Category Filter Pills */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search policies (e.g. advance, return, express, COD)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-xs text-xs font-mono text-black placeholder-neutral-400 focus:border-black shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xs uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-black text-white font-bold shadow-xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-black hover:text-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Policies Content Cards */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="p-12 text-center bg-white border border-neutral-200 rounded-xs space-y-3">
              <BookOpen className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-xs font-mono text-neutral-600">
                No published store policies found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="text-xs font-mono text-black underline font-bold cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filtered.map((policy) => (
              <article
                key={policy.id}
                className="bg-white border border-neutral-200 hover:border-neutral-400 p-6 sm:p-7 rounded-xs transition-all shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(policy.category)}
                    <span className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
                      {policy.category}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-400">
                    Policy Rev. {new Date(policy.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-black font-display uppercase tracking-wide">
                  {policy.title}
                </h3>

                <p className="text-xs font-mono text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {policy.content}
                </p>
              </article>
            ))
          )}
        </div>

        {/* Paddock Assurance Note */}
        <div className="bg-neutral-900 text-neutral-200 p-6 rounded-xs space-y-2 border border-neutral-800 font-mono text-xs">
          <div className="flex items-center gap-2 text-white font-bold font-display uppercase text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>REVORA Customer Rights Guarantee</span>
          </div>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            All policy decisions are made in strict compliance with consumer standards in Pakistan. For real-time inquiries, our paddock team can be reached via WhatsApp (+92 329 4862442) or email at revoraofficial57@gmail.com.
          </p>
        </div>
      </div>
    </div>
  );
};
