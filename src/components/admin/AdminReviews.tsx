import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { getAllReviews, saveReview, deleteReview } from '../../services/storage';
import { ProductReview } from '../../types';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Check,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  ThumbsUp,
  AlertCircle,
} from 'lucide-react';

export const AdminReviews: React.FC = () => {
  const { showToast } = useStore();
  const [reviews, setReviews] = useState<ProductReview[]>(() => getAllReviews());
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const reload = () => setReviews(getAllReviews());

  const handleUpdateStatus = (rev: ProductReview, status: 'Approved' | 'Pending' | 'Rejected') => {
    saveReview({ ...rev, status });
    reload();
    showToast(
      status === 'Approved'
        ? `Review by ${rev.customerName} approved and now LIVE on storefront!`
        : `Review marked as ${status}`
    );
  };

  const handleToggleVerified = (rev: ProductReview) => {
    const updated: ProductReview = {
      ...rev,
      isVerifiedPurchase: !rev.isVerifiedPurchase,
    };
    saveReview(updated);
    reload();
    showToast(`Marked as ${updated.isVerifiedPurchase ? 'Verified Buyer' : 'Unverified'}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete review from ${name}?`)) {
      deleteReview(id);
      reload();
      showToast('Review permanently deleted');
    }
  };

  const pendingCount = reviews.filter((r) => r.status === 'Pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'Approved').length;
  const rejectedCount = reviews.filter((r) => r.status === 'Rejected').length;

  const filteredReviews = reviews.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchProd = (r.productName || '').toLowerCase().includes(q);
      const matchName = (r.customerName || '').toLowerCase().includes(q);
      const matchEmail = (r.customerEmail || '').toLowerCase().includes(q);
      const matchComment = (r.comment || '').toLowerCase().includes(q);
      if (!matchProd && !matchName && !matchEmail && !matchComment) return false;
    }
    return true;
  });

  const averageRating =
    approvedCount > 0
      ? (
          reviews
            .filter((r) => r.status === 'Approved')
            .reduce((sum, r) => sum + r.rating, 0) / approvedCount
        ).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white uppercase font-display flex items-center gap-2">
            <span>Customer Reviews Moderation</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono rounded-full font-bold animate-pulse">
                {pendingCount} Pending Approval
              </span>
            )}
          </h2>
          <p className="text-xs font-mono text-neutral-400 mt-0.5">
            Customer reviews submitted from storefront are held in Pending state until approved by admin
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xs flex items-center gap-2">
            <span className="text-neutral-400">Store Average:</span>
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <span>{averageRating}</span>
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-neutral-500">({approvedCount} Live)</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 border rounded-xs text-left cursor-pointer transition-colors ${
            statusFilter === 'all'
              ? 'bg-neutral-900 border-white text-white'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
          }`}
        >
          <div className="text-[10px] uppercase text-neutral-500">Total Reviews</div>
          <div className="text-lg font-bold text-white mt-1">{reviews.length}</div>
        </button>

        <button
          onClick={() => setStatusFilter('Pending')}
          className={`p-3 border rounded-xs text-left cursor-pointer transition-colors relative ${
            statusFilter === 'Pending'
              ? 'bg-amber-950/40 border-amber-500 text-amber-200'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
          }`}
        >
          <div className="text-[10px] uppercase text-amber-400 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Pending Approval</span>
          </div>
          <div className="text-lg font-bold text-amber-300 mt-1">{pendingCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter('Approved')}
          className={`p-3 border rounded-xs text-left cursor-pointer transition-colors ${
            statusFilter === 'Approved'
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
          }`}
        >
          <div className="text-[10px] uppercase text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved & Live</span>
          </div>
          <div className="text-lg font-bold text-emerald-300 mt-1">{approvedCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter('Rejected')}
          className={`p-3 border rounded-xs text-left cursor-pointer transition-colors ${
            statusFilter === 'Rejected'
              ? 'bg-red-950/40 border-red-500 text-red-200'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
          }`}
        >
          <div className="text-[10px] uppercase text-red-400 font-semibold flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Hidden / Rejected</span>
          </div>
          <div className="text-lg font-bold text-red-300 mt-1">{rejectedCount}</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by customer name, email, product, or review text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs pl-9 pr-4 py-2.5 rounded-xs font-mono focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'Pending', 'Approved', 'Rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-mono uppercase rounded-xs border cursor-pointer transition-colors ${
                statusFilter === s
                  ? 'bg-white text-black font-bold border-white'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xs overflow-x-auto shadow-xs">
        <table className="w-full text-xs font-mono text-left text-neutral-300">
          <thead className="bg-neutral-900 text-neutral-400 uppercase text-[11px] border-b border-neutral-800">
            <tr>
              <th className="p-3.5">Product</th>
              <th className="p-3.5">Reviewer Details</th>
              <th className="p-3.5">Rating</th>
              <th className="p-3.5">Feedback Comment</th>
              <th className="p-3.5">Verified Buyer</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-500 text-xs">
                  No reviews matching selected filters.
                </td>
              </tr>
            ) : (
              filteredReviews.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="p-3.5 font-semibold text-white max-w-xs">
                    <div className="font-display">{r.productName}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      Submitted: {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="text-white font-medium">{r.customerName}</div>
                    <div className="text-[10px] text-neutral-400">{r.customerEmail}</div>
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <div className="flex text-amber-400 items-center gap-1">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                      <span className="text-neutral-400 text-[11px] ml-1">({r.rating}/5)</span>
                    </div>
                  </td>

                  <td className="p-3.5 max-w-md text-neutral-200 leading-relaxed">
                    <p className="line-clamp-3">{r.comment}</p>
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleVerified(r)}
                      className={`px-2 py-0.5 text-[10px] rounded-xs border cursor-pointer font-mono flex items-center gap-1 ${
                        r.isVerifiedPurchase
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                          : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                      }`}
                      title="Click to toggle verified buyer badge"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{r.isVerifiedPurchase ? 'Verified Buyer' : 'Unverified'}</span>
                    </button>
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-[10px] rounded-xs border font-bold uppercase tracking-wider ${
                        r.status === 'Approved'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : r.status === 'Rejected'
                          ? 'bg-red-950/80 text-red-400 border-red-800'
                          : 'bg-amber-950/80 text-amber-300 border-amber-600 animate-pulse'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {r.status !== 'Approved' && (
                        <button
                          onClick={() => handleUpdateStatus(r, 'Approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xs text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          title="Approve to make visible to all customers"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve & Publish</span>
                        </button>
                      )}

                      {r.status !== 'Rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(r, 'Rejected')}
                          className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xs text-[10px] border border-neutral-800 cursor-pointer transition-colors"
                          title="Hide from public view"
                        >
                          <span>Hide</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(r.id, r.customerName)}
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/30 rounded-xs cursor-pointer transition-colors"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
