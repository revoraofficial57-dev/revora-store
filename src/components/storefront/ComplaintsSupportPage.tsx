import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CustomerComplaint } from '../../types';
import {
  getComplaintByTicket,
  addComplaintReply,
} from '../../services/storage';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Search,
  Upload,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Phone,
  Mail,
  FileText,
  User,
  ShoppingBag,
} from 'lucide-react';

interface ComplaintsSupportPageProps {
  onNavigateHome: () => void;
  onExploreProducts: () => void;
}

export const ComplaintsSupportPage: React.FC<ComplaintsSupportPageProps> = ({
  onNavigateHome,
  onExploreProducts,
}) => {
  const { submitComplaint, formatPKR, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  // Submit form state
  const [fullName, setFullName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<CustomerComplaint['category']>('Order Delay');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessTicket, setSubmitSuccessTicket] = useState<CustomerComplaint | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Track ticket state
  const [trackTicketNumber, setTrackTicketNumber] = useState('');
  const [trackContact, setTrackContact] = useState('');
  const [trackedComplaint, setTrackedComplaint] = useState<CustomerComplaint | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Customer reply state
  const [customerReplyMsg, setCustomerReplyMsg] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('File exceeds 8MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        url: reader.result as string,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    const cleanedPhone = phone.replace(/[\s-]/g, '');
    if (!cleanedPhone || cleanedPhone.length < 10) {
      setFormError('Please enter a valid Pakistani contact phone number (e.g. 0300 1234567).');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!description.trim() || description.trim().length < 15) {
      setFormError('Please describe your issue in detail (minimum 15 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const newComplaint = await submitComplaint({
        fullName: fullName.trim(),
        orderId: orderId.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        category,
        description: description.trim(),
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.name,
      });

      setSubmitSuccessTicket(newComplaint);
      setIsSubmitting(false);
      showToast(`Complaint logged: ${newComplaint.ticketNumber}`);
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || 'Failed to submit complaint. Please check your connection.');
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackedComplaint(null);

    if (!trackTicketNumber.trim() && !trackContact.trim()) {
      setTrackError('Please enter either your Ticket Reference Number OR your Phone Number / Email.');
      return;
    }

    setIsSearching(true);
    const found = getComplaintByTicket(trackTicketNumber.trim(), trackContact.trim());
    setIsSearching(false);

    if (!found) {
      setTrackError(
        'No complaint ticket found matching the provided details. Please check the reference code or phone/email.'
      );
    } else {
      setTrackedComplaint(found);
    }
  };

  const handleSendCustomerReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedComplaint || !customerReplyMsg.trim()) return;

    setIsReplying(true);
    try {
      const updated = addComplaintReply(trackedComplaint.id, {
        sender: 'Customer',
        senderName: trackedComplaint.fullName,
        message: customerReplyMsg.trim(),
      });
      setTrackedComplaint(updated);
      setCustomerReplyMsg('');
      setIsReplying(false);
      showToast('Your message was added to the ticket thread.');
    } catch (err: any) {
      setIsReplying(false);
      alert(err.message || 'Failed to post reply');
    }
  };

  const getStatusBadge = (status: CustomerComplaint['status']) => {
    switch (status) {
      case 'New':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase">
            New Ticket
          </span>
        );
      case 'In Review':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase">
            In Review / Investigating
          </span>
        );
      case 'Awaiting Customer':
        return (
          <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase">
            Awaiting Customer Response
          </span>
        );
      case 'Resolved':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase">
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="bg-neutral-200 text-neutral-800 border border-neutral-300 px-2.5 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="py-12 bg-neutral-50 min-h-screen text-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb & Heading */}
        <div className="space-y-3 border-b border-neutral-200 pb-6">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <button onClick={onNavigateHome} className="hover:text-black cursor-pointer">
              Home
            </button>
            <span>/</span>
            <span className="text-black font-semibold">Complaints & Support Portal</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-black uppercase font-display tracking-tight flex items-center gap-3">
                <ShieldAlert className="w-7 h-7 text-red-600" />
                <span>Complaints & Support Portal</span>
              </h1>
              <p className="text-xs font-mono text-neutral-600 mt-1 max-w-xl">
                Official dispute and inquiry channel. Every complaint is logged with an immutable reference ID and assigned directly to the REVORA operations team.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://wa.me/923294862442"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xs text-xs font-mono uppercase font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Direct WhatsApp Desk</span>
              </a>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 bg-white rounded-t-xs p-1">
          <button
            onClick={() => {
              setActiveTab('submit');
              setSubmitSuccessTicket(null);
            }}
            className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs transition-all cursor-pointer ${
              activeTab === 'submit'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Submit a New Complaint</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs transition-all cursor-pointer ${
              activeTab === 'track'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Track Existing Ticket</span>
          </button>
        </div>

        {/* TAB 1: SUBMIT NEW COMPLAINT */}
        {activeTab === 'submit' && (
          <div className="bg-white border border-neutral-200 rounded-b-xs p-6 sm:p-8 space-y-6 shadow-xs">
            {submitSuccessTicket ? (
              <div className="space-y-6 py-4">
                <div className="bg-emerald-50 border border-emerald-300 p-6 rounded-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-black uppercase font-display">
                        Complaint Registered Successfully
                      </h3>
                      <p className="text-xs font-mono text-emerald-900 mt-0.5">
                        Your issue has been assigned an official reference tracking code.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 border border-emerald-200 rounded-xs space-y-2 font-mono text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-neutral-100">
                      <span className="text-neutral-500 text-[11px]">COMPLAINT REFERENCE NUMBER:</span>
                      <strong className="text-base text-black font-extrabold tracking-wider">
                        {submitSuccessTicket.ticketNumber}
                      </strong>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-neutral-500">Customer:</span>{' '}
                        <span className="text-black font-semibold">{submitSuccessTicket.fullName}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Contact:</span>{' '}
                        <span className="text-black font-semibold">{submitSuccessTicket.phone}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Category:</span>{' '}
                        <span className="text-black font-semibold">{submitSuccessTicket.category}</span>
                      </div>
                      {submitSuccessTicket.orderId && (
                        <div>
                          <span className="text-neutral-500">Associated Order:</span>{' '}
                          <span className="text-black font-semibold">{submitSuccessTicket.orderId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-mono text-neutral-600 leading-relaxed">
                    Our senior fulfillment representative will inspect the complaint and post updates within <strong>2 to 4 business hours</strong>. You can check the resolution status at any time by entering your ticket number <strong>{submitSuccessTicket.ticketNumber}</strong> in the Track Existing Ticket tab.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => {
                      setTrackTicketNumber(submitSuccessTicket.ticketNumber);
                      setTrackContact(submitSuccessTicket.phone);
                      setActiveTab('track');
                      const found = getComplaintByTicket(
                        submitSuccessTicket.ticketNumber,
                        submitSuccessTicket.phone
                      );
                      if (found) setTrackedComplaint(found);
                    }}
                    className="flex-1 bg-black hover:bg-neutral-800 text-white py-3 px-4 text-xs font-bold uppercase rounded-xs font-display flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>View Ticket Status Thread</span>
                  </button>

                  <button
                    onClick={() => {
                      setSubmitSuccessTicket(null);
                      setFullName('');
                      setOrderId('');
                      setPhone('');
                      setEmail('');
                      setDescription('');
                      setAttachment(null);
                    }}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 py-3 px-4 text-xs font-bold uppercase rounded-xs font-display flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Log Another Inquiry</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-xs font-mono">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-neutral-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Zain Ul Abideen"
                        className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xs text-black placeholder-neutral-400 focus:border-black focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      Order Reference ID (Optional)
                    </label>
                    <div className="relative">
                      <ShoppingBag className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                      <input
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="e.g. REV-0228-8921"
                        className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xs text-black placeholder-neutral-400 focus:border-black focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="03xx xxxxxxx or +92 3xx xxxxxxx"
                        className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xs text-black placeholder-neutral-400 focus:border-black focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xs text-black placeholder-neutral-400 focus:border-black focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-neutral-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      Complaint Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xs text-black focus:border-black focus:bg-white"
                    >
                      <option value="Order Delay">Order Delay / Courier Tracking Issue</option>
                      <option value="Damaged Product">Damaged or Defective Apparel Received</option>
                      <option value="Wrong Item/Size">Wrong Item, Silhouette, or Size Dispatched</option>
                      <option value="Payment Issue">Payment Verification / Advance Receipt Discrepancy</option>
                      <option value="Return/Exchange">7-Day Size Exchange or Replacement Request</option>
                      <option value="General Inquiry">General Product, Sizing, or Paddock Inquiry</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-neutral-700 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                      Issue Explanation & Details *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please clearly describe the issue, what happened, and how our support desk can assist you..."
                      className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xs text-black placeholder-neutral-400 focus:border-black focus:bg-white leading-relaxed"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[11px]">
                      Attach Image or Proof (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="bg-neutral-900 hover:bg-black text-white px-4 py-2.5 rounded-xs cursor-pointer flex items-center gap-2 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File (JPG, PNG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-neutral-500">
                        Max 8MB. Helpful for damaged item claims or payment receipts.
                      </span>
                    </div>

                    {attachment && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xs flex items-center justify-between text-xs">
                        <span className="font-mono truncate">{attachment.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachment(null)}
                          className="text-red-600 hover:text-red-800 text-[11px] font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-[11px] text-neutral-500">
                    Your complaint reference ID will be generated immediately upon submission.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-black hover:bg-neutral-800 text-white px-8 py-3.5 rounded-xs font-bold uppercase tracking-wider font-display flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                  >
                    <span>{isSubmitting ? 'LOGGING COMPLAINT...' : 'SUBMIT OFFICIAL COMPLAINT'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: TRACK EXISTING TICKET */}
        {activeTab === 'track' && (
          <div className="bg-white border border-neutral-200 rounded-b-xs p-6 sm:p-8 space-y-8 shadow-xs">
            {/* Search Input Box */}
            <form onSubmit={handleTrackSubmit} className="space-y-4 max-w-xl">
              <div>
                <h3 className="font-display font-bold text-black uppercase text-sm">
                  Track Your Ticket Status & Resolution
                </h3>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  Enter your complaint reference code along with the phone or email provided during submission.
                </p>
              </div>

              {trackError && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xs text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{trackError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">
                    Ticket Reference # (Optional if Phone/Email provided)
                  </label>
                  <input
                    type="text"
                    value={trackTicketNumber}
                    onChange={(e) => setTrackTicketNumber(e.target.value)}
                    placeholder="e.g. REV-CMP-1042"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xs text-black placeholder-neutral-400 focus:border-black focus:bg-white uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1">
                    Phone or Email (Optional if Ticket # provided)
                  </label>
                  <input
                    type="text"
                    value={trackContact}
                    onChange={(e) => setTrackContact(e.target.value)}
                    placeholder="e.g. 03214567890 or email"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xs text-black placeholder-neutral-400 focus:border-black focus:bg-white"
                  />
                </div>
              </div>
              <p className="text-[11px] font-mono text-neutral-500">
                * You can search with <strong>either</strong> your Ticket Number or your Phone/Email (both are not required).
              </p>

              <button
                type="submit"
                disabled={isSearching}
                className="bg-black hover:bg-neutral-800 text-white px-6 py-2.5 rounded-xs text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isSearching ? 'SEARCHING...' : 'LOOKUP TICKET STATUS'}</span>
              </button>
            </form>

            {/* Display Found Ticket */}
            {trackedComplaint && (
              <div className="border border-neutral-300 rounded-xs bg-neutral-50 p-6 space-y-6">
                {/* Ticket Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200 gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-black font-mono">
                        {trackedComplaint.ticketNumber}
                      </span>
                      {getStatusBadge(trackedComplaint.status)}
                    </div>
                    <div className="text-xs font-mono text-neutral-500 mt-1">
                      Submitted on {new Date(trackedComplaint.createdAt).toLocaleString()} · Category:{' '}
                      <strong className="text-neutral-800">{trackedComplaint.category}</strong>
                    </div>
                  </div>

                  {trackedComplaint.orderId && (
                    <div className="text-xs font-mono bg-white border border-neutral-200 px-3 py-1.5 rounded-xs">
                      <span className="text-neutral-500">Order ID: </span>
                      <strong className="text-black">{trackedComplaint.orderId}</strong>
                    </div>
                  )}
                </div>

                {/* Complaint Original Summary */}
                <div className="bg-white p-4 border border-neutral-200 rounded-xs space-y-2 text-xs font-mono">
                  <div className="font-bold text-neutral-800 uppercase text-[11px] tracking-wider">
                    Customer Statement
                  </div>
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {trackedComplaint.description}
                  </p>

                  {trackedComplaint.attachmentUrl && (
                    <div className="pt-2 border-t border-neutral-100">
                      <span className="text-neutral-500 text-[10px] block mb-1">ATTACHED PROOF:</span>
                      <a
                        href={trackedComplaint.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-black underline hover:text-neutral-600 font-semibold"
                      >
                        View Attachment ({trackedComplaint.attachmentName || 'Photo Proof'})
                      </a>
                    </div>
                  )}
                </div>

                {/* Live Conversation Replies Thread */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-neutral-600" />
                    <span>Support Ticket Communication Log ({trackedComplaint.replies?.length || 0})</span>
                  </h4>

                  <div className="space-y-3">
                    {(!trackedComplaint.replies || trackedComplaint.replies.length === 0) ? (
                      <div className="p-4 bg-white border border-neutral-200 text-center rounded-xs text-xs font-mono text-neutral-500">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-neutral-400" />
                        Ticket received. Our support officer will post an official reply here shortly.
                      </div>
                    ) : (
                      trackedComplaint.replies.map((reply) => {
                        const isAdmin = reply.sender === 'Admin';
                        return (
                          <div
                            key={reply.id}
                            className={`p-4 rounded-xs border text-xs font-mono space-y-1.5 ${
                              isAdmin
                                ? 'bg-neutral-900 border-neutral-800 text-white ml-0 sm:ml-8'
                                : 'bg-white border-neutral-200 text-neutral-900 mr-0 sm:mr-8'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-bold uppercase text-[11px] ${isAdmin ? 'text-amber-400' : 'text-black'}`}>
                                {reply.senderName || (isAdmin ? 'REVORA Support Desk' : 'Customer')}
                              </span>
                              <span className={`text-[10px] ${isAdmin ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                {new Date(reply.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Customer Add Follow-up Reply Box */}
                {trackedComplaint.status !== 'Closed' ? (
                  <form onSubmit={handleSendCustomerReply} className="space-y-3 pt-2 border-t border-neutral-200">
                    <label className="block text-xs font-mono font-bold text-black uppercase">
                      Post a Follow-up Message to Support Desk
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={customerReplyMsg}
                      onChange={(e) => setCustomerReplyMsg(e.target.value)}
                      placeholder="Type your message, additional tracking info, or question here..."
                      className="w-full p-3 bg-white border border-neutral-300 rounded-xs text-xs font-mono text-black placeholder-neutral-400 focus:border-black"
                    />
                    <button
                      type="submit"
                      disabled={isReplying}
                      className="bg-black hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xs text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isReplying ? 'SENDING...' : 'SEND MESSAGE'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-neutral-200 text-neutral-700 text-xs font-mono rounded-xs">
                    This support ticket has been closed by administration. If you require further assistance, please log a new inquiry.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
