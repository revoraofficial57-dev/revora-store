import React, { useState } from 'react';
import { Product, ProductReview } from '../../types';
import { useStore } from '../../context/StoreContext';
import { getApprovedReviews, submitCustomerReview } from '../../services/storage';
import {
  Heart,
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  Ruler,
  Star,
  Layers,
  ArrowLeft,
  Share2,
  Lock,
  Clock,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onSelectProduct: (p: Product) => void;
  onCheckoutDirectly: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onSelectProduct,
  onCheckoutDirectly,
}) => {
  const {
    addToCart,
    wishlist,
    toggleWishlist,
    formatPKR,
    products,
    designs,
    deliveryCity,
    setDeliveryCity,
    deliveryFee,
    estimatedDeliveryDays,
    isFreeDelivery,
    showToast,
  } = useStore();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Black');
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Reviews state - only approved reviews are shown to customers
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    return getApprovedReviews(product.id);
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewOrderNumber, setReviewOrderNumber] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [pendingReviewNotice, setPendingReviewNotice] = useState<ProductReview | null>(null);

  // Sibling products for this design (the separate clothing types under the same design!)
  const design = designs.find((d) => d.id === product.designId);
  const allDesignProducts = products.filter(
    (p) => p.designId === product.designId && p.status === 'active'
  );
  const siblingProducts = allDesignProducts.filter((p) => p.id !== product.id);

  // Variant matching
  const currentVariant = product.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const availableStock = currentVariant ? currentVariant.stock : 0;
  const isSoldOut = availableStock <= 0;
  const unitPrice = currentVariant?.priceOverride || product.salePrice || product.price;
  const isWishlisted = wishlist.includes(product.id);

  const handleAdd = () => {
    if (isSoldOut) return;
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    const ok = addToCart(product, selectedSize, selectedColor, quantity);
    if (ok) {
      onCheckoutDirectly();
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    // Submits with status 'Pending' and triggers admin notification
    const submitted = submitCustomerReview({
      productId: product.id,
      productName: product.name,
      customerName: reviewName.trim(),
      customerEmail: reviewEmail.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      orderNumber: reviewOrderNumber.trim() || undefined,
    });

    setPendingReviewNotice(submitted);
    setShowReviewForm(false);
    setReviewComment('');
    showToast('Review submitted! It will appear once approved by store admin.');
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="py-8 bg-white text-neutral-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs font-mono text-neutral-500 pb-4 border-b border-neutral-200">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO COLLECTION</span>
          </button>

          <div className="flex items-center gap-2">
            <span>{product.category}</span>
            <span>/</span>
            <span className="text-black font-semibold">{product.name}</span>
          </div>
        </div>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Gallery Module (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Stage Image */}
            <div className="aspect-4/3 w-full bg-neutral-100 border border-neutral-200 rounded-sm overflow-hidden relative shadow-xs">
              <img
                src={product.images[activeImageIdx] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {product.isWinterCollection && (
                  <span className="text-[10px] font-mono font-medium tracking-wider text-black bg-white px-2.5 py-1 border border-neutral-300 shadow-xs">
                    WINTER SPEC
                  </span>
                )}
                {product.salePrice && product.salePrice < product.price && (
                  <span className="text-[10px] font-mono font-bold tracking-wider text-white bg-black px-2.5 py-1">
                    SAVE {product.discountPercentage || 12}%
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail selector (up to 4 images) */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`aspect-4/3 w-20 shrink-0 bg-neutral-100 border rounded-xs overflow-hidden cursor-pointer transition-all ${
                      activeImageIdx === idx
                        ? 'border-black ring-2 ring-black'
                        : 'border-neutral-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Angle ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contiguous Purchase Module (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 bg-white p-6 border border-neutral-200 rounded-xs shadow-xs">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-wider">
                <span>{product.clothingType}</span>
                <span>·</span>
                <span>SKU: {currentVariant?.sku || product.sku}</span>
              </div>

              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-black uppercase font-display leading-tight">
                {product.name}
              </h1>

              {/* Design Line link */}
              {design && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-600">
                  <span>Design Artwork Motif:</span>
                  <span className="text-black font-semibold underline">
                    {design.name}
                  </span>
                </div>
              )}

              {/* Price row */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-extrabold text-black font-mono tabular-nums">
                  {formatPKR(unitPrice)}
                </span>
                {product.salePrice && product.salePrice < product.price && (
                  <span className="text-sm text-neutral-400 line-through font-mono tabular-nums">
                    {formatPKR(product.price)}
                  </span>
                )}
              </div>
            </div>

            {/* Clothing Type Selection for this Design (Requirement 3: Separate pricing for each clothing type) */}
            {allDesignProducts.length > 1 && (
              <div className="space-y-2 pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-neutral-600 uppercase tracking-wider">
                    Clothing Type / Cut: <strong className="text-black">{product.clothingType}</strong>
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {allDesignProducts.length} Cuts Available
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {allDesignProducts.map((p) => {
                    const isCurrent = p.id === product.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (p.id !== product.id) {
                            onSelectProduct(p);
                          }
                        }}
                        className={`p-2.5 text-left rounded-xs border text-xs font-mono transition-all cursor-pointer flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-black text-white border-black font-bold shadow-xs'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black hover:text-black'
                        }`}
                      >
                        <span className="font-display font-semibold line-clamp-1">{p.clothingType}</span>
                        <span className={`text-[11px] mt-1 tabular-nums ${isCurrent ? 'text-neutral-300' : 'text-neutral-900 font-bold'}`}>
                          {formatPKR(p.salePrice || p.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes & Size Guide trigger */}
            <div className="space-y-2 pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-neutral-600 uppercase tracking-wider">
                  Select Size: <strong className="text-black">{selectedSize}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Chart</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const v = product.variants.find((item) => item.size === s && item.color === selectedColor);
                  const isOutOfStock = v ? v.stock <= 0 : false;
                  return (
                    <button
                      key={s}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-12 h-10 px-3 text-xs font-mono font-medium rounded-xs border transition-all cursor-pointer ${
                        selectedSize === s
                          ? 'bg-black text-white border-black font-bold shadow-xs'
                          : isOutOfStock
                          ? 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through cursor-not-allowed'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <span className="block text-xs font-mono text-neutral-600 uppercase tracking-wider">
                Colorway: <strong className="text-black">{selectedColor}</strong>
              </span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3.5 h-8 text-xs font-mono rounded-xs border transition-colors cursor-pointer ${
                      selectedColor === c
                        ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Stock Gauge */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-neutral-300 rounded-xs bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-neutral-600 hover:text-black cursor-pointer font-bold"
                >
                  -
                </button>
                <span className="px-3 py-2 text-xs font-mono font-bold text-black tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(availableStock || 1, q + 1))}
                  className="px-3 py-2 text-neutral-600 hover:text-black cursor-pointer font-bold"
                >
                  +
                </button>
              </div>

              <div className="text-xs font-mono">
                {availableStock > 0 ? (
                  <span className="text-neutral-700">
                    {availableStock <= 5 ? (
                      <strong className="text-amber-600">Only {availableStock} left in stock</strong>
                    ) : (
                      `✓ In Stock (${availableStock} units ready)`
                    )}
                  </span>
                ) : (
                  <span className="text-red-600 font-bold">Currently Sold Out</span>
                )}
              </div>
            </div>

            {/* CTAs: Add to Bag & Buy Now */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={isSoldOut}
                onClick={handleAdd}
                className={`w-full py-3.5 px-4 rounded-xs text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer font-display ${
                  isSoldOut
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-black hover:bg-neutral-800 text-white shadow-sm'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isSoldOut ? 'SOLD OUT' : 'ADD TO BAG'}</span>
              </button>

              <button
                type="button"
                disabled={isSoldOut}
                onClick={handleBuyNow}
                className={`w-full py-3.5 px-4 rounded-xs text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer font-display border border-neutral-300 ${
                  isSoldOut
                    ? 'hidden'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-black'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-neutral-600" />
                <span>BUY NOW (EXPRESS CHECKOUT)</span>
              </button>
            </div>

            {/* Wishlist & Share actions */}
            <div className="flex items-center justify-between pt-2 text-xs text-neutral-600 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className="flex items-center gap-1.5 hover:text-black transition-colors cursor-pointer"
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-black text-black' : ''}`} />
                <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('Link copied to clipboard');
                  }
                }}
                className="flex items-center gap-1.5 hover:text-black transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Piece</span>
              </button>
            </div>

            {/* Payment Methods Restrictions per product */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xs space-y-2 text-xs">
              <span className="font-mono text-neutral-600 uppercase tracking-wider block">
                Available Payment Methods for this Piece:
              </span>
              <div className="flex flex-wrap gap-2">
                {product.allowedPaymentMethods.map((m) => (
                  <span
                    key={m}
                    className="bg-white border border-neutral-200 text-neutral-800 px-2.5 py-1 text-[11px] font-mono rounded-xs shadow-xs"
                  >
                    {m === 'COD' && '✓ Cash on Delivery (COD)'}
                    {m === 'ONLINE' && '✓ Online Payment'}
                    {m === 'BANK_TRANSFER' && '✓ Direct Bank Transfer'}
                  </span>
                ))}
              </div>
            </div>

            {/* Delivery calculator */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-black" />
                  <span>Delivery Estimate</span>
                </span>
                <span className="text-black font-bold font-mono">
                  {isFreeDelivery ? 'FREE SHIPPING' : formatPKR(deliveryFee)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="bg-white border border-neutral-300 text-neutral-800 text-xs px-2.5 py-1.5 rounded-xs font-mono"
                >
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Peshawar">Peshawar</option>
                  <option value="Multan">Multan</option>
                  <option value="Sialkot">Sialkot</option>
                  <option value="Default">Other Cities (Nationwide)</option>
                </select>
                <span className="text-neutral-500 text-[11px]">
                  Estimated: <strong className="text-neutral-800">{estimatedDeliveryDays}</strong>
                </span>
              </div>
            </div>

            {/* Description Tabular details */}
            <div className="pt-4 border-t border-neutral-200 space-y-3 text-xs text-neutral-700 leading-relaxed">
              <h4 className="font-display font-bold text-black uppercase tracking-wider">
                Engineering & Fabric Specifications
              </h4>
              <p>{product.description}</p>
              <ul className="space-y-1 text-neutral-600 list-disc list-inside">
                <li>Pre-shrunk double-stitched automotive garment construction</li>
                <li>Reactive-dyed color retention for persistent jet-black tone</li>
                <li>Weight: {product.weightKg ? `${product.weightKg} kg` : '0.45 kg'}</li>
                <li>Engineered in Pakistan for the motorsport enthusiast community</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sibling Products for this Design */}
        {siblingProducts.length > 0 && (
          <div className="pt-12 border-t border-neutral-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-widest">
                  <Layers className="w-3.5 h-3.5 text-black" />
                  <span>DESIGN MATRIX CONTINUITY</span>
                </div>
                <h3 className="text-xl font-black text-black uppercase font-display mt-1">
                  More cuts featuring the "{design?.name}" artwork
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                {allDesignProducts.length} Silhouettes in this Collection
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {siblingProducts.map((sib) => (
                <div
                  key={sib.id}
                  onClick={() => onSelectProduct(sib)}
                  className="bg-white border border-neutral-200 hover:border-black p-3 rounded-xs cursor-pointer transition-all group shadow-xs"
                >
                  <div className="aspect-4/3 bg-neutral-100 rounded-xs overflow-hidden mb-2.5">
                    <img
                      src={sib.images[0]}
                      alt={sib.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">{sib.clothingType}</div>
                  <h4 className="text-xs font-semibold text-black line-clamp-1 group-hover:text-neutral-600">
                    {sib.name}
                  </h4>
                  <div className="mt-1 text-xs font-mono font-bold text-black tabular-nums">
                    {formatPKR(sib.salePrice || sib.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="pt-12 border-t border-neutral-200 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-black uppercase font-display">
                  Customer Reviews
                </h3>
                <span className="text-xs font-mono text-neutral-500">
                  ({reviews.length} Verified Opinions)
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-neutral-600">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span>{averageRating} out of 5</span>
              </div>
            </div>

            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-xs transition-colors cursor-pointer"
            >
              {showReviewForm ? 'Cancel Review' : 'Write a Review'}
            </button>
          </div>

          {/* Pending Review Success Notice */}
          {pendingReviewNotice && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xs space-y-1.5 font-mono text-xs text-amber-950">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Review Submitted — Awaiting Administrator Approval</span>
              </div>
              <p className="text-amber-900 leading-relaxed">
                Thank you, <strong className="text-black">{pendingReviewNotice.customerName}</strong>! Your {pendingReviewNotice.rating}-star review for <strong>{product.name}</strong> has been logged into our moderation queue. In accordance with store policy, it will be published to other customers as soon as the store admin approves it.
              </p>
            </div>
          )}

          {/* Review Submission Form */}
          {showReviewForm && (
            <form
              onSubmit={handleReviewSubmit}
              className="bg-neutral-50 border border-neutral-300 p-6 sm:p-7 rounded-xs space-y-4 max-w-xl shadow-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                <h4 className="text-sm font-bold text-black font-display uppercase tracking-wide">
                  Share Your Experience With {product.name}
                </h4>
                <span className="text-[10px] font-mono text-neutral-500">Moderated Policy</span>
              </div>

              {/* Moderation Disclosure */}
              <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-xs flex items-start gap-2.5 text-[11px] font-mono text-neutral-600">
                <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Moderation Policy:</strong> To prevent spam and maintain genuine buyer feedback, all reviews are sent to our administration team for verification before appearing publicly.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-700 font-bold mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="e.g. Bilal Ahmed"
                    className="w-full bg-white border border-neutral-300 text-black text-xs px-3 py-2 rounded-xs focus:outline-none focus:border-black font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-700 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={reviewEmail}
                    onChange={(e) => setReviewEmail(e.target.value)}
                    placeholder="bilal@gmail.com"
                    className="w-full bg-white border border-neutral-300 text-black text-xs px-3 py-2 rounded-xs focus:outline-none focus:border-black font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-700 font-bold mb-1">
                  Order Number (Optional)
                </label>
                <input
                  type="text"
                  value={reviewOrderNumber}
                  onChange={(e) => setReviewOrderNumber(e.target.value)}
                  placeholder="e.g. REV-0227-8910 (Grants Verified Buyer badge)"
                  className="w-full bg-white border border-neutral-300 text-black text-xs px-3 py-2 rounded-xs focus:outline-none focus:border-black font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-700 font-bold mb-1">Star Rating (1 - 5) *</label>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'text-amber-500 fill-current'
                            : 'text-neutral-300 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold font-mono text-neutral-800 ml-2">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-700 font-bold mb-1">Review Comments *</label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell us about the fabric GSM thickness, drop-shoulder sizing accuracy, embroidery/screen-print durability, or trackside performance..."
                  className="w-full bg-white border border-neutral-300 text-black text-xs p-3 rounded-xs focus:outline-none focus:border-black font-mono"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase px-5 py-3 rounded-xs transition-colors cursor-pointer font-display tracking-wider"
                >
                  Submit For Admin Approval
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold uppercase px-4 py-3 rounded-xs cursor-pointer font-mono"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reviews list */}
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-neutral-50 border border-neutral-200 p-5 rounded-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-black">{rev.customerName}</span>
                    {rev.isVerifiedPurchase && (
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>

                <p className="text-neutral-700 leading-relaxed pt-1">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 max-w-lg w-full p-6 rounded-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-display font-bold text-black uppercase text-base">
                REVORA Sizing Chart (Inches)
              </h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="text-neutral-500 hover:text-black cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              All REVORA streetwear cuts are engineered with a relaxed drop-shoulder profile. For a tailored fit, choose your standard size. For an ultra-oversized boxy look, size up one grade.
            </p>

            <table className="w-full text-xs font-mono text-neutral-700 border border-neutral-200 text-left">
              <thead className="bg-neutral-100 text-neutral-800">
                <tr>
                  <th className="p-2 border-b border-neutral-200">Size</th>
                  <th className="p-2 border-b border-neutral-200">Chest</th>
                  <th className="p-2 border-b border-neutral-200">Length</th>
                  <th className="p-2 border-b border-neutral-200">Shoulder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="p-2 font-bold text-black">S</td>
                  <td className="p-2">40" - 42"</td>
                  <td className="p-2">28"</td>
                  <td className="p-2">20"</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-black">M</td>
                  <td className="p-2">43" - 45"</td>
                  <td className="p-2">29"</td>
                  <td className="p-2">21"</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-black">L</td>
                  <td className="p-2">46" - 48"</td>
                  <td className="p-2">30"</td>
                  <td className="p-2">22"</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-black">XL</td>
                  <td className="p-2">49" - 51"</td>
                  <td className="p-2">31"</td>
                  <td className="p-2">23"</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-black">XXL</td>
                  <td className="p-2">52" - 54"</td>
                  <td className="p-2">32"</td>
                  <td className="p-2">24"</td>
                </tr>
              </tbody>
            </table>

            <button
              onClick={() => setShowSizeGuide(false)}
              className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
