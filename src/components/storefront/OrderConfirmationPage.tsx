import React, { useState } from 'react';
import { Order } from '../../types';
import { useStore } from '../../context/StoreContext';
import {
  CheckCircle2,
  Copy,
  Truck,
  ArrowRight,
  MessageCircle,
  Download,
  Printer,
  Eye,
  X,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface OrderConfirmationPageProps {
  order: Order;
  onTrackOrder: (orderNumber: string) => void;
  onContinueShopping: () => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order,
  onTrackOrder,
  onContinueShopping,
}) => {
  const { formatPKR, showToast } = useStore();
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopiedOrder(true);
      showToast('Order number copied to clipboard');
      setTimeout(() => setCopiedOrder(false), 2000);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // WhatsApp formatted message
  const handleWhatsAppConfirm = () => {
    const itemsSummary = order.items
      .map((i, idx) => `${idx + 1}. ${i.productName} (${i.size || 'Standard'} / ${i.color || 'Standard'}) x${i.quantity} = Rs. ${(i.price * i.quantity).toLocaleString()}`)
      .join('\n');

    const addressStr = `${order.shippingAddress.address}${order.shippingAddress.area ? ', ' + order.shippingAddress.area : ''}, ${order.shippingAddress.city}, ${order.shippingAddress.province || ''}`;

    let paymentDetails = `*Payment Method:* ${order.paymentMethod}\n*Payment Status:* ${order.paymentStatus}`;
    if (order.isPartialPayment) {
      paymentDetails += `\n*Advance Paid/Due:* Rs. ${order.advanceAmount.toLocaleString()} (${order.advancePercentage}%)\n*Remaining Cash on Delivery:* Rs. ${order.remainingBalance.toLocaleString()}`;
    } else if (order.paymentMethod === 'COD') {
      paymentDetails += `\n*Cash Payable on Delivery:* Rs. ${order.total.toLocaleString()}`;
    } else {
      paymentDetails += `\n*Paid in Full:* Rs. ${order.total.toLocaleString()}`;
    }

    if (order.selectedBankAccountName) {
      paymentDetails += `\n*Bank Account Selected:* ${order.selectedBankAccountName}`;
    }

    const message = `🏁 *REVORA MOTORSPORT ORDER CONFIRMATION*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Order Number:* ${order.orderNumber}
*Date:* ${new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}

*CUSTOMER INFORMATION*
• *Name:* ${order.customerName}
• *Phone:* ${order.customerPhone}
• *Email:* ${order.customerEmail}
• *Destination:* ${addressStr}

*ITEMS ORDERED*
${itemsSummary}

*FINANCIAL BREAKDOWN*
• *Subtotal:* Rs. ${order.subtotal.toLocaleString()}
${order.discount > 0 ? `• *Discount Applied:* -Rs. ${order.discount.toLocaleString()}\n` : ''}• *Delivery Fee:* ${order.deliveryFee === 0 ? 'FREE' : 'Rs. ' + order.deliveryFee.toLocaleString()}
• *Final Total:* Rs. ${order.total.toLocaleString()}

*PAYMENT SPECIFICATIONS*
${paymentDetails}

Please confirm my order booking and verify dispatch timeline. Thank you!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/923294862442?text=${encoded}`, '_blank');
  };

  // Accurate breakdown calculations
  const payableNow = order.isPartialPayment
    ? order.advanceAmount
    : order.paymentMethod === 'COD'
    ? 0
    : order.total;

  const dueOnDelivery = order.isPartialPayment
    ? order.remainingBalance
    : order.paymentMethod === 'COD'
    ? order.total
    : 0;

  return (
    <div className="py-12 bg-neutral-100 min-h-screen text-neutral-900 flex items-center justify-center">
      {/* Embedded print styles to isolate receipt when printing/saving as PDF */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #revora-printable-receipt, #revora-printable-receipt * {
            visibility: visible !important;
          }
          #revora-printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 space-y-6">
        {/* Success Header */}
        <div className="bg-white border border-neutral-200 p-8 rounded-xs text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-black text-white mx-auto rounded-full flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>

          <div className="text-[11px] font-mono tracking-widest text-neutral-500 uppercase">
            REVORA MOTORSPORT APPAREL LAB // DISPATCH DESK
          </div>

          <h1 className="text-3xl font-black text-black uppercase font-display tracking-tight">
            Order Confirmed!
          </h1>

          <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
            Thank you, <strong className="text-black">{order.customerName}</strong>. Your automotive streetwear pieces have been logged into our warehouse fulfillment system.
          </p>

          {/* Order Reference Badge */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-3 bg-neutral-50 border border-neutral-300 px-5 py-3 rounded-xs shadow-2xs">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                  OFFICIAL ORDER NUMBER
                </span>
                <span className="text-2xl font-black font-mono text-black tracking-widest">
                  {order.orderNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 bg-white hover:bg-neutral-200 border border-neutral-300 text-neutral-700 hover:text-black rounded-xs transition-colors cursor-pointer"
                title="Copy Order Number"
              >
                {copiedOrder ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons: WhatsApp Confirmation & Download Receipt PDF */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Send on WhatsApp Button */}
          <button
            type="button"
            onClick={handleWhatsAppConfirm}
            className="bg-[#25D366] hover:bg-[#20ba59] text-white py-3.5 px-4 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-display transition-all shadow-sm hover:shadow"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>CONFIRM ON WHATSAPP (+92 329 4862442)</span>
          </button>

          {/* Download Receipt PDF Button */}
          <button
            type="button"
            onClick={() => setShowReceiptModal(true)}
            className="bg-black hover:bg-neutral-800 text-white py-3.5 px-4 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-display transition-all shadow-sm hover:shadow"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD CONFIRMATION RECEIPT (PDF)</span>
          </button>
        </div>

        {/* Dispatch & Email Notice */}
        <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xs flex items-start gap-3 text-xs font-mono">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-neutral-900 uppercase">
              Official Dispatch Status: Queued for Fulfillment
            </div>
            <p className="text-neutral-600 text-[11px] leading-relaxed">
              Our dispatch desk will verify your order, pack your items, and email your official courier tracking code directly to <strong className="text-black">{order.customerEmail}</strong> and mobile <strong className="text-black">{order.customerPhone}</strong>.
            </p>
          </div>
        </div>

        {/* Financial & Payment Summary Card */}
        <div className="bg-white border border-neutral-200 p-6 rounded-xs space-y-4 text-xs font-mono shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <span className="text-neutral-500 font-semibold uppercase text-[11px]">Payment Method</span>
            <span className="text-black font-bold uppercase">{order.paymentMethod}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <span className="text-neutral-500 font-semibold uppercase text-[11px]">Payment Status</span>
            <span className={`font-bold px-2 py-0.5 rounded-2xs text-[11px] ${
              order.paymentStatus === 'Fully Paid'
                ? 'bg-emerald-100 text-emerald-800'
                : order.paymentStatus === 'Partially Paid'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {order.paymentStatus}
            </span>
          </div>

          {order.selectedBankAccountName && (
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="text-neutral-500 font-semibold uppercase text-[11px]">Bank Account</span>
              <span className="text-black font-bold">{order.selectedBankAccountName}</span>
            </div>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <span className="text-neutral-500 font-semibold uppercase text-[11px]">Delivery Destination</span>
            <span className="text-black text-right max-w-xs truncate font-medium">
              {order.shippingAddress.address}, {order.shippingAddress.area ? `${order.shippingAddress.area}, ` : ''}{order.shippingAddress.city}
            </span>
          </div>

          {/* Amount Breakdown */}
          <div className="space-y-2 pt-1 text-neutral-600">
            <div className="flex justify-between">
              <span>Products Subtotal</span>
              <span className="text-black font-semibold font-mono">{formatPKR(order.subtotal)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount Applied {order.discountCode ? `(${order.discountCode})` : ''}</span>
                <span className="font-mono font-semibold">-{formatPKR(order.discount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Shipping Charges</span>
              <span className="text-black font-semibold font-mono">
                {order.deliveryFee === 0 ? 'FREE' : formatPKR(order.deliveryFee)}
              </span>
            </div>

            <div className="flex justify-between text-base font-bold text-black font-display pt-2 border-t border-neutral-200">
              <span>Final Order Total</span>
              <span className="font-mono tabular-nums">{formatPKR(order.total)}</span>
            </div>
          </div>

          {/* Clear Payable Now vs Doorstep Balance breakdown */}
          <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-xs space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-600 font-semibold">Amount Paid / Due Now (Today):</span>
              <span className="font-mono font-bold text-emerald-800 text-sm">
                {payableNow === 0 ? 'Rs. 0 (COD)' : formatPKR(payableNow)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-200">
              <span className="text-neutral-600 font-semibold">Amount Due on Delivery (Doorstep Cash):</span>
              <span className="font-mono font-bold text-neutral-900 text-sm">
                {dueOnDelivery === 0 ? 'Rs. 0 (Fully Settled)' : formatPKR(dueOnDelivery)}
              </span>
            </div>

            {order.isPartialPayment && (
              <div className="text-[11px] text-neutral-700 pt-1 font-mono leading-relaxed">
                <strong>Partial Payment Plan:</strong> {order.advancePercentage}% advance ({formatPKR(order.advanceAmount)}) with remaining balance ({formatPKR(order.remainingBalance)}) payable upon courier delivery.
              </div>
            )}
          </div>
        </div>

        {/* Ordered Items Preview */}
        <div className="bg-white border border-neutral-200 p-6 rounded-xs space-y-3 font-mono shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <span className="font-display font-bold text-xs uppercase text-neutral-900">
              Ordered Items ({order.items.reduce((acc, i) => acc + i.quantity, 0)})
            </span>
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="text-[11px] text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer underline"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full Receipt Preview</span>
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-10 h-10 object-cover rounded-xs border border-neutral-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center rounded-xs">
                      <Package className="w-5 h-5 text-neutral-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-neutral-900">{item.productName}</div>
                    <div className="text-[11px] text-neutral-500">
                      Qty: {item.quantity} | Size: {item.size || 'STD'} | Color: {item.color || 'Default'}
                    </div>
                  </div>
                </div>
                <div className="font-bold text-neutral-900 font-mono">
                  {formatPKR(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => onTrackOrder(order.orderNumber)}
            className="flex-1 bg-black hover:bg-neutral-800 text-white py-3.5 px-4 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-display transition-colors shadow-sm"
          >
            <Truck className="w-4 h-4" />
            <span>TRACK ORDER TIMELINE</span>
          </button>

          <button
            type="button"
            onClick={onContinueShopping}
            className="flex-1 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 py-3.5 px-4 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-display transition-colors shadow-2xs"
          >
            <span>CONTINUE SHOPPING</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirmation Receipt Preview Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs no-print">
          <div className="bg-white text-neutral-900 rounded-xs max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-neutral-300">
            {/* Modal Controls Header */}
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-neutral-700" />
                <span className="font-bold text-xs uppercase font-display tracking-wider">
                  Official Confirmation Receipt Preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="bg-black hover:bg-neutral-800 text-white text-xs px-3.5 py-1.5 rounded-xs font-bold uppercase font-display flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1.5 hover:bg-neutral-200 rounded-xs cursor-pointer text-neutral-600 hover:text-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Receipt Printable Container */}
            <div className="p-6 sm:p-8 overflow-y-auto max-h-[75vh] bg-neutral-100 flex justify-center">
              <div
                id="revora-printable-receipt"
                className="bg-white w-full max-w-2xl border border-neutral-300 p-8 sm:p-10 text-neutral-900 font-mono shadow-sm space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-black gap-4">
                  <div>
                    <h2 className="text-2xl font-black font-display tracking-tight text-black uppercase">
                      REVORA
                    </h2>
                    <p className="text-[10px] tracking-widest text-neutral-500 uppercase mt-0.5">
                      Motorsport Apparel Lab & Performance Wear
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      WhatsApp: +92 329 4862442 | officialrevora.pk
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-block bg-black text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider mb-1">
                      CONFIRMATION RECEIPT
                    </span>
                    <div className="text-sm font-bold text-black">{order.orderNumber}</div>
                    <div className="text-[10px] text-neutral-500">
                      Date: {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Customer & Shipping Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pb-4 border-b border-neutral-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                      CUSTOMER DETAILS
                    </span>
                    <div className="font-bold text-black">{order.customerName}</div>
                    <div className="text-neutral-600">{order.customerPhone}</div>
                    <div className="text-neutral-600">{order.customerEmail}</div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                      DELIVERY ADDRESS
                    </span>
                    <div className="text-neutral-800">
                      {order.shippingAddress.address}
                    </div>
                    {order.shippingAddress.area && (
                      <div className="text-neutral-600">{order.shippingAddress.area}</div>
                    )}
                    <div className="font-semibold text-black">
                      {order.shippingAddress.city}, {order.shippingAddress.province || 'Pakistan'}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                    ORDER ITEMS BREAKDOWN
                  </span>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-300 text-[10px] text-neutral-500 uppercase text-left">
                        <th className="py-2 font-bold">Item Description</th>
                        <th className="py-2 font-bold text-center">Specs</th>
                        <th className="py-2 font-bold text-center">Qty</th>
                        <th className="py-2 font-bold text-right">Unit Price</th>
                        <th className="py-2 font-bold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="text-neutral-800">
                          <td className="py-2.5 font-medium text-black">
                            {item.productName}
                          </td>
                          <td className="py-2.5 text-center text-neutral-600 text-[11px]">
                            {item.size || 'STD'} / {item.color || 'STD'}
                          </td>
                          <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="py-2.5 text-right font-mono">{formatPKR(item.price)}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-black">
                            {formatPKR(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation & Terms Summary */}
                <div className="pt-4 border-t-2 border-neutral-300 flex flex-col sm:flex-row justify-between gap-6 text-xs">
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                      PAYMENT INSTRUCTIONS & TERMS
                    </span>
                    <div className="text-[11px] text-neutral-700">
                      <strong>Payment Mode:</strong> {order.paymentMethod} ({order.paymentStatus})
                    </div>
                    {order.selectedBankAccountName && (
                      <div className="text-[11px] text-neutral-700">
                        <strong>Bank:</strong> {order.selectedBankAccountName}
                      </div>
                    )}
                    <div className="text-[11px] text-neutral-600 leading-relaxed pt-1">
                      {order.isPartialPayment
                        ? `Partial payment booked. Advance: Rs. ${order.advanceAmount.toLocaleString()} (${order.advancePercentage}%). Remaining Rs. ${order.remainingBalance.toLocaleString()} payable in cash upon doorstep delivery.`
                        : order.paymentMethod === 'COD'
                        ? 'Full cash on delivery. Please keep exact change ready for the courier agent.'
                        : 'Paid in full via Bank Transfer / Online. No further payment required upon delivery.'}
                    </div>
                  </div>

                  <div className="w-full sm:w-64 space-y-1.5 border-t sm:border-t-0 sm:border-l sm:pl-6 border-neutral-200 pt-2 sm:pt-0">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal:</span>
                      <span className="font-mono text-black font-semibold">{formatPKR(order.subtotal)}</span>
                    </div>

                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span className="font-mono font-semibold">-{formatPKR(order.discount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-neutral-600">
                      <span>Delivery Fee:</span>
                      <span className="font-mono text-black font-semibold">
                        {order.deliveryFee === 0 ? 'FREE' : formatPKR(order.deliveryFee)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm font-bold text-black border-t border-neutral-300 pt-1.5">
                      <span>Grand Total:</span>
                      <span className="font-mono">{formatPKR(order.total)}</span>
                    </div>

                    <div className="pt-2 border-t border-neutral-200 space-y-1 text-[11px]">
                      <div className="flex justify-between text-emerald-800 font-bold">
                        <span>Paid / Due Today:</span>
                        <span>{payableNow === 0 ? 'Rs. 0' : formatPKR(payableNow)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-900 font-bold">
                        <span>Due at Delivery:</span>
                        <span>{dueOnDelivery === 0 ? 'Rs. 0' : formatPKR(dueOnDelivery)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Stamp */}
                <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-neutral-500 gap-2">
                  <span>Revora Official Verified Order Document • {order.orderNumber}</span>
                  <span className="font-bold uppercase tracking-wider text-black">
                    REVORA // AUTOMOTIVE STREETWEAR
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs font-mono no-print">
              <span className="text-neutral-500 text-[11px]">
                Tip: You can select "Save as PDF" in your print dialog to download this receipt.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleWhatsAppConfirm}
                  className="flex-1 sm:flex-none bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-2 rounded-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>Send on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex-1 sm:flex-none bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / Print PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
