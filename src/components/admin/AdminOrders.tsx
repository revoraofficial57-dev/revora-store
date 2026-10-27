import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAdmin } from '../../context/AdminContext';
import {
  getAllOrders,
  updateOrderStatus,
  updatePaymentVerification,
  recordRemainingPayment,
  updateOrderEmailStatus,
} from '../../services/storage';
import {
  sendOrderConfirmationEmail,
  generateGmailWebComposeUrl,
  generateOrderEmailPlainText,
} from '../../services/gmailService';
import {
  isGoogleConnected,
  googleSignIn,
  getCurrentUser,
  logoutGoogle,
} from '../../services/gmailAuth';
import { Order, OrderStatus } from '../../types';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Filter,
  Printer,
  Download,
  AlertCircle,
  Banknote,
  Building2,
  Percent,
  Mail,
  Send,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const { formatPKR, showToast } = useStore();
  const { username } = useAdmin();

  const [orders, setOrders] = useState<Order[]>(() => getAllOrders());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [sendingEmailOrderId, setSendingEmailOrderId] = useState<string | null>(null);

  // Gmail connection state
  const [isGoogleConnectedState, setIsGoogleConnectedState] = useState(() => isGoogleConnected());
  const [googleUserEmail, setGoogleUserEmail] = useState(() => getCurrentUser()?.email || (isGoogleConnected() ? 'revoraofficial57@gmail.com' : null));
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [emailDispatchModalOrder, setEmailDispatchModalOrder] = useState<Order | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Payment proof inspection modal
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Invoice / Details modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setIsGoogleConnectedState(true);
        setGoogleUserEmail(res.user.email || 'revoraofficial57@gmail.com');
        showToast(`Connected to Gmail as ${res.user.email || 'revoraofficial57@gmail.com'}! Ready to send order emails.`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await logoutGoogle();
    setIsGoogleConnectedState(false);
    setGoogleUserEmail(null);
    showToast('Signed out of Google account.');
  };

  const handleSendOrderEmail = async (order: Order) => {
    setSendingEmailOrderId(order.id);
    try {
      const res = await sendOrderConfirmationEmail(order, { autoPromptAuth: true });
      if (res.success) {
        setIsGoogleConnectedState(true);
        setGoogleUserEmail(getCurrentUser()?.email || 'revoraofficial57@gmail.com');
        updateOrderEmailStatus(order.id, true, undefined, res.messageId);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  emailSent: true,
                  emailSentAt: new Date().toISOString(),
                  gmailMessageId: res.messageId,
                  emailError: undefined,
                }
              : o
          )
        );
        if (selectedInvoiceOrder?.id === order.id) {
          setSelectedInvoiceOrder((prev) =>
            prev
              ? {
                  ...prev,
                  emailSent: true,
                  emailSentAt: new Date().toISOString(),
                  gmailMessageId: res.messageId,
                  emailError: undefined,
                }
              : null
          );
        }
        showToast(`Order confirmation dispatched to ${order.customerEmail} via Gmail!`);
      } else {
        updateOrderEmailStatus(order.id, false, res.error);
        setEmailDispatchModalOrder(order);
        showToast(res.error || 'Google authorization required. Options modal opened.');
      }
    } catch (err: any) {
      setEmailDispatchModalOrder(order);
      showToast(err?.message || 'Error occurred while sending email.');
    } finally {
      setSendingEmailOrderId(null);
    }
  };

  const handleMarkEmailSentManually = (order: Order) => {
    updateOrderEmailStatus(order.id, true, undefined, 'manual-webmail-sent');
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              emailSent: true,
              emailSentAt: new Date().toISOString(),
              gmailMessageId: 'manual-webmail-sent',
              emailError: undefined,
            }
          : o
      )
    );
    if (selectedInvoiceOrder?.id === order.id) {
      setSelectedInvoiceOrder((prev) =>
        prev ? { ...prev, emailSent: true, emailSentAt: new Date().toISOString() } : null
      );
    }
    setEmailDispatchModalOrder(null);
    showToast(`Marked Order #${order.orderNumber} email as dispatched!`);
  };

  const handleCopyEmailText = (order: Order) => {
    const text = generateOrderEmailPlainText(order);
    navigator.clipboard.writeText(text);
    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 2500);
    showToast('Customer invoice & order text copied to clipboard!');
  };


  const reloadOrders = () => {
    setOrders(getAllOrders());
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    try {
      updateOrderStatus(orderId, newStatus, `Status updated by ${username}`, username);
      reloadOrders();
      showToast(`Order status updated to ${newStatus}`);
    } catch (e: any) {
      alert(e.message || 'Error updating status');
    }
  };

  const handleVerifyProof = (orderId: string) => {
    try {
      updatePaymentVerification(orderId, 'Verified', undefined, username);
      reloadOrders();
      setSelectedProofOrder(null);
      showToast('Payment proof verified successfully!');
    } catch (e: any) {
      alert(e.message || 'Error verifying proof');
    }
  };

  const handleRejectProof = (orderId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason for customer records.');
      return;
    }
    try {
      updatePaymentVerification(orderId, 'Rejected', rejectionReason.trim(), username);
      reloadOrders();
      setSelectedProofOrder(null);
      setRejectionReason('');
      showToast('Payment proof marked as rejected.');
    } catch (e: any) {
      alert(e.message || 'Error rejecting proof');
    }
  };

  // Record balance payment modal
  const [recordBalanceOrder, setRecordBalanceOrder] = useState<Order | null>(null);
  const [balanceAmountToRecord, setBalanceAmountToRecord] = useState<number>(0);
  const [balanceNotes, setBalanceNotes] = useState<string>('');

  const handleRecordBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordBalanceOrder) return;
    try {
      recordRemainingPayment(recordBalanceOrder.id, balanceAmountToRecord, balanceNotes, username);
      reloadOrders();
      setRecordBalanceOrder(null);
      showToast(`Recorded balance payment of Rs. ${balanceAmountToRecord.toLocaleString()}`);
    } catch (e: any) {
      alert(e.message || 'Error recording balance payment');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.toLowerCase().includes(q);
      const matchCity = o.shippingAddress.city.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone && !matchCity) return false;
    }

    if (filterStatus !== 'all' && o.orderStatus !== filterStatus) return false;
    if (filterPayment !== 'all' && o.paymentMethod !== filterPayment) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white uppercase font-display">
            Order Fulfillment & Dispatch Log
          </h2>
          <p className="text-xs font-mono text-neutral-400">
            {orders.length} total orders recorded in persistent store
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, phone, customer..."
              className="bg-neutral-900 border border-neutral-800 text-xs pl-8 pr-3 py-2 rounded-xs text-white placeholder-neutral-500 font-mono w-60"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-xs text-neutral-200 font-mono"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Gmail Authority & Connection Status Banner */}
      <div className={`p-4 rounded-xs border font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${

        isGoogleConnectedState
          ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
          : 'bg-neutral-900 border-neutral-700 text-neutral-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isGoogleConnectedState ? 'bg-emerald-900/80 text-emerald-300' : 'bg-neutral-800 text-amber-300'
          }`}>
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold uppercase tracking-wider flex items-center gap-2">
              <span>Gmail Dispatch Authority</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-xs font-semibold ${
                isGoogleConnectedState ? 'bg-emerald-900 text-emerald-200 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {isGoogleConnectedState ? 'Active & Ready' : 'Authorization Needed'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {isGoogleConnectedState
                ? `Authorized sender: ${googleUserEmail || 'revoraofficial57@gmail.com'}. Order confirmation emails are dispatched automatically to customers.`
                : 'Connect your store Google account (revoraofficial57@gmail.com) to allow the admin panel to dispatch order confirmation emails.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isGoogleConnectedState ? (
            <button
              type="button"
              onClick={handleDisconnectGoogle}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] rounded-xs font-bold uppercase cursor-pointer transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={isConnectingGoogle}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs rounded-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{isConnectingGoogle ? 'Connecting...' : 'Connect Gmail Account'}</span>
            </button>
          )}
        </div>
      </div>


      {/* Orders Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xs overflow-x-auto">
        <table className="w-full text-xs font-mono text-left text-neutral-300">
          <thead className="bg-neutral-900 text-neutral-400 uppercase text-[11px] border-b border-neutral-800">
            <tr>
              <th className="p-3">Order Number</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer & City</th>
              <th className="p-3">Total (PKR)</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Proof Status</th>
              <th className="p-3">Order Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-neutral-500">
                  No orders match current filter criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-900/40">
                  <td className="p-3 font-bold text-white">
                    <button
                      onClick={() => setSelectedInvoiceOrder(o)}
                      className="hover:underline text-left cursor-pointer"
                    >
                      {o.orderNumber}
                    </button>
                  </td>
                  <td className="p-3 text-neutral-400">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-white">{o.customerName}</div>
                    <div className="text-[10px] text-neutral-500">
                      {o.shippingAddress.city} · {o.customerPhone}
                    </div>
                  </td>
                  <td className="p-3 font-bold text-white tabular-nums">
                    <div>{formatPKR(o.total)}</div>
                    {o.isPartialPayment && (
                      <div className="text-[10px] font-mono mt-0.5">
                        {o.remainingBalance > 0 ? (
                          <span className="text-amber-400 font-normal">
                            Bal: {formatPKR(o.remainingBalance)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-normal">Fully Paid</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-semibold">{o.paymentMethod}</span>
                    <div className="text-[10px] text-neutral-400">{o.paymentStatus}</div>
                  </td>
                  <td className="p-3">
                    {o.paymentProof ? (
                      <button
                        onClick={() => setSelectedProofOrder(o)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-xs border cursor-pointer flex items-center gap-1 ${
                          o.paymentProof.status === 'Verified'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : o.paymentProof.status === 'Rejected'
                            ? 'bg-red-950 text-red-400 border-red-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>{o.paymentProof.status}</span>
                      </button>
                    ) : (
                      <span className="text-neutral-500 text-[10px]">N/A ({o.paymentMethod})</span>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      value={o.orderStatus}
                      onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                      className="bg-neutral-900 border border-neutral-800 text-[11px] px-2 py-1 rounded-xs text-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {o.remainingBalance > 0 && (
                        <button
                          onClick={() => {
                            setRecordBalanceOrder(o);
                            setBalanceAmountToRecord(o.remainingBalance);
                            setBalanceNotes('Doorstep delivery courier cash collection');
                          }}
                          className="px-2 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-[10px] font-bold rounded-xs border border-amber-700 cursor-pointer"
                          title="Record Balance Payment"
                        >
                          + Record Pay
                        </button>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSendOrderEmail(o)}
                          disabled={sendingEmailOrderId === o.id}
                          className={`px-2 py-1 text-[10px] font-bold rounded-xs border cursor-pointer flex items-center gap-1 transition-colors ${
                            o.emailSent
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                              : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800'
                          }`}
                          title={
                            o.emailSent
                              ? `Gmail confirmation dispatched at ${new Date(o.emailSentAt || '').toLocaleTimeString()}`
                              : 'Send confirmation email via Gmail'
                          }
                        >
                          <Mail className="w-3 h-3 text-emerald-400" />
                          <span>{sendingEmailOrderId === o.id ? 'Sending...' : o.emailSent ? 'Sent ✓' : 'Send Email'}</span>
                        </button>
                        <button
                          onClick={() => setEmailDispatchModalOrder(o)}
                          className="px-1.5 py-1 text-[10px] bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xs border border-neutral-800 cursor-pointer"
                          title="Email Dispatch Options & Compose"
                        >
                          ⚙
                        </button>
                      </div>
                      <button
                        onClick={() => setSelectedInvoiceOrder(o)}
                        className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xs border border-neutral-800 cursor-pointer"
                      >
                        Invoice
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Proof Verification Modal */}
      {selectedProofOrder && selectedProofOrder.paymentProof && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 max-w-lg w-full p-6 rounded-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-display font-bold text-white uppercase text-base">
                Inspect Payment Proof · {selectedProofOrder.orderNumber}
              </h3>
              <button
                onClick={() => setSelectedProofOrder(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between text-neutral-400">
                <span>Customer: <strong className="text-white">{selectedProofOrder.customerName}</strong></span>
                <span>Expected: <strong className="text-white">{formatPKR(selectedProofOrder.total)}</strong></span>
              </div>

              {/* Proof Image / Document View */}
              <div className="border border-neutral-800 bg-black rounded-xs overflow-hidden max-h-80 flex items-center justify-center p-2">
                {selectedProofOrder.paymentProof.fileUrl ? (
                  <img
                    src={selectedProofOrder.paymentProof.fileUrl}
                    alt="Payment Proof"
                    className="max-h-72 object-contain"
                  />
                ) : (
                  <div className="p-8 text-neutral-500 text-center">
                    Payment proof document archived under customer privacy retention policy.
                  </div>
                )}
              </div>

              <div className="text-[11px] text-neutral-500">
                File: {selectedProofOrder.paymentProof.fileName} · Uploaded: {new Date(selectedProofOrder.paymentProof.uploadedAt).toLocaleString()}
              </div>

              {selectedProofOrder.paymentProof.status === 'Rejected' && (
                <div className="p-2.5 bg-red-950/60 border border-red-800 text-red-300 rounded-xs">
                  Rejection Reason: {selectedProofOrder.paymentProof.rejectionReason}
                </div>
              )}

              {/* Verification Controls */}
              <div className="space-y-3 pt-3 border-t border-neutral-800">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Rejection Reason (If rejecting transaction)
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Transaction reference does not match Meezan Bank statement"
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs p-2 rounded-xs"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerifyProof(selectedProofOrder.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xs text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Confirm Order</span>
                  </button>

                  <button
                    onClick={() => handleRejectProof(selectedProofOrder.id)}
                    className="flex-1 bg-red-900/80 hover:bg-red-800 text-white font-bold py-2.5 rounded-xs text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Payment</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice & Detailed Slip Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 max-w-xl w-full p-6 sm:p-8 rounded-xs space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white text-black flex items-center justify-center font-black text-xs">
                  R
                </div>
                <span className="text-lg font-black tracking-widest text-white uppercase font-display">
                  REVORA INVOICE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 bg-neutral-900 text-neutral-300 hover:text-white rounded-xs cursor-pointer"
                  title="Print Slip"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between">
                <div>
                  <div className="text-neutral-500 text-[10px]">ORDER NUMBER</div>
                  <div className="text-white font-bold text-sm">{selectedInvoiceOrder.orderNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-neutral-500 text-[10px]">ORDER DATE</div>
                  <div className="text-neutral-300">{new Date(selectedInvoiceOrder.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="p-3 bg-neutral-900 rounded-xs space-y-1">
                <div className="text-neutral-400 font-bold">Shipping Address:</div>
                <div className="text-white">{selectedInvoiceOrder.customerName} ({selectedInvoiceOrder.customerPhone})</div>
                <div className="text-neutral-300">{selectedInvoiceOrder.shippingAddress.address}</div>
                <div className="text-neutral-300">{selectedInvoiceOrder.shippingAddress.city}, {selectedInvoiceOrder.shippingAddress.province}</div>
              </div>

              <div className="divide-y divide-neutral-900">
                {selectedInvoiceOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between">
                    <div>
                      <div className="text-white font-semibold">{item.productName}</div>
                      <div className="text-neutral-500 text-[10px]">
                        {item.clothingType} · Size {item.size} · Color {item.color} · Qty {item.quantity}
                      </div>
                    </div>
                    <div className="text-white font-bold tabular-nums">
                      {formatPKR(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-800 space-y-1.5 text-neutral-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">{formatPKR(selectedInvoiceOrder.subtotal)}</span>
                </div>
                {selectedInvoiceOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-{formatPKR(selectedInvoiceOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-white">{formatPKR(selectedInvoiceOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-neutral-800">
                  <span>Total Amount</span>
                  <span className="tabular-nums">{formatPKR(selectedInvoiceOrder.total)}</span>
                </div>

                <div className="flex justify-between text-neutral-400 pt-1">
                  <span>Payment Method</span>
                  <span className="text-white font-bold">{selectedInvoiceOrder.paymentMethod} ({selectedInvoiceOrder.paymentStatus})</span>
                </div>

                {selectedInvoiceOrder.selectedBankAccountName && (
                  <div className="flex justify-between text-neutral-400">
                    <span>Selected Bank Account</span>
                    <span className="text-white font-bold">{selectedInvoiceOrder.selectedBankAccountName}</span>
                  </div>
                )}

                {selectedInvoiceOrder.isPartialPayment && (
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xs space-y-1.5 text-[11px] mt-2">
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span>Advance Required ({selectedInvoiceOrder.advancePercentage}%)</span>
                      <span>{formatPKR(selectedInvoiceOrder.advanceAmount)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Amount Received & Verified</span>
                      <span>{formatPKR(selectedInvoiceOrder.amountReceived)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold pt-1 border-t border-neutral-800">
                      <span>Remaining Balance Due</span>
                      <span>{formatPKR(selectedInvoiceOrder.remainingBalance)}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 pt-0.5">
                      Terms: {selectedInvoiceOrder.remainingBalanceDueWhen || 'Payable at delivery'}
                    </div>
                  </div>
                )}

                <div className="pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      const cleanPhone = selectedInvoiceOrder.customerPhone.replace(/[\s-]/g, '').replace(/^0/, '92');
                      const itemsSummary = selectedInvoiceOrder.items.map((i) => `${i.quantity}x ${i.productName} (${i.size})`).join(', ');
                      const partialText = selectedInvoiceOrder.isPartialPayment
                        ? `\n*Advance Received:* Rs. ${selectedInvoiceOrder.amountReceived.toLocaleString()}\n*Remaining Balance:* Rs. ${selectedInvoiceOrder.remainingBalance.toLocaleString()} (${selectedInvoiceOrder.remainingBalanceDueWhen || 'Payable at delivery'})`
                        : '';
                      const text = encodeURIComponent(
                        `🏁 *REVORA OFFICIAL INVOICE*\n*Order #:* ${selectedInvoiceOrder.orderNumber}\n*Customer:* ${selectedInvoiceOrder.customerName}\n*Items:* ${itemsSummary}\n*Total:* Rs. ${selectedInvoiceOrder.total.toLocaleString()}\n*Payment:* ${selectedInvoiceOrder.paymentMethod} (${selectedInvoiceOrder.paymentStatus})${partialText}\n*Status:* ${selectedInvoiceOrder.orderStatus}\n*Courier Destination:* ${selectedInvoiceOrder.shippingAddress.city}`
                      );
                      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
                    }}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 rounded-xs text-[11px] uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Send WhatsApp Invoice</span>
                  </button>

                  <button
                    onClick={() => handleSendOrderEmail(selectedInvoiceOrder)}
                    disabled={sendingEmailOrderId === selectedInvoiceOrder.id}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold py-2 rounded-xs text-[11px] uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {sendingEmailOrderId === selectedInvoiceOrder.id
                        ? 'Sending...'
                        : selectedInvoiceOrder.emailSent
                        ? 'Resend via Gmail'
                        : 'Send via Gmail'}
                    </span>
                  </button>

                  <button
                    onClick={() => setEmailDispatchModalOrder(selectedInvoiceOrder)}
                    className="px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 font-bold py-2 rounded-xs text-[11px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                    title="More Email Options (Web Gmail compose / copy)"
                  >
                    <span>Options</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Remaining Balance Modal */}
      {recordBalanceOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 max-w-md w-full p-6 rounded-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-display font-bold text-white uppercase text-base flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Record Balance Payment</span>
              </h3>
              <button
                onClick={() => setRecordBalanceOrder(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordBalance} className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xs space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>Order:</span>
                  <span className="text-white font-bold">{recordBalanceOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Customer:</span>
                  <span className="text-white">{recordBalanceOrder.customerName}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Total Order:</span>
                  <span className="text-white">{formatPKR(recordBalanceOrder.total)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Already Received:</span>
                  <span className="text-emerald-400">{formatPKR(recordBalanceOrder.amountReceived || 0)}</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-neutral-800">
                  <span>Outstanding Balance:</span>
                  <span>{formatPKR(recordBalanceOrder.remainingBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">
                  Amount Received Now (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={recordBalanceOrder.remainingBalance}
                  value={balanceAmountToRecord}
                  onChange={(e) => setBalanceAmountToRecord(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">
                  Collection Note / Reference
                </label>
                <input
                  type="text"
                  value={balanceNotes}
                  onChange={(e) => setBalanceNotes(e.target.value)}
                  placeholder="e.g. Courier collected cash upon delivery (TCS tracking 48291)"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white p-2 rounded-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRecordBalanceOrder(null)}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-2.5 rounded-xs uppercase font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xs uppercase font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Dispatch & Authority Assistance Modal */}
      {emailDispatchModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 max-w-lg w-full p-6 rounded-xs space-y-5 text-xs font-mono shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display font-bold text-white uppercase text-base">
                  Dispatch Customer Order Email
                </h3>
              </div>
              <button
                onClick={() => setEmailDispatchModalOrder(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Order Target Details */}
            <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-400">Order Number:</span>
                <span className="text-white font-bold">{emailDispatchModalOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Recipient Customer:</span>
                <span className="text-white">{emailDispatchModalOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Customer Email:</span>
                <span className="text-emerald-300 font-bold select-all">
                  {emailDispatchModalOrder.customerEmail || emailDispatchModalOrder.shippingAddress.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Dispatch Status:</span>
                <span className={emailDispatchModalOrder.emailSent ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {emailDispatchModalOrder.emailSent
                    ? `Dispatched (${new Date(emailDispatchModalOrder.emailSentAt || '').toLocaleTimeString()})`
                    : 'Pending Dispatch'}
                </span>
              </div>
              {emailDispatchModalOrder.emailError && (
                <div className="text-[11px] text-red-300 bg-red-950/60 p-2 rounded-xs border border-red-900 mt-2">
                  Notice: {emailDispatchModalOrder.emailError}
                </div>
              )}
            </div>

            {/* Authority Actions */}
            <div className="space-y-3">
              {/* Option 1: Automated Send via Gmail API */}
              <div className="p-3 bg-black border border-neutral-800 rounded-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Option 1: Automated Send (Gmail API)</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-xs ${
                    isGoogleConnectedState ? 'text-emerald-400 bg-emerald-950' : 'text-amber-400 bg-amber-950'
                  }`}>
                    {isGoogleConnectedState ? 'Connected' : 'Requires Login'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Directly sends the formatted HTML invoice to the customer from revoraofficial57@gmail.com.
                </p>
                <button
                  type="button"
                  onClick={() => handleSendOrderEmail(emailDispatchModalOrder)}
                  disabled={sendingEmailOrderId === emailDispatchModalOrder.id}
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-2 px-3 rounded-xs font-bold uppercase text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>
                    {sendingEmailOrderId === emailDispatchModalOrder.id
                      ? 'Dispatching Email via Gmail...'
                      : isGoogleConnectedState
                      ? 'Send Email Immediately via Gmail'
                      : 'Connect Google & Send Email'}
                  </span>
                </button>
              </div>

              {/* Option 2: Fail-safe Gmail Web Compose */}
              <div className="p-3 bg-black border border-neutral-800 rounded-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>Option 2: Direct Gmail Web Compose (Fail-safe)</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">Opens in Browser</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Opens Gmail in a new tab with customer email, subject, items, and address pre-populated. 100% reliable even if popups are blocked.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = generateGmailWebComposeUrl(emailDispatchModalOrder);
                      window.open(url, '_blank');
                    }}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white py-2 px-3 rounded-xs font-bold uppercase text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>Open in Web Gmail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkEmailSentManually(emailDispatchModalOrder)}
                    className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-emerald-300 text-xs rounded-xs font-bold uppercase cursor-pointer"
                    title="Mark order as having email dispatched"
                  >
                    Mark Sent ✓
                  </button>
                </div>
              </div>

              {/* Option 3: Copy Text & Close */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyEmailText(emailDispatchModalOrder)}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 py-2 rounded-xs font-bold uppercase text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedOrderId === emailDispatchModalOrder.id ? 'Copied to Clipboard!' : 'Copy Email Body'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmailDispatchModalOrder(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xs uppercase font-bold text-[11px] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
