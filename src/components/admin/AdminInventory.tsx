import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { saveProduct } from '../../services/storage';
import { Product } from '../../types';
import { AlertTriangle, Package, Check, ArrowUpDown } from 'lucide-react';

export const AdminInventory: React.FC = () => {
  const { products, refreshData, showToast } = useStore();
  const [threshold, setThreshold] = useState<number>(5);
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');

  const handleStockUpdate = (productId: string, variantId: string, newStock: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const variant = prod.variants.find((v) => v.id === variantId);
    if (!variant) return;

    variant.stock = Math.max(0, newStock);
    variant.available = variant.stock > 0;

    saveProduct(prod);
    refreshData();
    showToast(`Updated stock for ${variant.sku} to ${variant.stock}`);
  };

  // Flatten all variants
  const allVariants: Array<{
    product: Product;
    variantId: string;
    sku: string;
    size: string;
    color: string;
    stock: number;
    available: boolean;
  }> = [];

  for (const prod of products) {
    for (const v of prod.variants) {
      allVariants.push({
        product: prod,
        variantId: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        stock: v.stock,
        available: v.available,
      });
    }
  }

  const filteredVariants = allVariants.filter((item) => {
    if (filterStock === 'out') return item.stock === 0;
    if (filterStock === 'low') return item.stock > 0 && item.stock <= threshold;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white uppercase font-display">
            Variant-Level Inventory Grid
          </h2>
          <p className="text-xs font-mono text-neutral-400">
            {allVariants.length} total size/color SKU combinations tracked
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value as any)}
            className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-xs text-neutral-200 font-mono"
          >
            <option value="all">All Variants</option>
            <option value="low">Low Stock (≤ {threshold})</option>
            <option value="out">Sold Out Only</option>
          </select>
        </div>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xs overflow-x-auto">
        <table className="w-full text-xs font-mono text-left text-neutral-300">
          <thead className="bg-neutral-900 text-neutral-400 uppercase text-[11px] border-b border-neutral-800">
            <tr>
              <th className="p-3">Product Name</th>
              <th className="p-3">Apparel Type</th>
              <th className="p-3">Variant SKU</th>
              <th className="p-3">Size</th>
              <th className="p-3">Colorway</th>
              <th className="p-3">Stock Units</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Quick Stock Adjustment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {filteredVariants.map((item) => (
              <tr key={item.sku} className="hover:bg-neutral-900/40">
                <td className="p-3 font-semibold text-white font-display">
                  {item.product.name}
                </td>
                <td className="p-3 text-neutral-400">{item.product.clothingType}</td>
                <td className="p-3 font-bold text-neutral-300">{item.sku}</td>
                <td className="p-3 text-white">{item.size}</td>
                <td className="p-3 text-neutral-400">{item.color}</td>
                <td className="p-3 font-bold tabular-nums">
                  <span
                    className={
                      item.stock === 0
                        ? 'text-red-400'
                        : item.stock <= threshold
                        ? 'text-amber-400'
                        : 'text-white'
                    }
                  >
                    {item.stock}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-xs border ${
                      item.stock === 0
                        ? 'bg-red-950 text-red-400 border-red-800'
                        : item.stock <= threshold
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    }`}
                  >
                    {item.stock === 0 ? 'SOLD OUT' : item.stock <= threshold ? 'LOW STOCK' : 'IN STOCK'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleStockUpdate(item.product.id, item.variantId, item.stock - 1)}
                      className="w-7 h-7 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-xs flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleStockUpdate(item.product.id, item.variantId, item.stock + 5)}
                      className="px-2 h-7 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-xs text-[10px] flex items-center justify-center cursor-pointer font-bold"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleStockUpdate(item.product.id, item.variantId, item.stock + 20)}
                      className="px-2 h-7 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-xs text-[10px] flex items-center justify-center cursor-pointer font-bold"
                    >
                      +20
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
