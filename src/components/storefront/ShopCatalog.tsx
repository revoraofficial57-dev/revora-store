import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ClothingType } from '../../types';
import { ProductCard } from './ProductCard';
import { Search, Filter, RotateCcw, SlidersHorizontal } from 'lucide-react';

interface ShopCatalogProps {
  onSelectProduct: (p: Product) => void;
  initialCategory?: string;
  initialFilterWinter?: boolean;
}

export const ShopCatalog: React.FC<ShopCatalogProps> = ({
  onSelectProduct,
  initialCategory,
  initialFilterWinter = false,
}) => {
  const { products, designs, categories, formatPKR } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedDesignId, setSelectedDesignId] = useState<string>('all');
  const [selectedClothingType, setSelectedClothingType] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [filterInStockOnly, setFilterInStockOnly] = useState<boolean>(false);
  const [filterWinterOnly, setFilterWinterOnly] = useState<boolean>(initialFilterWinter);
  const [filterNewArrivals, setFilterNewArrivals] = useState<boolean>(false);
  const [filterBestSellers, setFilterBestSellers] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'bestselling' | 'price-asc' | 'price-desc'>('newest');
  const [maxPrice, setMaxPrice] = useState<number>(15000);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Clothing types available in catalogue
  const allClothingTypes: ClothingType[] = [
    'Regular T-shirt',
    'Oversized T-shirt',
    'Full-sleeve shirt',
    'Tank top',
    'Hoodie',
    'Sweatshirt',
    'Sweater',
    'Jacket',
    'Winter shirt',
    'Kids clothing',
  ];

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDesignId('all');
    setSelectedClothingType('all');
    setSelectedSize('all');
    setSelectedColor('all');
    setFilterInStockOnly(false);
    setFilterWinterOnly(false);
    setFilterNewArrivals(false);
    setFilterBestSellers(false);
    setSortBy('newest');
    setMaxPrice(15000);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 'active') return false;

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesign = p.designName.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        const matchesType = p.clothingType.toLowerCase().includes(query);
        const matchesTags = (p.tags || []).some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesDesign && !matchesSku && !matchesCategory && !matchesType && !matchesTags) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'all') {
        if (p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Design
      if (selectedDesignId !== 'all') {
        if (p.designId !== selectedDesignId) {
          return false;
        }
      }

      // Clothing type
      if (selectedClothingType !== 'all') {
        if (p.clothingType.toLowerCase() !== selectedClothingType.toLowerCase()) {
          return false;
        }
      }

      // Winter only
      if (filterWinterOnly && !p.isWinterCollection) {
        return false;
      }

      // New arrivals
      if (filterNewArrivals && !p.isNewArrival) {
        return false;
      }

      // Best sellers
      if (filterBestSellers && !p.isBestSeller) {
        return false;
      }

      // Size match
      if (selectedSize !== 'all') {
        if (!p.sizes.includes(selectedSize)) {
          return false;
        }
      }

      // Price limit
      const price = p.salePrice || p.price;
      if (price > maxPrice) {
        return false;
      }

      // In stock
      if (filterInStockOnly) {
        const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
        if (totalStock <= 0) return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.salePrice || a.price;
      const priceB = b.salePrice || b.price;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'bestselling') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedDesignId,
    selectedClothingType,
    selectedSize,
    selectedColor,
    filterWinterOnly,
    filterNewArrivals,
    filterBestSellers,
    filterInStockOnly,
    maxPrice,
    sortBy,
  ]);

  return (
    <div className="py-8 bg-white min-h-screen text-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Catalog Banner / Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <div className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
              REVORA CATALOGUE // 2026 RACE COLLECTION
            </div>
            <h1 className="text-3xl font-black text-black uppercase font-display tracking-tight mt-1">
              Performance Streetwear
            </h1>
            <p className="text-xs text-neutral-600 mt-1 max-w-lg">
              Precision automotive garments constructed with heavyweight combed cottons, racing telemetry embroidery, and circuit topography graphics.
            </p>
          </div>

          {/* Quick Search & Sort */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cuts, SKU, designs..."
                className="w-full bg-neutral-50 border border-neutral-300 text-xs pl-8 pr-3 py-2.5 rounded-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black font-mono"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-50 border border-neutral-300 text-xs px-3 py-2.5 rounded-xs text-neutral-800 font-mono focus:outline-none focus:border-black cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="bestselling">Sort: Best Sellers</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>

            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="md:hidden bg-neutral-100 border border-neutral-300 p-2.5 rounded-xs text-neutral-800 cursor-pointer"
              aria-label="Filter"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Catalog View: Filters Sidebar + Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Filters Sidebar (Left 3 cols) */}
          <div
            className={`md:col-span-3 space-y-6 bg-neutral-50 border border-neutral-200 p-5 rounded-xs shadow-xs ${
              isMobileFiltersOpen ? 'block' : 'hidden md:block'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="text-xs font-mono uppercase tracking-wider text-black font-bold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </span>
              <button
                onClick={resetFilters}
                className="text-[11px] font-mono text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>

            {/* Quick Collections */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 font-bold">
                Collections
              </label>
              <div className="space-y-1.5 text-xs font-mono">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-black">
                  <input
                    type="checkbox"
                    checked={filterWinterOnly}
                    onChange={(e) => setFilterWinterOnly(e.target.checked)}
                    className="accent-black rounded-xs"
                  />
                  <span>Winter Performance Spec</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-black">
                  <input
                    type="checkbox"
                    checked={filterNewArrivals}
                    onChange={(e) => setFilterNewArrivals(e.target.checked)}
                    className="accent-black rounded-xs"
                  />
                  <span>New Arrivals</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-black">
                  <input
                    type="checkbox"
                    checked={filterBestSellers}
                    onChange={(e) => setFilterBestSellers(e.target.checked)}
                    className="accent-black rounded-xs"
                  />
                  <span>Best Sellers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-700 hover:text-black">
                  <input
                    type="checkbox"
                    checked={filterInStockOnly}
                    onChange={(e) => setFilterInStockOnly(e.target.checked)}
                    className="accent-black rounded-xs"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 font-bold">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-xs px-2.5 py-2 rounded-xs text-neutral-800 font-mono cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clothing Type Filter */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 font-bold">
                Clothing Type
              </label>
              <select
                value={selectedClothingType}
                onChange={(e) => setSelectedClothingType(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-xs px-2.5 py-2 rounded-xs text-neutral-800 font-mono cursor-pointer"
              >
                <option value="all">All Clothing Types</option>
                {allClothingTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Design Family Filter */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 font-bold">
                Design Matrix
              </label>
              <select
                value={selectedDesignId}
                onChange={(e) => setSelectedDesignId(e.target.value)}
                className="w-full bg-white border border-neutral-300 text-xs px-2.5 py-2 rounded-xs text-neutral-800 font-mono cursor-pointer"
              >
                <option value="all">All Designs</option>
                {designs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} · {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600 font-bold">
                Size
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-8 h-7 px-2 text-[11px] font-mono rounded-xs border transition-colors cursor-pointer ${
                      selectedSize === s
                        ? 'bg-black text-white border-black font-bold shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-600 font-bold">
                <span>Max Price</span>
                <span className="text-black font-bold">{formatPKR(maxPrice)}</span>
              </div>
              <input
                type="range"
                min={1500}
                max={15000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
            </div>
          </div>

          {/* Product Grid (Right 9 cols) */}
          <div className="md:col-span-9 space-y-6">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-600">
              <span>Showing <strong className="text-black">{filteredProducts.length}</strong> pieces</span>
              {(selectedCategory !== 'all' ||
                selectedDesignId !== 'all' ||
                selectedClothingType !== 'all' ||
                searchQuery ||
                filterWinterOnly) && (
                <button
                  onClick={resetFilters}
                  className="text-black font-bold hover:underline cursor-pointer"
                >
                  Clear active filters
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-neutral-50 border border-neutral-200 rounded-xs space-y-3 shadow-xs">
                <p className="text-sm font-semibold text-neutral-800">
                  No streetwear garments match your selected filters.
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Try adjusting your search terms, clearing sizes, or resetting the price slider.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-3 bg-black hover:bg-neutral-800 text-white px-5 py-2.5 text-xs font-bold uppercase rounded-xs cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelectProduct={onSelectProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
