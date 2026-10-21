import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Trash2, ArrowRight, Tag, AlertTriangle, Truck } from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  onExploreProducts: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  onExploreProducts,
}) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    cartTotal,
    deliveryFee,
    isFreeDelivery,
    appliedCouponCode,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    formatPKR,
    settings,
    incompatiblePaymentWarning,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput.trim());
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError(null);
      setCouponInput('');
    }
  };

  const amountToFreeShipping = Math.max(0, settings.freeShippingThreshold - cartSubtotal);
  const freeShippingProgress = Math.min(100, Math.round((cartSubtotal / settings.freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-neutral-200 text-neutral-900 flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-black uppercase tracking-wider font-display">
                Shopping Bag
              </h2>
              <span className="text-xs font-mono text-neutral-500">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-neutral-500 hover:text-black p-2 cursor-pointer transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Meter */}
          <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-xs">
            <div className="flex items-center justify-between text-neutral-700 font-mono text-[11px] mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-black" />
                {amountToFreeShipping === 0 ? (
                  <strong className="text-black">FREE EXPRESS NATIONWIDE SHIPPING UNLOCKED!</strong>
                ) : (
                  <span>
                    Add <strong className="text-black">{formatPKR(amountToFreeShipping)}</strong> for Free Shipping
                  </span>
                )}
              </span>
              <span className="font-bold">{freeShippingProgress}%</span>
            </div>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-black h-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-neutral-100 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-12 h-12 border border-neutral-200 mx-auto flex items-center justify-center text-neutral-400 font-mono">
                  0
                </div>
                <p className="text-sm text-neutral-600 font-medium">Your shopping bag is empty.</p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onExploreProducts();
                  }}
                  className="bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xs cursor-pointer"
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-4 first:pt-0 flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-24 bg-neutral-100 rounded-xs overflow-hidden shrink-0 border border-neutral-200">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between text-xs">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-black line-clamp-1 font-display">
                          {item.productName}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] font-mono text-neutral-500 mt-1 flex items-center gap-2">
                        <span>{item.clothingType}</span>
                        <span>·</span>
                        <span>Size: <strong className="text-black">{item.size}</strong></span>
                        <span>·</span>
                        <span>{item.color}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-neutral-300 rounded-xs bg-white">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-neutral-500 hover:text-black cursor-pointer font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 py-1 font-mono font-bold text-black tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-neutral-500 hover:text-black cursor-pointer font-bold"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono font-bold text-black tabular-nums">
                        {formatPKR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Incompatible payment warning if any */}
          {incompatiblePaymentWarning && cart.length > 0 && (
            <div className="px-6 py-2.5 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{incompatiblePaymentWarning}</span>
            </div>
          )}

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-neutral-200 bg-neutral-50 space-y-4">
              {/* Promo code form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="PROMO CODE (e.g. REVORA10)"
                    className="w-full bg-white border border-neutral-300 text-xs pl-8 pr-3 py-2 rounded-xs text-black placeholder-neutral-400 uppercase font-mono focus:outline-none focus:border-black"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-xs uppercase tracking-wider font-mono cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {couponError && (
                <p className="text-[11px] text-red-600 font-mono">{couponError}</p>
              )}

              {appliedCouponCode && (
                <div className="flex items-center justify-between text-xs font-mono text-emerald-800 bg-emerald-50 p-2 border border-emerald-200 rounded-xs">
                  <span>Code {appliedCouponCode} applied (-{formatPKR(couponDiscount)})</span>
                  <button
                    onClick={removeCoupon}
                    className="text-neutral-600 hover:text-black underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Subtotal & Delivery Breakdowns */}
              <div className="space-y-1.5 text-xs font-mono text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-black font-semibold tabular-nums">{formatPKR(cartSubtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="tabular-nums font-semibold">-{formatPKR(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="text-black font-semibold tabular-nums">
                    {isFreeDelivery ? 'FREE' : formatPKR(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-black pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span className="tabular-nums font-mono">{formatPKR(cartTotal)}</span>
                </div>
              </div>

              {/* Primary Checkout Button */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full bg-black hover:bg-neutral-800 text-white py-3.5 px-4 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-display shadow-md transition-colors"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
