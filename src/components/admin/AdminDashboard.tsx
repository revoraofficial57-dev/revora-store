import React from 'react';
import { useStore } from '../../context/StoreContext';
import { useAdmin, AdminTab } from '../../context/AdminContext';
import { getAllOrders } from '../../services/storage';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { products, designs, formatPKR } = useStore();
  const { setActiveTab } = useAdmin();
  const orders = getAllOrders();

  // Metrics calculation
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Refunded')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.orderStatus === 'Pending').length;
  const processingOrders = orders.filter((o) => o.orderStatus === 'Processing' || o.orderStatus === 'Confirmed' || o.orderStatus === 'Packed').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === 'Cancelled' || o.orderStatus === 'Refunded').length;

  // Variants stock calculation
  let lowStockVariantsCount = 0;
  let outOfStockVariantsCount = 0;
  let totalVariantsCount = 0;

  for (const prod of products) {
    for (const v of prod.variants) {
      totalVariantsCount++;
      if (v.stock <= 0) {
        outOfStockVariantsCount++;
      } else if (v.stock <= 5) {
        lowStockVariantsCount++;
      }
    }
  }

  // Pending payment proofs
  const pendingProofCount = orders.filter(
    (o) => o.paymentProof && o.paymentProof.status === 'Pending Verification'
  ).length;

  // Category revenue breakdown
  const categorySalesMap: Record<string, number> = {};
  for (const ord of orders) {
    if (ord.orderStatus !== 'Cancelled') {
      for (const item of ord.items) {
        categorySalesMap[item.clothingType] = (categorySalesMap[item.clothingType] || 0) + item.price * item.quantity;
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome & KPI row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
            REVORA OPERATIONS COMMAND // REAL-TIME TELEMETRY
          </div>
          <h1 className="text-2xl font-black text-white uppercase font-display mt-1">
            Store Performance & Orders
          </h1>
        </div>

        {pendingProofCount > 0 && (
          <button
            onClick={() => setActiveTab('orders')}
            className="bg-amber-950/80 border border-amber-800 text-amber-300 px-4 py-2 text-xs font-mono rounded-xs flex items-center gap-2 cursor-pointer hover:bg-amber-900 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{pendingProofCount} Payment Proof(s) Awaiting Verification</span>
          </button>
        )}
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>TOTAL REVENUE</span>
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-black font-mono text-white tabular-nums">
            {formatPKR(totalRevenue)}
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">
            From {orders.length} orders across Pakistan
          </p>
        </div>

        {/* Orders in queue */}
        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>ACTIVE ORDERS</span>
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-black font-mono text-white tabular-nums">
            {pendingOrders + processingOrders}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-2">
            <span className="text-amber-400">{pendingOrders} Pending</span>
            <span>·</span>
            <span className="text-neutral-300">{processingOrders} In Progress</span>
          </div>
        </div>

        {/* Catalog Silhouettes */}
        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>APPAREL PRODUCTS</span>
            <Package className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-black font-mono text-white tabular-nums">
            {products.length}
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">
            Across {designs.length} designs (Up to 12 cuts/design)
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>INVENTORY HEALTH</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 tabular-nums">
            {lowStockVariantsCount + outOfStockVariantsCount}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-2">
            <span>{lowStockVariantsCount} Low Stock</span>
            <span>·</span>
            <span className="text-red-400">{outOfStockVariantsCount} Sold Out</span>
          </div>
        </div>
      </div>

      {/* Orders Status Matrix & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-8 bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h2 className="text-sm font-bold text-white uppercase font-display tracking-wider">
              Recent Dispatches & Orders
            </h2>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>View All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-900 overflow-x-auto">
            {orders.slice(0, 5).map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between gap-4 text-xs font-mono">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{ord.orderNumber}</span>
                    <span className="text-neutral-400">({ord.customerName})</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {ord.shippingAddress.city} · {ord.items.length} item(s) · {ord.paymentMethod}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-white tabular-nums">
                    {formatPKR(ord.total)}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-xs border ${
                      ord.orderStatus === 'Delivered'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : ord.orderStatus === 'Cancelled'
                        ? 'bg-red-950 text-red-400 border-red-800'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {ord.orderStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Apparel Silhouette Sales Breakdown */}
        <div className="lg:col-span-4 bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-4">
          <h2 className="text-sm font-bold text-white uppercase font-display tracking-wider pb-3 border-b border-neutral-800">
            Apparel Type Revenue Share
          </h2>

          <div className="space-y-3 font-mono text-xs">
            {Object.keys(categorySalesMap).length === 0 ? (
              <p className="text-neutral-500 text-xs">Awaiting first customer orders.</p>
            ) : (
              Object.entries(categorySalesMap).map(([type, amount]) => {
                const pct = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-neutral-300">
                      <span>{type}</span>
                      <span className="tabular-nums font-bold text-white">{formatPKR(amount)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-white h-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
