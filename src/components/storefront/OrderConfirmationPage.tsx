import React, { useState } from 'react';
import { Order } from '../../types';
import { useStore } from '../../context/StoreContext';
import { sendOrderConfirmationEmail, generateOrderEmailHtml } from '../../services/gmailService';
import { updateOrderEmailStatus } from '../../services/storage';
import { getCurrentUser } from '../../services/gmailAuth';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import {
  CheckCircle2,
  Copy,
  Truck,
  ArrowRight,
  Mail,
  Send,
  Eye,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

interface OrderConfirmationPageProps {
  order: Order;
  onTrackOrder: (orderNumber: string) => void;
  onContinueShopping: () => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order: initialOrder,
  onTrackOrder,
  onContinueShopping,
}) => {
  const { formatPKR, showToast, settings } = useStore();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [emailErrorMsg, setEmailErrorMsg] = useState<string | null>(null);

  const googleUser = getCurrentUser();

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(order.orderNumber);
      showToast('Order number copied to clipboard');
    }
  };

  const handleSendGmail = async () => {
    setIsSendingEmail(true);
    setEmailSuccessMsg(null);
    setEmailErrorMsg(null);

    try {
      const res = await sendOrderConfirmationEmail(order, {
        senderEmail: settings.gmailSettings?.senderEmail || 'revoraofficial57@gmail.com',
      });

      if (res.success) {
        updateOrderEmailStatus(order.id, true, undefined, res.messageId);
        setOrder((prev) => ({
          ...prev,
          emailSent: true,
          emailSentAt: new Date().toISOString(),
          gmailMessageId: res.messageId,
          emailError: undefined,
        }));
        setEmailSuccessMsg(`Order confirmation successfully delivered to ${order.customerEmail} via Gmail.`);
        showToast('Confirmation email dispatched via Gmail!');
      } else {
        setEmailErrorMsg(res.error || 'Failed to dispatch email via Gmail.');
        showToast(res.error || 'Could not send email. Check Google authentication.');
      }
    } catch (err: any) {
      setEmailErrorMsg(err?.message || 'Error sending email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="py-16 bg-white min-h-screen text-neutral-900 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-black text-white mx-auto rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
            REVORA MOTORSPORT APPAREL LAB // DISPATCH QUEUE
          </div>
          <h1 className="text-3xl font-black text-black uppercase font-display tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
            Thank you, <strong className="text-black">{order.customerName}</strong>. Your automotive streetwear pieces have been logged into our warehouse fulfillment system.
          </p>
        </div>

        {/* Order Number Box */}
        <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-xs space-y-4 text-center shadow-xs">
          <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">
            OFFICIAL ORDER REFERENCE
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-black font-mono text-black tracking-widest">
              {order.orderNumber}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 hover:text-black rounded-xs transition-colors cursor-pointer"
              title="Copy Order Number"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] font-mono text-neutral-600">
            A confirmation receipt has been generated for <strong className="text-black">{order.customerEmail}</strong> and mobile {order.customerPhone}.
          </p>
        </div>

        {/* Gmail Notification Banner & Controls */}
        <div className="bg-neutral-900 text-white border border-neutral-800 p-5 rounded-xs space-y-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-black/60 border border-neutral-700 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase font-display flex items-center gap-2">
                  <span>Gmail Order Confirmation</span>
                  {order.emailSent ? (
                    <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-xs flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      Dispatched to {order.customerEmail}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-xs">
                      Ready to Dispatch
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  Official branded invoice & tracking info sent directly from Revora via Gmail.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowEmailPreview(true)}
              className="text-[10px] font-mono text-neutral-300 hover:text-white flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1.5 rounded-xs border border-neutral-700 cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Email</span>
            </button>
          </div>

          {emailSuccessMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{emailSuccessMsg}</span>
            </div>
          )}

          {emailErrorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xs">
              {emailErrorMsg}
            </div>
          )}

          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-neutral-800">
            <div className="text-[11px] text-neutral-400 font-mono">
              Recipient: <strong className="text-white">{order.customerEmail}</strong>
            </div>

            <div className="flex items-center gap-2">
              {!googleUser ? (
                <GoogleSignInButton
                  variant="compact"
                  buttonText="Sign in with Google"
                  onSuccess={() => {
                    showToast('Google account connected!');
                    handleSendGmail();
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={handleSendGmail}
                  disabled={isSendingEmail}
                  className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black px-4 py-2 rounded-xs text-xs font-bold uppercase font-display tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-black" />
                  <span>
                    {isSendingEmail
                      ? 'Sending via Gmail...'
                      : order.emailSent
                      ? 'Resend via Gmail'
                      : 'Send Confirmation Email'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payment & Shipping Summary */}
        <div className="bg-white border border-neutral-200 p-6 rounded-xs space-y-3.5 text-xs font-mono shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <span className="text-neutral-500">Selected Payment Method</span>
            <span className="text-black font-bold uppercase">{order.paymentMethod}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <span className="text-neutral-500">Payment Status</span>
            <span className="text-emerald-700 font-bold">{order.paymentStatus}</span>
          </div>

          {order.selectedBankAccountName && (
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <span className="text-neutral-500">Selected Bank Account</span>
              <span className="text-black font-bold">{order.selectedBankAccountName}</span>
            </div>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <span className="text-neutral-500">Delivery Destination</span>
            <span className="text-black text-right max-w-xs truncate font-medium">
              {order.shippingAddress.address}, {order.shippingAddress.area ? `${order.shippingAddress.area}, ` : ''}{order.shippingAddress.city}
            </span>
          </div>

          {/* Amount Breakdown */}
          <div className="space-y-1.5 pt-1 text-neutral-600">
            <div className="flex justify-between">
              <span>Products Subtotal</span>
              <span className="text-black font-semibold">{formatPKR(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount Applied</span>
                <span>-{formatPKR(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping Charges</span>
              <span className="text-black font-semibold">{order.deliveryFee === 0 ? 'FREE' : formatPKR(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-black font-display pt-2 border-t border-neutral-200">
              <span>Final Order Total</span>
              <span className="font-mono tabular-nums">{formatPKR(order.total)}</span>
            </div>
          </div>

          {/* What Was Paid vs What is Due at Delivery */}
          <div className="mt-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xs space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-600">Amount Paid / Due Now (Today):</span>
              <span className="font-mono font-bold text-emerald-800 text-sm">
                {order.isPartialPayment
                  ? formatPKR(order.advanceAmount)
                  : order.paymentMethod === 'COD'
                  ? 'Rs. 0'
                  : formatPKR(order.total)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs pt-1 border-t border-neutral-200">
              <span className="text-neutral-600">Amount Due on Delivery (Doorstep):</span>
              <span className="font-mono font-bold text-amber-900 text-sm">
                {order.isPartialPayment
                  ? formatPKR(order.remainingBalance)
                  : order.paymentMethod === 'COD'
                  ? formatPKR(order.total)
                  : 'Rs. 0 (Fully Paid)'}
              </span>
            </div>

            {order.isPartialPayment && (
              <div className="text-[11px] text-amber-800 pt-1 font-mono">
                <strong>Balance Terms:</strong> {order.remainingBalanceDueWhen || 'Payable in cash upon doorstep delivery'}
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Receipt & Print Controls */}
        <div className="flex flex-col sm:flex-row gap-3 font-mono text-xs">
          <button
            onClick={() => {
              const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.productName} (${i.size})`).join(', ');
              const partialText = order.isPartialPayment
                ? `\n*Advance Due/Paid:* Rs. ${order.advanceAmount.toLocaleString()} (${order.advancePercentage}%)\n*Remaining Balance:* Rs. ${order.remainingBalance.toLocaleString()} (${order.remainingBalanceDueWhen || 'Payable at delivery'})`
                : '';
              const bankText = order.selectedBankAccountName ? `\n*Bank Account:* ${order.selectedBankAccountName}` : '';
              const text = encodeURIComponent(
                `🏁 *REVORA Order Confirmation*\n*Order #:* ${order.orderNumber}\n*Customer:* ${order.customerName}\n*Phone:* ${order.customerPhone}\n*Items:* ${itemsSummary}\n*Total:* Rs. ${order.total.toLocaleString()}\n*Payment Method:* ${order.paymentMethod} (${order.paymentStatus})${bankText}${partialText}\n*Delivery City:* ${order.shippingAddress.city}`
              );
              window.open(`https://wa.me/923294862442?text=${text}`, '_blank');
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <span>SHARE ON WHATSAPP (+92 329 4862442)</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onTrackOrder(order.orderNumber)}
            className="flex-1 bg-black hover:bg-neutral-800 text-white py-3.5 px-4 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-display transition-colors shadow-sm"
          >
            <Truck className="w-4 h-4" />
            <span>TRACK ORDER TIMELINE</span>
          </button>

          <button
            onClick={onContinueShopping}
            className="flex-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 py-3.5 px-4 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-display transition-colors"
          >
            <span>CONTINUE SHOPPING</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Email Preview Modal */}
        {showEmailPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-white text-neutral-900 rounded-xs max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-neutral-200">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-700" />
                  <span className="font-bold text-xs uppercase font-display">
                    Gmail Confirmation Receipt Preview
                  </span>
                </div>
                <button
                  onClick={() => setShowEmailPreview(false)}
                  className="p-1 hover:bg-neutral-200 rounded-xs cursor-pointer text-neutral-600 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[70vh] bg-neutral-100">
                <div
                  className="bg-white shadow-xs rounded-xs overflow-hidden"
                  dangerouslySetInnerHTML={{
                    __html: generateOrderEmailHtml(order, settings.gmailSettings?.senderEmail || 'revoraofficial57@gmail.com'),
                  }}
                />
              </div>

              <div className="p-4 border-t border-neutral-200 flex items-center justify-between bg-white text-xs font-mono">
                <span className="text-neutral-500">
                  Recipient: {order.customerEmail}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailPreview(false);
                    handleSendGmail();
                  }}
                  className="bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xs font-bold uppercase cursor-pointer"
                >
                  Dispatch via Gmail
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
