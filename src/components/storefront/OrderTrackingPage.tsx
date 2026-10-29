import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { trackOrderByReference } from '../../services/storage';
import { Order, OrderStatus } from '../../types';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';

interface OrderTrackingPageProps {
  initialOrderNumber?: string;
  onExploreProducts: () => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  initialOrderNumber = '',
  onExploreProducts,
}) => {
  const { formatPKR } = useStore();
  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber);
  const [contactInput, setContactInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setHasSearched(true);

    if (!orderNumberInput.trim() && !contactInput.trim()) {
      setErrorMessage('Please enter either your Order Number OR your Phone Number / Email Address.');
      setSearchedOrder(null);
      return;
    }

    const found = trackOrderByReference(orderNumberInput.trim(), contactInput.trim());
    if (!found) {
      setErrorMessage(
        'No matching order found for the provided information. Please check your order details or try entering your phone number/email.'
      );
      setSearchedOrder(null);
    } else {
      setSearchedOrder(found);
    }
  };

  const statusSteps: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
  ];

  const currentStepIndex = searchedOrder
    ? statusSteps.indexOf(searchedOrder.orderStatus as OrderStatus)
    : -1;

  const isCancelled = searchedOrder?.orderStatus === 'Cancelled' || searchedOrder?.orderStatus === 'Refunded';

  return (
    <div className="py-12 bg-white min-h-screen text-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
            REVORA DISPATCH TELEMETRY // REAL-TIME TRACKING
          </div>
          <h1 className="text-3xl font-black text-black uppercase font-display tracking-tight">
            Track Your Order
          </h1>
          <p className="text-xs text-neutral-600 max-w-md mx-auto">
            Verify shipment milestones, courier dispatch status, and delivery confirmation without logging in.
          </p>
        </div>

        {/* Tracking Search Form */}
        <form
          onSubmit={handleTrack}
          className="bg-neutral-50 border border-neutral-200 p-6 rounded-xs shadow-xs space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
                Order Number (Optional if Phone/Email provided)
              </label>
              <input
                type="text"
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value.toUpperCase())}
                placeholder="e.g. REV-8921-94"
                className="w-full bg-white border border-neutral-300 text-black text-xs px-3.5 py-2.5 rounded-xs uppercase font-mono focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
                Phone Number or Email (Optional if Order # provided)
              </label>
              <input
                type="text"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                placeholder="e.g. 0300 1234567 or email"
                className="w-full bg-white border border-neutral-300 text-black text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black font-mono"
              />
            </div>
          </div>
          <p className="text-[11px] font-mono text-neutral-500">
            * Provide <strong>either</strong> your Order Number or your registered Phone/Email (both are not required).
          </p>

          <button
            type="submit"
            className="w-full bg-black hover:bg-neutral-800 text-white py-3 px-4 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-display transition-colors shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>TRACK SHIPMENT</span>
          </button>
        </form>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Order Details & Timeline when found */}
        {searchedOrder && (
          <div className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-xs space-y-8 shadow-xs">
            {/* Top Order Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
              <div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase">
                  ACTIVE SHIPMENT
                </span>
                <h2 className="text-xl font-black text-black font-mono tracking-tight">
                  {searchedOrder.orderNumber}
                </h2>
                <div className="text-xs text-neutral-600 mt-1 flex items-center gap-2">
                  <span>Placed: {new Date(searchedOrder.createdAt).toLocaleString()}</span>
                  <span>·</span>
                  <span>Destination: {searchedOrder.shippingAddress.city}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-xs font-mono font-bold tracking-wider rounded-xs border ${
                    isCancelled
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : searchedOrder.orderStatus === 'Delivered'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-neutral-100 text-black border-neutral-300'
                  }`}
                >
                  {searchedOrder.orderStatus.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-neutral-600">
                  Payment: <strong className="text-black">{searchedOrder.paymentMethod} ({searchedOrder.paymentStatus})</strong>
                </span>
              </div>
            </div>

            {/* Visual Timeline Bar */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-600 font-bold">
                Shipment Milestones
              </h3>

              {isCancelled ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xs text-xs text-red-800 font-mono">
                  This order has been marked as {searchedOrder.orderStatus}.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
                  {statusSteps.map((step, idx) => {
                    const isPassed = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;
                    return (
                      <div
                        key={step}
                        className={`p-3 border rounded-xs flex flex-col justify-between transition-colors ${
                          isCurrent
                            ? 'bg-black text-white border-black shadow-xs'
                            : isPassed
                            ? 'bg-neutral-100 border-neutral-300 text-neutral-900 font-semibold'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                          <span>0{idx + 1}</span>
                          {isPassed && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        </div>
                        <span className="text-xs font-bold font-display uppercase tracking-tight">
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status History Logs */}
            <div className="space-y-3 pt-6 border-t border-neutral-200">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-600 font-bold">
                Status Event Log
              </h3>
              <div className="space-y-2 font-mono text-xs divide-y divide-neutral-100">
                {searchedOrder.statusHistory.map((item, idx) => (
                  <div key={idx} className="pt-2 flex items-start justify-between gap-4">
                    <div>
                      <span className="text-black font-semibold">[{item.status}]</span>{' '}
                      <span className="text-neutral-700">{item.note}</span>
                    </div>
                    <span className="text-neutral-500 text-[11px] shrink-0">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items & Breakdown */}
            <div className="space-y-4 pt-6 border-t border-neutral-200">
              <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-600 font-bold">
                Parcel Contents
              </h3>
              <div className="divide-y divide-neutral-100">
                {searchedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-12 h-14 object-cover bg-neutral-100 border border-neutral-200 rounded-xs"
                      />
                      <div>
                        <div className="font-semibold text-black font-display">
                          {item.productName}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-500">
                          {item.clothingType} · Size {item.size} · Color {item.color} · Qty {item.quantity}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-black tabular-nums">
                      {formatPKR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xs space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subtotal:</span>
                  <span className="text-black font-semibold tabular-nums">{formatPKR(searchedOrder.subtotal)}</span>
                </div>
                {searchedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-semibold tabular-nums">-{formatPKR(searchedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-600">Delivery Charges ({searchedOrder.shippingAddress.city}):</span>
                  <span className="text-black font-semibold tabular-nums">
                    {searchedOrder.deliveryFee === 0 ? 'FREE' : formatPKR(searchedOrder.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold text-black font-display">
                  <span>Total Order Value ({searchedOrder.paymentMethod}):</span>
                  <span className="font-mono tabular-nums">{formatPKR(searchedOrder.total)}</span>
                </div>

                {searchedOrder.selectedBankAccountName && (
                  <div className="flex justify-between text-neutral-600 pt-1">
                    <span>Target Bank Account:</span>
                    <span className="text-black font-semibold">{searchedOrder.selectedBankAccountName}</span>
                  </div>
                )}

                {searchedOrder.isPartialPayment && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xs space-y-1.5 text-amber-950">
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>Advance Required ({searchedOrder.advancePercentage}%):</span>
                      <span className="font-mono">{formatPKR(searchedOrder.advanceAmount)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-700">
                      <span>Amount Received / Verified:</span>
                      <span className="font-mono font-bold text-emerald-700">{formatPKR(searchedOrder.amountReceived)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-amber-200">
                      <span>Outstanding Balance:</span>
                      <span className="font-mono">{formatPKR(searchedOrder.remainingBalance)}</span>
                    </div>
                    <div className="text-[11px] text-amber-900 pt-0.5">
                      <strong>Payment Terms:</strong> {searchedOrder.remainingBalanceDueWhen || 'Payable in cash upon doorstep delivery'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
