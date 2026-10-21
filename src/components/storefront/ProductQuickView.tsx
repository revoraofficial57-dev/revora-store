import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';

interface ProductQuickViewProps {
  onGoToDetail: (product: Product) => void;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({ onGoToDetail }) => {
  const { quickViewProduct, setQuickViewProduct, addToCart, formatPKR } = useStore();

  const [selectedSize, setSelectedSize] = useState(quickViewProduct?.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(quickViewProduct?.colors[0] || 'Black');
  const [quantity, setQuantity] = useState(1);

  React.useEffect(() => {
    if (quickViewProduct) {
      setSelectedSize(quickViewProduct.sizes[0] || 'M');
      setSelectedColor(quickViewProduct.colors[0] || 'Black');
      setQuantity(1);
    }
  }, [quickViewProduct?.id]);

  if (!quickViewProduct) return null;

  const currentVariant = quickViewProduct.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const availableStock = currentVariant ? currentVariant.stock : 0;
  const isAvailable = availableStock > 0;
  const price = currentVariant?.priceOverride || quickViewProduct.salePrice || quickViewProduct.price;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-300 max-w-2xl w-full p-6 rounded-xs shadow-2xl relative">
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 text-neutral-400 hover:text-black cursor-pointer font-bold"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="aspect-4/3 bg-neutral-100 rounded-xs overflow-hidden border border-neutral-200">
            <img
              src={quickViewProduct.images[0]}
              alt={quickViewProduct.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="font-mono text-neutral-500 uppercase tracking-wider text-[11px]">
                {quickViewProduct.clothingType} · {quickViewProduct.sku}
              </div>
              <h3 className="text-lg font-bold text-black uppercase font-display mt-0.5">
                {quickViewProduct.name}
              </h3>
              <div className="mt-1 font-mono font-bold text-base text-black tabular-nums">
                {formatPKR(price)}
              </div>
            </div>

            {/* Size Picker */}
            <div>
              <label className="block text-[11px] font-mono text-neutral-600 uppercase mb-1">
                Size: <strong className="text-black">{selectedSize}</strong>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickViewProduct.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-8 h-7 px-2 font-mono text-xs rounded-xs border cursor-pointer transition-colors ${
                      selectedSize === s
                        ? 'bg-black text-white border-black font-bold shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-[11px] font-mono text-neutral-600 uppercase mb-1">
                Color: <strong className="text-black">{selectedColor}</strong>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickViewProduct.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-2.5 h-7 font-mono text-xs rounded-xs border cursor-pointer transition-colors ${
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

            <div className="font-mono text-[11px]">
              {isAvailable ? (
                <span className="text-emerald-700 font-semibold">✓ In Stock ({availableStock} units ready)</span>
              ) : (
                <span className="text-red-600 font-bold">Sold Out in this variant</span>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                disabled={!isAvailable}
                onClick={() => {
                  addToCart(quickViewProduct, selectedSize, selectedColor, quantity);
                  setQuickViewProduct(null);
                }}
                className={`flex-1 py-3 px-4 rounded-xs text-xs font-bold uppercase tracking-wider font-display flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  isAvailable
                    ? 'bg-black hover:bg-neutral-800 text-white shadow-xs'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{isAvailable ? 'ADD TO BAG' : 'OUT OF STOCK'}</span>
              </button>

              <button
                onClick={() => {
                  const prod = quickViewProduct;
                  setQuickViewProduct(null);
                  onGoToDetail(prod);
                }}
                className="py-3 px-3 border border-neutral-300 text-neutral-700 hover:text-black hover:border-black rounded-xs text-xs font-semibold cursor-pointer"
                title="Full Page"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
