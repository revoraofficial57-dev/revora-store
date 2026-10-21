import React from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Heart, Eye, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onExploreDesign?: (designId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onExploreDesign,
}) => {
  const { wishlist, toggleWishlist, setQuickViewProduct, formatPKR, designs } = useStore();
  const isWishlisted = wishlist.includes(product.id);

  const design = designs.find((d) => d.id === product.designId);
  const siblingCount = design ? design.productIds.length : 1;

  const displayPrice = product.salePrice || product.price;
  const hasDiscount = Boolean(product.salePrice && product.salePrice < product.price);

  return (
    <div className="group relative flex flex-col bg-white border border-neutral-200 rounded-sm overflow-hidden hover:border-black hover:shadow-md transition-all duration-200">
      {/* Product Image Frame */}
      <div
        onClick={() => onSelectProduct(product)}
        className="relative aspect-4/3 w-full bg-neutral-100 overflow-hidden cursor-pointer"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="pointer-events-auto bg-white/95 hover:bg-white text-black p-2 rounded-xs border border-neutral-300 shadow-sm transition-colors text-xs flex items-center gap-1.5 cursor-pointer font-mono font-medium backdrop-blur-xs"
            title="Quick view"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick View</span>
          </button>
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-xs transition-colors cursor-pointer shadow-xs ${
            isWishlisted
              ? 'bg-black text-white'
              : 'bg-white/90 text-neutral-800 hover:bg-white hover:text-black border border-neutral-200'
          }`}
          title="Save to wishlist"
          aria-label="Save to wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quiet unboxed text tag (NO PILL BADGES) */}
        {product.isWinterCollection && (
          <div className="absolute top-2.5 left-2.5 text-[10px] font-mono font-bold tracking-wider text-black bg-white/90 px-2 py-0.5 border border-neutral-300 shadow-xs">
            WINTER SPEC
          </div>
        )}
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
        <div>
          {/* Metadata line: Unboxed text separated by · */}
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-neutral-500 uppercase">
            <span>{product.clothingType}</span>
            <span aria-hidden="true">·</span>
            <span>{product.sku}</span>
          </div>

          {/* Product Name */}
          <h3
            onClick={() => onSelectProduct(product)}
            className="mt-1 text-sm font-bold text-neutral-900 tracking-tight hover:text-neutral-600 transition-colors cursor-pointer line-clamp-1 font-display"
          >
            {product.name}
          </h3>

          {/* Design family relation */}
          {design && siblingCount > 1 && (
            <div className="mt-1 text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
              <span>Motif: {design.name}</span>
              <span aria-hidden="true">·</span>
              <span className="text-neutral-700 font-semibold">{siblingCount} cuts</span>
            </div>
          )}
        </div>

        {/* Price and Action Baseline */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-black font-mono tabular-nums">
              {formatPKR(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through font-mono tabular-nums">
                {formatPKR(product.price)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectProduct(product)}
            className="text-xs font-semibold text-black hover:text-neutral-600 flex items-center gap-1 cursor-pointer transition-colors font-mono"
          >
            <span>View Piece</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
