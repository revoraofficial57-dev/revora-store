import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { getAllReviews, submitCustomerReview } from '../../services/storage';
import { ProductReview, Product } from '../../types';
import {
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  MessageSquare,
  Filter,
  Search,
  Sparkles,
  ArrowRight,
  Info,
  ThumbsUp,
  Tag,
} from 'lucide-react';

interface CustomerReviewsPageProps {
  onNavigateHome: () => void;
  onSelectProduct: (product: Product) => void;
  initialProductId?: string;
}

export const CustomerReviewsPage: React.FC<CustomerReviewsPageProps> = ({
  onNavigateHome,
  onSelectProduct,
  initialProductId,
}) => {
  const { products, showToast } = useStore();

  const [allReviews, setAllReviews] = useState<ProductReview[]>(() => getAllReviews());
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || (products[0]?.id || '')
  );
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<ProductReview | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const reloadReviews = () => {
    setAllReviews(getAllReviews());
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedProductId) {
      setFormError('Please select which apparel piece you are reviewing.');
      return;
    }
    if (!customerName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!comment.trim() || comment.trim().length < 15) {
      setFormError('Please provide detailed feedback (minimum 15 characters).');
      return;
    }

    setIsSubmitting(true);
    const targetProduct = products.find((p) => p.id === selectedProductId);
    const prodName = targetProduct ? targetProduct.name : 'REVORA Apparel';

    try {
      const created = submitCustomerReview({
        productId: selectedProductId,
        productName: prodName,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        rating,
        comment: comment.trim(),
        orderNumber: orderNumber.trim() || undefined,
      });

      setSubmittedReview(created);
      setIsSubmitting(false);
      setShowReviewForm(false);
      reloadReviews();
      showToast('Review submitted! It will appear after admin approval.');
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || 'Error submitting review.');
    }
  };

  // Only approved reviews are shown to other users / public
  const approvedReviews = allReviews.filter((r) => r.status === 'Approved');

  const filteredReviews = approvedReviews.filter((r) => {
    if (selectedProductFilter !== 'all' && r.productId !== selectedProductFilter) return false;
    if (selectedRatingFilter !== 'all' && r.rating !== selectedRatingFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchProd = (r.productName || '').toLowerCase().includes(q);
      const matchName = (r.customerName || '').toLowerCase().includes(q);
      const matchText = (r.comment || '').toLowerCase().includes(q);
      if (!matchProd && !matchName && !matchText) return false;
    }
    return true;
  });

  const averageRating =
    approvedReviews.length > 0
      ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
      : '5.0';

  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: approvedReviews.filter((r) => r.rating === stars).length,
    percentage:
      approvedReviews.length > 0
        ? Math.round(
            (approvedReviews.filter((r) => r.rating === stars).length / approvedReviews.length) * 100
          )
        : 0,
  }));

  const ratingLabels: { [key: number]: string } = {
    1: '1 Star · Poor Quality / Disappointed',
    2: '2 Stars · Below Expectations',
    3: '3 Stars · Average / Acceptable',
    4: '4 Stars · Very Good / Satisfied',
    5: '5 Stars · Exceptional / Premium Automotive Quality',
  };

  return (
    <div className="py-10 bg-white text-neutral-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <span>COMMUNITY REVIEWS & TELEMETRY</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED MOTORSPORT FEEDBACK
              </span>
            </div>
            <h1 className="text-3xl font-black text-black uppercase font-display tracking-tight mt-1">
              Customer Reviews Panel
            </h1>
            <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
              Read authentic feedback from car enthusiasts across Pakistan, or share your own trackside experience. All submissions are moderated to safeguard community integrity.
            </p>
          </div>

          <button
            onClick={() => {
              setShowReviewForm(!showReviewForm);
              setSubmittedReview(null);
              window.scrollTo({ top: 200, behavior: 'smooth' });
            }}
            className="self-start sm:self-auto bg-black hover:bg-neutral-800 text-white px-5 py-3 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer font-display transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>{showReviewForm ? 'CLOSE REVIEW PANEL' : 'WRITE A CUSTOMER REVIEW'}</span>
          </button>
        </div>

        {/* Recently Submitted Pending Notice (shown right after submission) */}
        {submittedReview && (
          <div className="p-5 bg-amber-50 border border-amber-300 rounded-xs space-y-2 text-amber-950 font-mono shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Review Submitted for Administrator Moderation!</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Thank you, <strong className="text-black">{submittedReview.customerName}</strong>! Your {submittedReview.rating}-star review for <strong className="text-black">{submittedReview.productName}</strong> has been logged into our system. In line with our anti-spam policy, it is currently in <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-xs font-bold">Pending Approval</span> status and will be displayed publicly to all users as soon as our store administrator approves it.
            </p>
          </div>
        )}

        {/* Review Submission Drawer / Panel */}
        {showReviewForm && (
          <div className="bg-neutral-50 border border-neutral-300 p-6 sm:p-8 rounded-xs space-y-6 shadow-md transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-xs rounded-xs">
                  ★
                </div>
                <h2 className="text-lg font-bold text-black uppercase font-display">
                  Submit Your Apparel Review
                </h2>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                Awaiting Admin Verification Policy
              </span>
            </div>

            {/* Moderation Disclosure Notice */}
            <div className="p-3.5 bg-neutral-100 border border-neutral-200 rounded-xs flex items-start gap-3 text-xs text-neutral-700">
              <Info className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-black block mb-0.5 font-mono">
                  Review Moderation Disclosure:
                </strong>
                To protect our community from spam and unverified ratings, all reviews are reviewed by our team before going live on the storefront. Once approved, your review will be published to all visitors.
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-5 text-xs font-mono">
              {/* Product Selector */}
              <div>
                <label className="block text-neutral-700 font-bold mb-1.5 uppercase text-[11px]">
                  1. Select Product Being Reviewed *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  className="w-full bg-white border border-neutral-300 text-black text-xs p-3 rounded-xs focus:outline-none focus:border-black font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Rs. {p.price.toLocaleString()} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-neutral-700 font-bold mb-1.5 uppercase text-[11px]">
                  2. Overall Rating (1 - 5 Stars) *
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1.5 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-500 fill-current'
                            : 'text-neutral-300 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-neutral-800 ml-2">
                    {ratingLabels[rating]}
                  </span>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1.5 uppercase text-[11px]">
                    3. Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Farhan Siddiqui"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-black text-xs p-2.5 rounded-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1.5 uppercase text-[11px]">
                    4. Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="farhan@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-black text-xs p-2.5 rounded-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1.5 uppercase text-[11px]">
                    5. Order Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REV-0227-8910"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-black text-xs p-2.5 rounded-xs focus:outline-none focus:border-black uppercase"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    Grants "Verified Buyer" badge upon approval
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-neutral-700 font-bold mb-1.5 uppercase text-[11px]">
                  6. Review Comments & Trackside Feedback *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail your thoughts on fabric GSM thickness, drop-shoulder sizing accuracy, embroidery/screen-print durability, washing resilience, or delivery speed..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-black text-xs p-3 rounded-xs focus:outline-none focus:border-black"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-black hover:bg-neutral-800 disabled:opacity-50 text-white px-6 py-3.5 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-display transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>{isSubmitting ? 'SUBMITTING TO DESK...' : 'SUBMIT REVIEW FOR ADMIN APPROVAL'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 px-5 py-3 rounded-xs text-xs font-bold uppercase cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rating Breakdown Summary Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-neutral-50 border border-neutral-200 p-6 sm:p-8 rounded-xs shadow-xs">
          {/* Average Score (Left 4 cols) */}
          <div className="lg:col-span-4 text-center sm:text-left space-y-2 border-b lg:border-b-0 lg:border-r border-neutral-200 pb-6 lg:pb-0 lg:pr-8">
            <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">
              STOREWIDE REPUTATION SCORE
            </span>
            <div className="flex items-baseline justify-center sm:justify-start gap-3">
              <span className="text-5xl font-black text-black font-mono tracking-tight">
                {averageRating}
              </span>
              <span className="text-neutral-400 font-mono text-sm">/ 5.0</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start text-amber-500 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-xs text-neutral-600 font-mono pt-1">
              Based on {approvedReviews.length} verified customer review(s) across Pakistan.
            </p>
          </div>

          {/* Star Distribution Bars (Right 8 cols) */}
          <div className="lg:col-span-8 space-y-2 font-mono text-xs">
            {ratingCounts.map((item) => (
              <div key={item.stars} className="flex items-center gap-3">
                <span className="w-12 text-neutral-600 text-right shrink-0">{item.stars} Stars</span>
                <div className="flex-1 bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-black h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="w-12 text-neutral-500 text-right tabular-nums shrink-0">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Filters for Approved Reviews */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Search reviews by apparel, keywords, or reviewer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-black text-xs pl-9 pr-4 py-2.5 rounded-xs font-mono focus:outline-none focus:border-black"
              />
            </div>

            {/* Product Filter */}
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="bg-white border border-neutral-300 text-black text-xs px-3 py-2 rounded-xs font-mono focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="all">All Products ({approvedReviews.length})</option>
              {products.map((p) => {
                const count = approvedReviews.filter((r) => r.productId === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({count})
                  </option>
                );
              })}
            </select>

            {/* Rating Filter */}
            <select
              value={selectedRatingFilter}
              onChange={(e) =>
                setSelectedRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-white border border-neutral-300 text-black text-xs px-3 py-2 rounded-xs font-mono focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4 Stars Only</option>
              <option value="3">3 Stars Only</option>
            </select>
          </div>

          <div className="text-xs font-mono text-neutral-500">
            Showing {filteredReviews.length} approved review(s)
          </div>
        </div>

        {/* Approved Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-neutral-50 border border-neutral-200 rounded-xs space-y-3">
              <MessageSquare className="w-8 h-8 mx-auto text-neutral-400" />
              <p className="text-xs text-neutral-600 font-mono">
                No approved reviews found matching your filter criteria.
              </p>
              <button
                onClick={() => {
                  setSelectedProductFilter('all');
                  setSelectedRatingFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs font-bold font-mono text-black underline cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredReviews.map((rev) => {
              const prod = products.find((p) => p.id === rev.productId);
              return (
                <div
                  key={rev.id}
                  className="bg-white border border-neutral-200 p-6 rounded-xs space-y-4 shadow-xs hover:border-black hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Product Tag */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-100">
                      <button
                        onClick={() => prod && onSelectProduct(prod)}
                        className="text-left font-display text-xs font-bold text-neutral-900 hover:text-black line-clamp-1 cursor-pointer"
                      >
                        {rev.productName}
                      </button>
                      <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1.5 text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                      <span className="text-[11px] font-mono text-neutral-600 ml-1">
                        {rev.rating}.0 / 5.0
                      </span>
                    </div>

                    {/* Review Body */}
                    <p className="text-xs text-neutral-700 leading-relaxed font-mono">
                      "{rev.comment}"
                    </p>
                  </div>

                  {/* Reviewer Details */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-[10px]">
                        {rev.customerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-black">{rev.customerName}</span>
                    </div>

                    {rev.isVerifiedPurchase && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
