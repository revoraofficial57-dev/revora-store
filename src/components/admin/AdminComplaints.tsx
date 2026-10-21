import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useStore } from '../../context/StoreContext';
import { CustomerComplaint } from '../../types';
import {
  getAllComplaints,
  addComplaintReply,
  updateComplaintStatus,
  deleteComplaint,
} from '../../services/storage';
import {
  Search,
  MessageSquare,
  Trash2,
  Send,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  ShoppingBag,
  User,
  Paperclip,
} from 'lucide-react';

export const AdminComplaints: React.FC = () => {
  const { username } = useAdmin();
  const { showToast } = useStore();

  const [complaints, setComplaints] = useState<CustomerComplaint[]>(() => getAllComplaints());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Selected complaint for modal details & replying
  const [selectedComplaint, setSelectedComplaint] = useState<CustomerComplaint | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [newStatus, setNewStatus] = useState<CustomerComplaint['status']>('In Review');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const reloadComplaints = () => {
    const list = getAllComplaints();
    setComplaints(list);
    if (selectedComplaint) {
      const refreshed = list.find((c) => c.id === selectedComplaint.id);
      setSelectedComplaint(refreshed || null);
    }
  };

  const handleOpenDetails = (c: CustomerComplaint) => {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setInternalNotes(c.internalNotes || '');
    setAdminReplyText('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !adminReplyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      addComplaintReply(selectedComplaint.id, {
        sender: 'Admin',
        senderName: `REVORA Support (${username})`,
        message: adminReplyText.trim(),
      });

      // Auto update status to In Review or Awaiting Customer if it was New
      if (selectedComplaint.status === 'New') {
        updateComplaintStatus(selectedComplaint.id, 'In Review');
      }

      reloadComplaints();
      setAdminReplyText('');
      setIsSubmittingReply(false);
      showToast('Reply dispatched to customer ticket.');
    } catch (err: any) {
      setIsSubmittingReply(false);
      alert(err.message || 'Error sending reply');
    }
  };

  const handleUpdateStatusAndNotes = () => {
    if (!selectedComplaint) return;
    try {
      updateComplaintStatus(selectedComplaint.id, newStatus, internalNotes.trim());
      reloadComplaints();
      showToast(`Complaint status updated to ${newStatus}`);
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleDelete = (id: string, ticketNumber: string) => {
    if (window.confirm(`Are you sure you want to permanently delete complaint ticket ${ticketNumber}?`)) {
      deleteComplaint(id);
      if (selectedComplaint?.id === id) {
        setSelectedComplaint(null);
      }
      reloadComplaints();
      showToast(`Complaint ${ticketNumber} deleted.`);
    }
  };

  const filtered = complaints.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTicket = c.ticketNumber.toLowerCase().includes(q);
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchPhone = c.phone.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchOrder = (c.orderId || '').toLowerCase().includes(q);
      if (!matchTicket && !matchName && !matchPhone && !matchEmail && !matchOrder) return false;
    }

    return true;
  });

  const getStatusBadge = (status: CustomerComplaint['status']) => {
    switch (status) {
      case 'New':
        return <span className="bg-blue-900/60 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-xs text-[10px] font-bold">NEW</span>;
      case 'In Review':
        return <span className="bg-amber-900/60 text-amber-300 border border-amber-700 px-2 py-0.5 rounded-xs text-[10px] font-bold">IN REVIEW</span>;
      case 'Awaiting Customer':
        return <span className="bg-purple-900/60 text-purple-300 border border-purple-700 px-2 py-0.5 rounded-xs text-[10px] font-bold">AWAITING CUSTOMER</span>;
      case 'Resolved':
        return <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-xs text-[10px] font-bold">RESOLVED</span>;
      case 'Closed':
        return <span className="bg-neutral-800 text-neutral-400 border border-neutral-700 px-2 py-0.5 rounded-xs text-[10px] font-bold">CLOSED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white uppercase font-display flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-red-500" />
            <span>Complaints & Support Portal</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400">
            {complaints.length} registered customer dispute(s) and inquiries
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket #, customer, order ID..."
              className="bg-neutral-900 border border-neutral-800 text-xs pl-8 pr-3 py-2 rounded-xs text-white placeholder-neutral-500 font-mono w-64"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-xs text-neutral-200 font-mono"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="In Review">In Review</option>
            <option value="Awaiting Customer">Awaiting Customer</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-xs text-neutral-200 font-mono"
          >
            <option value="all">All Categories</option>
            <option value="Order Delay">Order Delay</option>
            <option value="Damaged Product">Damaged Product</option>
            <option value="Wrong Item/Size">Wrong Item/Size</option>
            <option value="Payment Issue">Payment Issue</option>
            <option value="Return/Exchange">Return/Exchange</option>
            <option value="General Inquiry">General Inquiry</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xs overflow-x-auto">
        <table className="w-full text-xs font-mono text-left text-neutral-300">
          <thead className="bg-neutral-900 text-neutral-400 uppercase text-[11px] border-b border-neutral-800">
            <tr>
              <th className="p-3">Ticket Reference</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Category</th>
              <th className="p-3">Order Ref</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-500">
                  No complaints match the filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <span>{c.ticketNumber}</span>
                    {c.attachmentUrl && (
                      <span title="Has attachment">
                        <Paperclip className="w-3 h-3 text-amber-400" />
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="text-white font-semibold">{c.fullName}</div>
                    <div className="text-neutral-500 text-[10px]">{c.phone}</div>
                  </td>
                  <td className="p-3">
                    <span className="text-neutral-300">{c.category}</span>
                  </td>
                  <td className="p-3">
                    {c.orderId ? (
                      <span className="text-amber-400 font-semibold">{c.orderId}</span>
                    ) : (
                      <span className="text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="p-3 text-neutral-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {getStatusBadge(c.status)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenDetails(c)}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white px-2.5 py-1 rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title="View and Reply"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage ({c.replies?.length || 0})</span>
                      </button>

                      <button
                        onClick={() => handleDelete(c.id, c.ticketNumber)}
                        className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                        title="Delete ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details & Reply Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 max-w-2xl w-full p-6 sm:p-8 rounded-xs space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-white font-mono">
                    {selectedComplaint.ticketNumber}
                  </span>
                  {getStatusBadge(selectedComplaint.status)}
                </div>
                <div className="text-xs text-neutral-400 font-mono mt-0.5">
                  Category: <strong className="text-white">{selectedComplaint.category}</strong> · Submitted: {new Date(selectedComplaint.createdAt).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer Details Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-900/60 p-3.5 rounded-xs text-xs font-mono border border-neutral-800">
              <div>
                <span className="text-neutral-500 text-[10px] block">CUSTOMER</span>
                <strong className="text-white">{selectedComplaint.fullName}</strong>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block">PHONE</span>
                <span className="text-neutral-200">{selectedComplaint.phone}</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block">EMAIL</span>
                <span className="text-neutral-200">{selectedComplaint.email}</span>
              </div>
              {selectedComplaint.orderId && (
                <div className="sm:col-span-3 pt-2 border-t border-neutral-800/80">
                  <span className="text-neutral-500 text-[10px]">ASSOCIATED ORDER ID:</span>{' '}
                  <strong className="text-amber-400">{selectedComplaint.orderId}</strong>
                </div>
              )}
            </div>

            {/* Customer's Statement */}
            <div className="space-y-1.5 text-xs font-mono">
              <span className="text-neutral-400 font-bold uppercase text-[11px] block">
                Customer Issue Explanation
              </span>
              <div className="bg-neutral-900 p-4 rounded-xs border border-neutral-800 text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {selectedComplaint.description}
              </div>

              {selectedComplaint.attachmentUrl && (
                <div className="pt-2">
                  <span className="text-neutral-500 text-[11px] block mb-1">Customer Attachment:</span>
                  <a
                    href={selectedComplaint.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-amber-400 underline hover:text-amber-300 font-mono"
                  >
                    View Attachment ({selectedComplaint.attachmentName || 'Photo Proof'})
                  </a>
                </div>
              )}
            </div>

            {/* Status Update & Internal Notes Controls */}
            <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-xs space-y-3 text-xs font-mono">
              <span className="text-white font-bold uppercase text-[11px] block">
                Manage Ticket Status & Internal Operations Note
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-700 text-white p-2 rounded-xs"
                  >
                    <option value="New">New</option>
                    <option value="In Review">In Review</option>
                    <option value="Awaiting Customer">Awaiting Customer</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Internal Note (Staff only)</label>
                  <input
                    type="text"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="e.g. Trax priority parcel booked #TRK-1092"
                    className="w-full bg-neutral-900 border border-neutral-700 text-white p-2 rounded-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpdateStatusAndNotes}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-xs font-bold uppercase text-[11px] cursor-pointer"
              >
                Save Status Changes
              </button>
            </div>

            {/* Conversation Log */}
            <div className="space-y-3 text-xs font-mono">
              <span className="text-white font-bold uppercase text-[11px] block">
                Communication History ({selectedComplaint.replies?.length || 0})
              </span>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {(!selectedComplaint.replies || selectedComplaint.replies.length === 0) ? (
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xs text-neutral-500 text-center">
                    No replies recorded yet. Write an official response below.
                  </div>
                ) : (
                  selectedComplaint.replies.map((r) => {
                    const isAdmin = r.sender === 'Admin';
                    return (
                      <div
                        key={r.id}
                        className={`p-3 rounded-xs border space-y-1 ${
                          isAdmin
                            ? 'bg-neutral-900 border-neutral-700 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <strong className={isAdmin ? 'text-amber-400' : 'text-blue-400'}>
                            {r.senderName}
                          </strong>
                          <span className="text-neutral-500 text-[10px]">
                            {new Date(r.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{r.message}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Admin Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t border-neutral-800 text-xs font-mono">
              <label className="block text-white font-bold uppercase text-[11px]">
                Send Official Response to Customer
              </label>
              <textarea
                rows={3}
                required
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                placeholder="Write your official response to the customer. This message will immediately appear in their ticket tracking view..."
                className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-xs text-white placeholder-neutral-500 focus:border-white leading-relaxed"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="bg-white hover:bg-neutral-200 text-black px-5 py-2.5 rounded-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer font-display transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReply ? 'SENDING...' : 'DISPATCH REPLY'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
