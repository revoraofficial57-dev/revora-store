import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Design } from '../../types';
import { Layers, ArrowRight, Check, ShoppingBag } from 'lucide-react';

interface DesignExplorerProps {
  onSelectProduct: (product: Product) => void;
  initialDesignId?: string;
}

export const DesignExplorer: React.FC<DesignExplorerProps> = ({
  onSelectProduct,
  initialDesignId,
}) => {
  const { designs, products, formatPKR, addToCart } = useStore();
  const [selectedDesignId, setSelectedDesignId] = useState<string>(
    initialDesignId || (designs[0]?.id || '')
  );

  const activeDesign = designs.find((d) => d.id === selectedDesignId) || designs[0];

  // Get all active products linked to this design
  const linkedProducts = products.filter((p) => p.designId === activeDesign?.id && p.status === 'active');

  const [activeProductId, setActiveProductId] = useState<string>(
    linkedProducts[0]?.id || ''
  );

  // Sync if active design changes
  React.useEffect(() => {
    if (linkedProducts.length > 0 && !linkedProducts.some((p) => p.id === activeProductId)) {
      setActiveProductId(linkedProducts[0].id);
    }
  }, [selectedDesignId, linkedProducts, activeProductId]);

  const currentProduct = linkedProducts.find((p) => p.id === activeProductId) || linkedProducts[0];

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  React.useEffect(() => {
    if (currentProduct) {
      setSelectedSize(currentProduct.sizes[0] || 'M');
      setSelectedColor(currentProduct.colors[0] || 'Black');
    }
  }, [currentProduct?.id]);

  if (!activeDesign) {
    return null;
  }

  const currentVariant = currentProduct?.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const isAvailable = currentVariant ? currentVariant.stock > 0 : false;

  return (
    <div className="py-14 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-neutral-500 uppercase">
              <Layers className="w-3.5 h-3.5 text-black" />
              <span>REVORA DESIGN MATRIX ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black uppercase font-display mt-2 tracking-tight">
              One Design. Multiple Apparel Silhouettes.
            </h2>
            <p className="text-neutral-600 text-sm mt-1 max-w-2xl">
              Select an automotive design and choose which clothing type you prefer. Each silhouette features distinct fabric weights and dedicated pricing.
            </p>
          </div>

          {/* Design Selector Tabs */}
          <div className="flex flex-wrap gap-2">
            {designs.map((design) => (
              <button
                key={design.id}
                onClick={() => setSelectedDesignId(design.id)}
                className={`px-3 py-2 text-xs font-mono tracking-wider transition-colors cursor-pointer rounded-xs border ${
                  selectedDesignId === design.id
                    ? 'bg-black text-white border-black font-bold'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-300 hover:text-black hover:border-black'
                }`}
              >
                {design.code} · {design.name}
              </button>
            ))}
          </div>
        </div>

        {/* Design Overview & Cut Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Design Artwork & Description */}
          <div className="lg:col-span-4 bg-neutral-50 border border-neutral-200 p-6 rounded-xs space-y-5 shadow-xs">
            <div className="aspect-square w-full bg-neutral-100 rounded-xs overflow-hidden border border-neutral-200 relative">
              <img
                src={activeDesign.artworkImage}
                alt={activeDesign.name}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-black text-white px-2 py-0.5 text-[11px] font-mono">
                {activeDesign.code}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-black font-display">
                {activeDesign.name}
              </h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                {activeDesign.description}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-200 text-xs">
              <span className="text-neutral-500">Available Silhouettes: </span>
              <span className="text-black font-bold tabular-nums">
                {linkedProducts.length} Clothing Cuts Available
              </span>
            </div>
          </div>

          {/* Right Column: Silhouette Selector & Configurator */}
          <div className="lg:col-span-8 bg-white border border-neutral-200 p-6 rounded-xs space-y-6 shadow-xs">
            {/* Cut Picker Grid with Separate Prices */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3">
                Select Clothing Type ({linkedProducts.length} tailored cuts for this design)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {linkedProducts.map((prod) => {
                  const isSelected = prod.id === currentProduct?.id;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => setActiveProductId(prod.id)}
                      className={`p-3 text-left border rounded-xs transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-black border-black text-white shadow-xs'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-black hover:text-black'
                      }`}
                    >
                      <span className="text-xs font-bold font-display line-clamp-1">
                        {prod.clothingType}
                      </span>
                      <span className={`text-[11px] font-mono mt-2 tabular-nums font-semibold ${
                        isSelected ? 'text-neutral-200' : 'text-black'
                      }`}>
                        {formatPKR(prod.salePrice || prod.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Silhouette Showcase */}
            {currentProduct && (
              <div className="pt-6 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Product Preview Image */}
                <div className="aspect-4/3 bg-neutral-100 rounded-xs overflow-hidden border border-neutral-200">
                  <img
                    src={currentProduct.images[0]}
                    alt={currentProduct.name}
                    className="w-full h-full object-cover object-center"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Variant Configuration */}
                <div className="space-y-4">
                  <div>
                    <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                      {currentProduct.sku}
                    </div>
                    <h4 className="text-lg font-bold text-black font-display mt-0.5">
                      {currentProduct.name}
                    </h4>
                    <p className="text-lg font-extrabold text-black font-mono mt-1 tabular-nums">
                      {formatPKR(currentProduct.salePrice || currentProduct.price)}
                    </p>
                  </div>

                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    {currentProduct.description}
                  </p>

                  {/* Size Selector */}
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-1.5">
                      Size: <span className="text-black font-semibold">{selectedSize}</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {currentProduct.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`min-w-9 h-8 px-2 text-xs font-mono font-medium rounded-xs border transition-colors cursor-pointer ${
                            selectedSize === s
                              ? 'bg-black text-white border-black font-bold'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selector */}
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-1.5">
                      Color: <span className="text-black font-semibold">{selectedColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {currentProduct.colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          className={`px-2.5 h-7 text-xs font-mono rounded-xs border transition-colors cursor-pointer ${
                            selectedColor === c
                              ? 'bg-neutral-800 text-white border-neutral-800 font-bold'
                              : 'bg-white text-neutral-600 border-neutral-300 hover:border-black'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stock status indicator */}
                  <div className="text-[11px] font-mono text-neutral-600">
                    {isAvailable ? (
                      <span className="text-emerald-700 font-medium">
                        ✓ In Stock ({currentVariant?.stock} units ready to dispatch)
                      </span>
                    ) : (
                      <span className="text-neutral-500">Currently Sold Out in this variant</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (isAvailable) {
                          addToCart(currentProduct, selectedSize, selectedColor, 1);
                        }
                      }}
                      disabled={!isAvailable}
                      className={`flex-1 py-3 px-4 rounded-xs text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer font-display ${
                        isAvailable
                          ? 'bg-black hover:bg-neutral-800 text-white shadow-xs'
                          : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isAvailable ? 'ADD TO BAG' : 'OUT OF STOCK'}</span>
                    </button>

                    <button
                      onClick={() => onSelectProduct(currentProduct)}
                      className="py-3 px-4 border border-neutral-300 hover:border-black text-neutral-700 hover:text-black text-xs font-semibold rounded-xs transition-colors cursor-pointer"
                    >
                      Full Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
