import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { getAllCoupons, saveCoupon, deleteCoupon } from '../../services/storage';
import { Coupon } from '../../types';
import { Plus, Trash2, Tag, Check, X } from 'lucide-react';

export const AdminDiscounts: React.FC = () => {
  const { formatPKR, refreshData, showToast } = useStore();
  const [coupons, setCoupons] = useState<Coupon[]>(() => getAllCoupons());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState<number>(3000);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(1500);
  const [usageLimit, setUsageLimit] = useState<number>(200);

  const reload = () => setCoupons(getAllCoupons());

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCoupon: Coupon = {
      id: 'cpn-' + Date.now(),
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrder ? Number(minOrder) : undefined,
      maxDiscountAmount: maxDiscount ? Number(maxDiscount) : undefined,
      usageLimit: Number(usageLimit),
      usedCount: 0,
      startDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    };

    saveCoupon(newCoupon);
    reload();
    setIsModalOpen(false);
    setCode('');
    showToast(`Created promo code ${newCoupon.code}`);
  };

  const handleDelete = (id: string) => {
    deleteCoupon(id);
    reload();
    showToast('Promo code deleted');
  };

  const handleToggle = (cpn: Coupon) => {
    saveCoupon({ ...cpn, isActive: !cpn.isActive });
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white uppercase font-display">
            Promo Codes & Discounts
          </h2>
          <p className="text-xs font-mono text-neutral-400">
            {coupons.length} promotional rules configured
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-bold uppercase rounded-xs flex items-center gap-1.5 font-display cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Promo Code</span>
        </button>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xs overflow-x-auto">
        <table className="w-full text-xs font-mono text-left text-neutral-300">
          <thead className="bg-neutral-900 text-neutral-400 uppercase text-[11px] border-b border-neutral-800">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Discount Type & Value</th>
              <th className="p-3">Min Order</th>
              <th className="p-3">Cap</th>
              <th className="p-3">Usage</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-900/40">
                <td className="p-3 font-bold text-white">{c.code}</td>
                <td className="p-3 text-white">
                  {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `Rs. ${c.discountValue} OFF`}
                </td>
                <td className="p-3 text-neutral-400">
                  {c.minOrderAmount ? formatPKR(c.minOrderAmount) : 'None'}
                </td>
                <td className="p-3 text-neutral-400">
                  {c.maxDiscountAmount ? formatPKR(c.maxDiscountAmount) : 'No cap'}
                </td>
                <td className="p-3 tabular-nums text-neutral-300">
                  {c.usedCount} / {c.usageLimit || '∞'}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleToggle(c)}
                    className={`px-2 py-0.5 text-[10px] rounded-xs border cursor-pointer ${
                      c.isActive
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                    }`}
                  >
                    {c.isActive ? 'ACTIVE' : 'DISABLED'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 text-neutral-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 max-w-md w-full p-6 rounded-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-display font-bold text-white uppercase text-base">
                Create Promo Code
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-neutral-400 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TOUGE20"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (PKR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1">Min Order (PKR)</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Max Cap (PKR)</label>
                  <input
                    type="number"
                    value={maxDiscount || ''}
                    onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Optional"
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-bold uppercase rounded-xs"
                >
                  Save Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
