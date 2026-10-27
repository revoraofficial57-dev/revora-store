import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAdmin } from '../../context/AdminContext';
import { saveStoreSettings, runRetentionCleanupTask } from '../../services/storage';
import { sendTestGmailEmail, generateOrderEmailHtml } from '../../services/gmailService';
import { getCurrentUser, logoutGoogle } from '../../services/gmailAuth';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import { StoreSettings, BankAccountItem, PaymentMethodType, Order } from '../../types';
import {
  Save,
  Shield,
  Building2,
  Globe,
  Sliders,
  CheckCircle2,
  Plus,
  Trash2,
  Percent,
  DollarSign,
  Mail,
  Send,
  Eye,
  Check,
  X,
  ExternalLink,
  LogOut,
  Lock,
  Key,
  AlertTriangle,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { settings, refreshData, showToast } = useStore();
  const { username: currentAdminUser, isCustomPasswordSet, changePassword } = useAdmin();

  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [retentionResult, setRetentionResult] = useState<{ anonymizedCount: number; evaluatedOrders: number } | null>(null);

  // Gmail Testing State
  const [testEmailRecipient, setTestEmailRecipient] = useState(settings.supportEmail || 'revoraofficial57@gmail.com');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());


  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreSettings(form);
    refreshData();
    showToast('Store settings saved successfully.');
  };

  const handleRunRetentionCleanup = () => {
    const res = runRetentionCleanupTask();
    setRetentionResult(res);
    refreshData();
    showToast(`Retention task completed. Evaluated: ${res.evaluatedOrders}, Anonymized: ${res.anonymizedCount}`);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient.trim()) {
      showToast('Please enter a recipient email address.');
      return;
    }

    setIsSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const res = await sendTestGmailEmail(testEmailRecipient.trim(), form.gmailSettings?.senderEmail || 'revoraofficial57@gmail.com');
      if (res.success) {
        setTestEmailResult({
          success: true,
          message: `Test email successfully dispatched to ${testEmailRecipient} (Message ID: ${res.messageId})`,
        });
        showToast('Gmail test sent successfully!');
      } else {
        setTestEmailResult({
          success: false,
          message: res.error || 'Failed to dispatch test email.',
        });
        showToast(res.error || 'Test email failed. Please connect Google account.');
      }
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: err?.message || 'Error occurred while sending test email.',
      });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setForm({
      ...form,
      gmailSettings: {
        ...(form.gmailSettings || { autoSendOrderEmail: true, senderEmail: 'revoraofficial57@gmail.com' }),
        isConnected: false,
        userEmail: undefined,
      },
    });
    showToast('Signed out of Google account.');
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-neutral-800">
        <h2 className="text-xl font-bold text-white uppercase font-display">
          Central Store Configuration
        </h2>
        <p className="text-xs font-mono text-neutral-400">
          Manage brand credentials, bank payment details, social links, and privacy retention rules
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8 text-xs font-mono">
        {/* Store General Details */}
        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neutral-400" />
            <span>Store Brand Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1">Store Name</label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Tagline</label>
              <input
                type="text"
                value={form.brandTagline}
                onChange={(e) => setForm({ ...form, brandTagline: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Support Email</label>
              <input
                type="email"
                value={form.supportEmail}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">WhatsApp Hotline</label>
              <input
                type="text"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-neutral-400 mb-1">HQ Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
              />
            </div>
          </div>
        </div>

        {/* Store Active Payment Methods (Requirement 5: Up to 3 active methods) */}
        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-neutral-400" />
                <span>Store Active Payment Methods</span>
              </h3>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                Configure up to three active payment methods for the store. Customers will only be able to use enabled methods.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded-xs">
              {(form.activePaymentMethods || []).length} / 3 Methods Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* COD */}
            <div className={`p-4 border rounded-xs transition-colors space-y-3 ${
              (form.activePaymentMethods || []).includes('COD')
                ? 'bg-neutral-900/80 border-white text-white'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase font-display text-xs">Cash on Delivery (COD)</span>
                <input
                  type="checkbox"
                  checked={(form.activePaymentMethods || []).includes('COD')}
                  onChange={(e) => {
                    const current = form.activePaymentMethods || [];
                    if (e.target.checked) {
                      if (current.length >= 3) {
                        alert('You can configure up to three active payment methods.');
                        return;
                      }
                      setForm({ ...form, activePaymentMethods: [...current, 'COD'] });
                    } else {
                      if (current.length <= 1) {
                        alert('At least one payment method must remain active.');
                        return;
                      }
                      setForm({ ...form, activePaymentMethods: current.filter((m) => m !== 'COD') });
                    }
                  }}
                  className="accent-white cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Customers pay cash to the rider upon parcel arrival at doorstep. Available nationwide.
              </p>
            </div>

            {/* Bank Transfer */}
            <div className={`p-4 border rounded-xs transition-colors space-y-3 ${
              (form.activePaymentMethods || []).includes('BANK_TRANSFER')
                ? 'bg-neutral-900/80 border-white text-white'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase font-display text-xs">Bank Transfer</span>
                <input
                  type="checkbox"
                  checked={(form.activePaymentMethods || []).includes('BANK_TRANSFER')}
                  onChange={(e) => {
                    const current = form.activePaymentMethods || [];
                    if (e.target.checked) {
                      if (current.length >= 3) {
                        alert('You can configure up to three active payment methods.');
                        return;
                      }
                      setForm({ ...form, activePaymentMethods: [...current, 'BANK_TRANSFER'] });
                    } else {
                      if (current.length <= 1) {
                        alert('At least one payment method must remain active.');
                        return;
                      }
                      setForm({ ...form, activePaymentMethods: current.filter((m) => m !== 'BANK_TRANSFER') });
                    }
                  }}
                  className="accent-white cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Direct Meezan Bank, Raast, or Nayapay IBAN transfer. Requires receipt upload at checkout.
              </p>
            </div>

            {/* Online Payment */}
            <div className={`p-4 border rounded-xs transition-colors space-y-3 ${
              (form.activePaymentMethods || []).includes('ONLINE')
                ? 'bg-neutral-900/80 border-white text-white'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase font-display text-xs">Online Payment Gateway</span>
                <input
                  type="checkbox"
                  checked={(form.activePaymentMethods || []).includes('ONLINE')}
                  onChange={(e) => {
                    const current = form.activePaymentMethods || [];
                    if (e.target.checked) {
                      if (current.length >= 3) {
                        alert('You can configure up to three active payment methods.');
                        return;
                      }
                      setForm({ ...form, activePaymentMethods: [...current, 'ONLINE'] });
                    } else {
                      if (current.length <= 1) {
                        alert('At least one payment method must remain active.');
                        return;
                      }
                      setForm({ ...form, activePaymentMethods: current.filter((m) => m !== 'ONLINE') });
                    }
                  }}
                  className="accent-white cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Card, Raast instant QR, or digital gateway. Fallback options displayed if gateway unavailable.
              </p>
            </div>
          </div>
        </div>

        {/* Bank Transfer Accounts (Up to 3 Accounts) */}
        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-neutral-400" />
                <span>Bank Transfer Accounts Management (Max 3 Accounts)</span>
              </h3>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                Configure up to three separate official bank accounts. Customers choose which account to transfer funds to at checkout.
              </p>
            </div>

            <button
              type="button"
              disabled={(form.bankAccounts || []).length >= 3}
              onClick={() => {
                const current = form.bankAccounts || [];
                if (current.length >= 3) {
                  alert('A maximum of three bank transfer accounts can be configured.');
                  return;
                }
                const newAcc: BankAccountItem = {
                  id: 'bnk-' + Date.now(),
                  bankName: '',
                  accountTitle: '',
                  accountNumber: '',
                  iban: '',
                  branch: '',
                  instructions: 'Transfer required advance or full payment via mobile banking or Raast. Upload screenshot of payment receipt.',
                  isEnabled: true,
                };
                const updated = [...current, newAcc];
                setForm({
                  ...form,
                  bankAccounts: updated,
                  bankInfo: updated[0] ? {
                    bankName: updated[0].bankName,
                    accountTitle: updated[0].accountTitle,
                    accountNumber: updated[0].accountNumber,
                    iban: updated[0].iban || '',
                    branchName: updated[0].branch || '',
                    instructions: updated[0].instructions,
                  } : form.bankInfo,
                });
              }}
              className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 text-xs font-bold uppercase rounded-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bank Account ({(form.bankAccounts || []).length}/3)</span>
            </button>
          </div>

          <div className="space-y-4">
            {(form.bankAccounts || []).map((account, index) => (
              <div
                key={account.id}
                className={`p-4 border rounded-xs space-y-4 transition-colors ${
                  account.isEnabled ? 'bg-neutral-900/50 border-neutral-700' : 'bg-neutral-950 border-neutral-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-neutral-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <strong className="text-white text-xs font-display uppercase">
                      {account.bankName || `Bank Account #${index + 1}`}
                    </strong>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={account.isEnabled}
                        onChange={(e) => {
                          const updated = (form.bankAccounts || []).map((acc) =>
                            acc.id === account.id ? { ...acc, isEnabled: e.target.checked } : acc
                          );
                          setForm({ ...form, bankAccounts: updated });
                        }}
                        className="accent-white cursor-pointer"
                      />
                      <span className={account.isEnabled ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>
                        {account.isEnabled ? 'Active & Visible at Checkout' : 'Disabled'}
                      </span>
                    </label>

                    {(form.bankAccounts || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (form.bankAccounts || []).filter((acc) => acc.id !== account.id);
                          setForm({ ...form, bankAccounts: updated });
                        }}
                        className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                        title="Remove Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Bank Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Meezan Bank Limited"
                      value={account.bankName}
                      onChange={(e) => {
                        const updated = (form.bankAccounts || []).map((acc) =>
                          acc.id === account.id ? { ...acc, bankName: e.target.value } : acc
                        );
                        setForm({ ...form, bankAccounts: updated });
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white p-2 rounded-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. REVORA APPAREL LAB PVT LTD"
                      value={account.accountTitle}
                      onChange={(e) => {
                        const updated = (form.bankAccounts || []).map((acc) =>
                          acc.id === account.id ? { ...acc, accountTitle: e.target.value } : acc
                        );
                        setForm({ ...form, bankAccounts: updated });
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white p-2 rounded-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 02840108920192"
                      value={account.accountNumber}
                      onChange={(e) => {
                        const updated = (form.bankAccounts || []).map((acc) =>
                          acc.id === account.id ? { ...acc, accountNumber: e.target.value } : acc
                        );
                        setForm({ ...form, bankAccounts: updated });
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white p-2 rounded-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">IBAN (Where applicable)</label>
                    <input
                      type="text"
                      placeholder="e.g. PK45MEZN0002840108920192"
                      value={account.iban || ''}
                      onChange={(e) => {
                        const updated = (form.bankAccounts || []).map((acc) =>
                          acc.id === account.id ? { ...acc, iban: e.target.value } : acc
                        );
                        setForm({ ...form, bankAccounts: updated });
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white p-2 rounded-xs font-mono uppercase"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-neutral-400 text-[11px] mb-1">Branch / Location Details</label>
                    <input
                      type="text"
                      placeholder="e.g. Main Boulevard Gulberg Branch, Lahore"
                      value={account.branch || ''}
                      onChange={(e) => {
                        const updated = (form.bankAccounts || []).map((acc) =>
                          acc.id === account.id ? { ...acc, branch: e.target.value } : acc
                        );
                        setForm({ ...form, bankAccounts: updated });
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white p-2 rounded-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-neutral-400 text-[11px] mb-1">Payment Instructions to Customer</label>
                    <textarea
                      rows={2}
                      placeholder="Instructions shown to customer when selecting this account..."
                      value={account.instructions}
                      onChange={(e) => {
                        const updated = (form.bankAccounts || []).map((acc) =>
                          acc.id === account.id ? { ...acc, instructions: e.target.value } : acc
                        );
                        setForm({ ...form, bankAccounts: updated });
                      }}
                      className="w-full bg-neutral-900 border border-neutral-800 text-white p-2 rounded-xs text-[11px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partial Payments Configuration Module */}
        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" />
                <span>Partial Advance Payments Configuration</span>
              </h3>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                Enable customers to pay a configured percentage advance to secure orders with the remainder payable at delivery.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 px-3 py-1.5 rounded-xs border border-neutral-800">
              <input
                type="checkbox"
                checked={form.partialPayment?.enabled ?? false}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partialPayment: {
                      ...(form.partialPayment || {
                        advancePercentage: 50,
                        minAdvanceAmount: 500,
                        maxAdvanceAmount: 10000,
                        allowCodPartialPayment: true,
                        remainingBalanceDueWhen: 'Payable in cash upon doorstep delivery',
                        instructions: 'Pay 50% advance to confirm booking. Remaining balance payable at delivery.',
                        allowedMethods: ['COD', 'BANK_TRANSFER', 'ONLINE'],
                      }),
                      enabled: e.target.checked,
                    },
                  })
                }
                className="accent-white cursor-pointer"
              />
              <span className={form.partialPayment?.enabled ? 'text-emerald-400 font-bold text-xs' : 'text-neutral-500 text-xs'}>
                {form.partialPayment?.enabled ? 'Partial Payments Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1">Advance Payment Percentage (%) *</label>
              <input
                type="number"
                min={1}
                max={99}
                value={form.partialPayment?.advancePercentage ?? 50}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partialPayment: {
                      ...form.partialPayment,
                      advancePercentage: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs font-mono font-bold"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Configurable percentage e.g. 50%, 30%, 25%</p>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Minimum Advance Amount (PKR) *</label>
              <input
                type="number"
                min={0}
                value={form.partialPayment?.minAdvanceAmount ?? 500}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partialPayment: {
                      ...form.partialPayment,
                      minAdvanceAmount: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs font-mono"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Lower cap on advance requirement</p>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Maximum Advance Cap (PKR - Optional)</label>
              <input
                type="number"
                min={0}
                value={form.partialPayment?.maxAdvanceAmount ?? 10000}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partialPayment: {
                      ...form.partialPayment,
                      maxAdvanceAmount: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs font-mono"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Leave empty or set maximum ceiling</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-neutral-400 mb-1">When Remaining Balance Must Be Paid</label>
              <input
                type="text"
                value={form.partialPayment?.remainingBalanceDueWhen || 'Payable in cash upon doorstep delivery'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partialPayment: {
                      ...form.partialPayment,
                      remainingBalanceDueWhen: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Payable in cash upon doorstep delivery"
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Payment Methods Supporting Advance</label>
              <div className="flex flex-col gap-1.5 pt-1 text-xs">
                {(['COD', 'BANK_TRANSFER', 'ONLINE'] as PaymentMethodType[]).map((m) => {
                  const allowed = form.partialPayment?.allowedMethods || ['COD', 'BANK_TRANSFER', 'ONLINE'];
                  const isChecked = allowed.includes(m);
                  return (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const nextMethods = e.target.checked
                            ? [...allowed, m]
                            : allowed.filter((item) => item !== m);
                          setForm({
                            ...form,
                            partialPayment: {
                              ...form.partialPayment,
                              allowedMethods: nextMethods,
                            },
                          });
                        }}
                        className="accent-white cursor-pointer"
                      />
                      <span className="text-neutral-300 font-mono text-[11px]">{m}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-neutral-400 mb-1">Partial Payment Instructions to Customer</label>
              <textarea
                rows={2}
                value={form.partialPayment?.instructions || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    partialPayment: {
                      ...form.partialPayment,
                      instructions: e.target.value,
                    },
                  })
                }
                placeholder="Clear instructions displayed during checkout explaining advance deposit & delivery payment..."
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
              />
            </div>
          </div>

          {/* Dynamic Example Calculation Preview */}
          <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xs space-y-2">
            <span className="text-white font-bold uppercase text-[11px] block text-amber-300">
              ⚡ Real-Time Dynamic Calculation Preview (Sample Order PKR 4,000)
            </span>
            {(() => {
              const sampleTotal = 4000;
              const pct = form.partialPayment?.advancePercentage || 50;
              const calcAdv = Math.round((sampleTotal * pct) / 100);
              const minAdv = form.partialPayment?.minAdvanceAmount || 500;
              const maxAdv = form.partialPayment?.maxAdvanceAmount;
              let finalAdv = Math.max(minAdv, calcAdv);
              if (maxAdv && finalAdv > maxAdv) finalAdv = maxAdv;
              if (finalAdv > sampleTotal) finalAdv = sampleTotal;
              const rem = sampleTotal - finalAdv;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1 text-neutral-300">
                  <div className="bg-black/60 p-2.5 border border-neutral-800 rounded-xs">
                    <span className="text-neutral-500 text-[10px] block">TOTAL ORDER AMOUNT</span>
                    <strong className="text-white text-sm">Rs. {sampleTotal.toLocaleString()}</strong>
                  </div>
                  <div className="bg-black/60 p-2.5 border border-emerald-900/60 rounded-xs">
                    <span className="text-emerald-400 text-[10px] block">ADVANCE DUE NOW ({pct}%)</span>
                    <strong className="text-emerald-300 text-sm">Rs. {finalAdv.toLocaleString()}</strong>
                  </div>
                  <div className="bg-black/60 p-2.5 border border-neutral-800 rounded-xs">
                    <span className="text-amber-400 text-[10px] block">REMAINING BALANCE DUE AT DELIVERY</span>
                    <strong className="text-amber-300 text-sm">Rs. {rem.toLocaleString()}</strong>
                  </div>
                </div>
              );
            })()}
            <p className="text-[10px] text-neutral-500">
              Timing: {form.partialPayment?.remainingBalanceDueWhen || 'Payable at delivery'}
            </p>
          </div>
        </div>

        {/* Gmail & Automated Order Email Center */}
        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider flex items-center gap-2 flex-wrap">
                  <span>Gmail & Automated Order Email Integration</span>
                  {currentUser ? (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-xs flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      Connected: {currentUser.email}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-xs">
                      OAuth Ready
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Sends customer order confirmations, receipts, and payment instructions via Google Workspace Gmail API.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTemplatePreview(true)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-xs text-xs font-mono cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Template</span>
              </button>

              {!currentUser ? (
                <GoogleSignInButton
                  variant="compact"
                  buttonText="Connect Google Account"
                  onSuccess={(userEmail) => {
                    const u = getCurrentUser();
                    setCurrentUser(u);
                    setForm({
                      ...form,
                      gmailSettings: {
                        ...(form.gmailSettings || { autoSendOrderEmail: true, senderEmail: 'revoraofficial57@gmail.com' }),
                        isConnected: true,
                        userEmail,
                        lastConnectedAt: new Date().toISOString(),
                      },
                    });
                    showToast('Google account connected with Gmail authorization!');
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 rounded-xs text-xs font-mono cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1">Store Sender / Support Email</label>
              <input
                type="email"
                value={form.gmailSettings?.senderEmail || form.supportEmail || 'revoraofficial57@gmail.com'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    supportEmail: e.target.value,
                    gmailSettings: {
                      ...(form.gmailSettings || { autoSendOrderEmail: true, isConnected: Boolean(currentUser) }),
                      senderEmail: e.target.value,
                    },
                  })
                }
                placeholder="revoraofficial57@gmail.com"
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs font-mono"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Official store email address (revoraofficial57@gmail.com)
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <label className="block text-neutral-400 mb-2">Automated Order Email Trigger</label>
              <label className="flex items-center gap-2 cursor-pointer bg-neutral-900 p-2.5 rounded-xs border border-neutral-800">
                <input
                  type="checkbox"
                  checked={form.gmailSettings?.autoSendOrderEmail !== false}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      gmailSettings: {
                        ...(form.gmailSettings || { senderEmail: 'revoraofficial57@gmail.com', isConnected: Boolean(currentUser) }),
                        autoSendOrderEmail: e.target.checked,
                      },
                    })
                  }
                  className="accent-white cursor-pointer"
                />
                <span className="text-white text-xs font-bold font-display uppercase">
                  Auto-send order email on customer checkout
                </span>
              </label>
            </div>
          </div>

          {/* Real-Time Live Gmail Test Dispatch Box */}
          <div className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold uppercase text-[11px] block text-emerald-400 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Gmail API Integration in Real-Time</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                Verifies REST API send authorization
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="Enter recipient email (e.g. revoraofficial57@gmail.com)"
                className="flex-1 bg-black border border-neutral-700 text-white p-2 rounded-xs text-xs font-mono focus:outline-none focus:border-white"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 text-xs font-bold uppercase rounded-xs cursor-pointer flex items-center justify-center gap-2 font-display"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTestEmail ? 'Sending...' : 'Send Test Verification Email'}</span>
              </button>
            </div>

            {testEmailResult && (
              <div
                className={`p-3 text-xs rounded-xs font-mono flex items-start gap-2 ${
                  testEmailResult.success
                    ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                    : 'bg-red-950/80 border border-red-800 text-red-300'
                }`}
              >
                {testEmailResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{testEmailResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-neutral-400" />
            <span>Social Channels & Paddock Links</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1">Instagram URL</label>
              <input
                type="url"
                value={form.socialLinks.instagram}
                onChange={(e) =>
                  setForm({ ...form, socialLinks: { ...form.socialLinks, instagram: e.target.value } })
                }
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Facebook URL</label>
              <input
                type="url"
                value={form.socialLinks.facebook}
                onChange={(e) =>
                  setForm({ ...form, socialLinks: { ...form.socialLinks, facebook: e.target.value } })
                }
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">TikTok URL</label>
              <input
                type="url"
                value={form.socialLinks.tiktok}
                onChange={(e) =>
                  setForm({ ...form, socialLinks: { ...form.socialLinks, tiktok: e.target.value } })
                }
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">YouTube URL</label>
              <input
                type="url"
                value={form.socialLinks.youtube}
                onChange={(e) =>
                  setForm({ ...form, socialLinks: { ...form.socialLinks, youtube: e.target.value } })
                }
                className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
              />
            </div>
          </div>
        </div>

        {/* 5-Day Customer Account Retention Policy */}
        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>5-Day Customer Data Retention Policy</span>
            </h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2 py-0.5 rounded-xs">
              Automated Policy Enabled
            </span>
          </div>

          <p className="text-neutral-400 text-xs leading-relaxed">
            As required by our store privacy policies: When an order is marked Delivered, personal address records and payment slips are automatically scheduled for anonymization 5 days after delivery. Tax records and financial totals are retained.
          </p>

          <div className="pt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={handleRunRetentionCleanup}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-xs text-xs font-mono cursor-pointer"
            >
              Execute Retention Task Now (Test Clock)
            </button>
            {retentionResult && (
              <span className="text-emerald-400 text-xs">
                Evaluated: {retentionResult.evaluatedOrders} orders · Anonymized: {retentionResult.anonymizedCount} records
              </span>
            )}
          </div>
        </div>

        {/* Administrator Portal Security Status */}
        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Administrator Master Authentication</span>
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Master administrator access is locked and active for account <strong className="text-white">Revora@4862442$$</strong>.
              </p>

            </div>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-xs flex items-center gap-1.5 w-fit">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Master Security Protocol Active</span>
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">
            Direct credential authentication is enabled. Password alteration functions have been disabled to prevent accidental lockouts.
          </p>
        </div>

        <button
          type="submit"
          className="bg-white hover:bg-neutral-200 text-black px-6 py-3 text-xs font-bold uppercase rounded-xs flex items-center gap-2 font-display transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </form>

      {/* Template Preview Modal */}
      {showTemplatePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white text-neutral-900 rounded-xs max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-neutral-300">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-black" />
                <span className="font-bold text-xs uppercase font-display text-black">
                  Revora Official Gmail Order Confirmation Template
                </span>
              </div>
              <button
                onClick={() => setShowTemplatePreview(false)}
                className="p-1 hover:bg-neutral-200 rounded-xs cursor-pointer text-neutral-600 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[70vh] bg-neutral-100">
              <div
                className="bg-white shadow-xs rounded-xs overflow-hidden"
                dangerouslySetInnerHTML={{
                  __html: generateOrderEmailHtml(
                    {
                      id: 'ord-preview-sample',
                      orderNumber: 'REV-1020-8492',
                      customerName: 'Muhammad Hamza',
                      customerEmail: testEmailRecipient || 'hamza.tariq@gmail.com',
                      customerPhone: '0300 1234567',
                      shippingAddress: {
                        fullName: 'Muhammad Hamza',
                        phone: '0300 1234567',
                        email: testEmailRecipient || 'hamza.tariq@gmail.com',
                        address: 'House #42, Street 7, Sector Y, DHA Phase 3',
                        city: 'Lahore',
                        area: 'DHA Phase 3',
                        province: 'Punjab',
                      },
                      items: [
                        {
                          productId: 'prod-01',
                          variantId: 'var-01',
                          productName: 'RPM Tachometer 9000 Heavyweight Hoodie',
                          designName: 'RPM Redline 9000',
                          clothingType: 'Hoodie',
                          size: 'L',
                          color: 'Pitch Black',
                          sku: 'RPM-HOOD-BLK-L',
                          price: 4500,
                          quantity: 1,
                          image: '',
                        },
                      ],
                      subtotal: 4500,
                      discount: 0,
                      deliveryFee: 0,
                      total: 4500,
                      isPartialPayment: form.partialPayment?.enabled || false,
                      advancePercentage: form.partialPayment?.advancePercentage || 50,
                      advanceAmount: Math.round((4500 * (form.partialPayment?.advancePercentage || 50)) / 100),
                      amountReceived: 0,
                      remainingBalance: 4500 - Math.round((4500 * (form.partialPayment?.advancePercentage || 50)) / 100),
                      remainingBalanceDueWhen: form.partialPayment?.remainingBalanceDueWhen || 'Payable upon doorstep courier delivery',
                      selectedBankAccountName: 'Meezan Bank Limited',
                      currency: 'PKR',
                      paymentMethod: 'BANK_TRANSFER',
                      paymentStatus: 'Advance Pending Verification',
                      orderStatus: 'Confirmed',
                      statusHistory: [],
                      createdAt: new Date().toISOString(),
                    },
                    form.gmailSettings?.senderEmail || form.supportEmail || 'revoraofficial57@gmail.com'
                  ),
                }}
              />
            </div>

            <div className="p-4 border-t border-neutral-200 flex items-center justify-between bg-white text-xs font-mono">
              <span className="text-neutral-500">
                Live rendered luxury responsive layout
              </span>
              <button
                type="button"
                onClick={() => setShowTemplatePreview(false)}
                className="bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-xs font-bold uppercase cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
