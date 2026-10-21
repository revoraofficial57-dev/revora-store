import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethodType, PaymentProof, Order, BankAccountItem } from '../../types';
import { getAllDeliveryRules, updateOrderEmailStatus } from '../../services/storage';
import { sendOrderConfirmationEmail } from '../../services/gmailService';
import { getCurrentUser } from '../../services/gmailAuth';
import { GoogleSignInButton } from '../common/GoogleSignInButton';
import {
  Building2,
  Upload,
  AlertCircle,
  Truck,
  ArrowRight,
  Lock,
  CreditCard,
  Banknote,
  Check,
  Percent,
  Copy,
  Info,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Zap,
} from 'lucide-react';

interface CheckoutPageProps {
  onOrderSuccess: (order: Order) => void;
  onBackToShop: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onOrderSuccess,
  onBackToShop,
}) => {
  const {
    cart,
    cartSubtotal,
    cartTotal,
    deliveryFee,
    deliveryCity,
    setDeliveryCity,
    deliveryArea,
    setDeliveryArea,
    isFreeDelivery,
    isDeliveryRestricted,
    appliedCouponCode,
    couponDiscount,
    allowedPaymentMethods,
    incompatiblePaymentWarning,
    settings,
    checkoutOrder,
    formatPKR,
    customer,
  } = useStore();

  const [fullName, setFullName] = useState(customer?.fullName || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [address, setAddress] = useState('');

  // Google OAuth user state for Gmail notifications
  const [googleUser, setGoogleUser] = useState(() => getCurrentUser());
  const [gmailNotificationEnabled, setGmailNotificationEnabled] = useState(true);

  // Delivery rules from database for city options
  const [availableDeliveryRules, setAvailableDeliveryRules] = useState(() => getAllDeliveryRules());

  useEffect(() => {
    setAvailableDeliveryRules(getAllDeliveryRules());
  }, []);

  // City dropdown vs manual entry
  const [selectedCityOption, setSelectedCityOption] = useState<string>(deliveryCity || 'Lahore');
  const [manualCity, setManualCity] = useState('');
  const [area, setArea] = useState(deliveryArea || '');

  const [province, setProvince] = useState('Punjab');
  const [postalCode, setPostalCode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Active payment methods intersection
  const storeActiveMethods = settings.activePaymentMethods || ['COD', 'BANK_TRANSFER', 'ONLINE'];
  const usablePaymentMethods = allowedPaymentMethods.filter((m) => storeActiveMethods.includes(m));

  // Payment plan mode: 'COD' (0 advance, 100% on delivery), 'PARTIAL' (advance via bank, rest on delivery), 'BANK_FULL' (100% via bank), 'ONLINE'
  const isPartialPaymentEligible = Boolean(
    settings.partialPayment?.enabled && cartTotal > 0
  );

  const [paymentPlanMode, setPaymentPlanMode] = useState<'COD' | 'PARTIAL' | 'BANK_FULL' | 'ONLINE'>(() => {
    if (usablePaymentMethods.includes('COD')) return 'COD';
    if (isPartialPaymentEligible) return 'PARTIAL';
    if (usablePaymentMethods.includes('BANK_TRANSFER')) return 'BANK_FULL';
    return 'ONLINE';
  });

  // Selected underlying payment method for backend
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>(() => {
    if (usablePaymentMethods.includes('COD')) return 'COD';
    return usablePaymentMethods[0] || 'BANK_TRANSFER';
  });

  // Partial Payment toggle
  const [isPartialPaymentSelected, setIsPartialPaymentSelected] = useState<boolean>(true);

  // Dynamic partial payment calculation
  const advancePercentage = settings.partialPayment?.advancePercentage || 50;
  const minAdvance = settings.partialPayment?.minAdvanceAmount || 500;
  const maxAdvance = settings.partialPayment?.maxAdvanceAmount;

  let computedAdvanceAmount = Math.round((cartTotal * advancePercentage) / 100);
  computedAdvanceAmount = Math.max(minAdvance, computedAdvanceAmount);
  if (maxAdvance && computedAdvanceAmount > maxAdvance) {
    computedAdvanceAmount = maxAdvance;
  }
  if (computedAdvanceAmount > cartTotal) {
    computedAdvanceAmount = cartTotal;
  }

  // Keep selectedPaymentMethod and partial payment state synchronized with plan mode
  const handleSelectPaymentPlan = (plan: 'COD' | 'PARTIAL' | 'BANK_FULL' | 'ONLINE') => {
    setPaymentPlanMode(plan);
    if (plan === 'COD') {
      setSelectedPaymentMethod('COD');
      setIsPartialPaymentSelected(false);
    } else if (plan === 'PARTIAL') {
      // Partial payment uses Bank Transfer or Online to pay the advance
      const methodToUse = usablePaymentMethods.includes('BANK_TRANSFER') ? 'BANK_TRANSFER' : 'ONLINE';
      setSelectedPaymentMethod(methodToUse);
      setIsPartialPaymentSelected(true);
    } else if (plan === 'BANK_FULL') {
      setSelectedPaymentMethod('BANK_TRANSFER');
      setIsPartialPaymentSelected(false);
    } else if (plan === 'ONLINE') {
      setSelectedPaymentMethod('ONLINE');
      setIsPartialPaymentSelected(false);
    }
  };

  // Determine true partial status and precise amounts
  const isActuallyPartial = paymentPlanMode === 'PARTIAL';

  let payableNowAmount = 0;
  let remainingBalanceAmount = 0;

  if (paymentPlanMode === 'COD') {
    // Pure Cash on Delivery: Rs. 0 now, 100% on delivery
    payableNowAmount = 0;
    remainingBalanceAmount = cartTotal;
  } else if (isActuallyPartial) {
    // Partial payment: advance now, balance on delivery
    payableNowAmount = computedAdvanceAmount;
    remainingBalanceAmount = cartTotal - computedAdvanceAmount;
  } else {
    // 100% Upfront (Bank Transfer or Online)
    payableNowAmount = cartTotal;
    remainingBalanceAmount = 0;
  }

  const balanceDueTiming =
    settings.partialPayment?.remainingBalanceDueWhen || 'Payable in cash upon doorstep delivery';

  // Bank accounts list from settings (up to 3 accounts)
  const enabledBankAccounts = (settings.bankAccounts || []).filter((a) => a.isEnabled !== false);
  const effectiveBankAccounts: BankAccountItem[] =
    enabledBankAccounts.length > 0
      ? enabledBankAccounts
      : [
          {
            id: 'bnk-default',
            bankName: settings.bankInfo.bankName || 'Meezan Bank Limited',
            accountTitle: settings.bankInfo.accountTitle || 'REVORA APPAREL LAB PVT LTD',
            accountNumber: settings.bankInfo.accountNumber || '02840108920192',
            iban: settings.bankInfo.iban || 'PK45MEZN0002840108920192',
            branch: settings.bankInfo.branchName || 'Main Boulevard Gulberg Branch, Lahore',
            instructions: settings.bankInfo.instructions || 'Transfer funds and upload receipt screenshot.',
            isEnabled: true,
          },
        ];

  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(
    effectiveBankAccounts[0]?.id || ''
  );

  const selectedBankAccount =
    effectiveBankAccounts.find((a) => a.id === selectedBankAccountId) ||
    effectiveBankAccounts[0];

  // Payment proof upload state
  const [proofFile, setProofFile] = useState<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCitySelectChange = (newCity: string) => {
    setSelectedCityOption(newCity);
    if (newCity !== 'Other / Enter manually') {
      setDeliveryCity(newCity);
    } else {
      setDeliveryCity('Default');
    }
  };

  const handleManualCityChange = (cityName: string) => {
    setManualCity(cityName);
    setDeliveryCity(cityName || 'Default');
  };

  const handleAreaChange = (val: string) => {
    setArea(val);
    setDeliveryArea(val);
  };

  const effectiveCity =
    selectedCityOption === 'Other / Enter manually' ? manualCity.trim() : selectedCityOption;

  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File exceeds 8MB limit. Please upload a smaller screenshot.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid format. Please upload JPG, PNG, WEBP or PDF receipt.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofFile({
        fileUrl: reader.result as string,
        fileName: file.name,
        fileSize: file.size,
      });
    };
    reader.onerror = () => {
      setUploadError('Failed to read file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    const cleanedPhone = phone.replace(/[\s-]/g, '');
    if (!cleanedPhone) {
      errors.phone = 'Phone number is required for courier delivery updates.';
    } else if (cleanedPhone.length < 10) {
      errors.phone = 'Please enter a valid Pakistani phone number (e.g. 0300 1234567).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Email address is required for dispatch invoices.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!address.trim()) {
      errors.address = 'Complete street address is required.';
    }

    if (selectedCityOption === 'Other / Enter manually' && !manualCity.trim()) {
      errors.city = 'Please type your city name.';
    } else if (!selectedCityOption) {
      errors.city = 'Please select or enter your city.';
    }

    if (!area.trim()) {
      errors.area = 'Please specify your area, sector, or locality.';
    }

    if (isDeliveryRestricted) {
      errors.delivery = 'Delivery to this area is currently suspended. Please select an alternative address.';
    }

    // Payment proof validation for bank transfer or online
    if (
      (selectedPaymentMethod === 'BANK_TRANSFER' || selectedPaymentMethod === 'ONLINE') &&
      !proofFile
    ) {
      errors.paymentProof =
        'Please upload your payment transfer receipt or transaction screenshot.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Your bag is empty.');
      return;
    }

    if (isDeliveryRestricted) {
      setErrorMessage(
        'Delivery to your selected location is temporarily restricted by logistics. Please enter a different delivery destination.'
      );
      return;
    }

    if (!validateForm()) {
      setErrorMessage('Please fix the highlighted fields below to place your order.');
      return;
    }

    setIsSubmitting(true);

    try {
      let paymentProofData: PaymentProof | undefined = undefined;
      if (proofFile) {
        paymentProofData = {
          fileUrl: proofFile.fileUrl,
          fileName: proofFile.fileName,
          fileSize: proofFile.fileSize,
          uploadedAt: new Date().toISOString(),
          status: 'Pending Verification',
        };
      }

      const createdOrder = await checkoutOrder(
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          city: effectiveCity,
          area: area.trim(),
          isManualCity: selectedCityOption === 'Other / Enter manually',
          province,
          postalCode: postalCode.trim() || undefined,
          notes: orderNotes.trim() || undefined,
        },
        selectedPaymentMethod,
        paymentProofData,
        {
          isPartialPaymentSelected: isActuallyPartial,
          selectedBankAccountId: selectedBankAccount?.id,
          selectedBankAccountName: selectedBankAccount?.bankName,
        }
      );

      // Automated Gmail Order Confirmation Notification
      if (gmailNotificationEnabled) {
        try {
          const emailRes = await sendOrderConfirmationEmail(createdOrder, {
            senderEmail: settings.gmailSettings?.senderEmail || 'revoraofficial57@gmail.com',
          });
          if (emailRes.success) {
            updateOrderEmailStatus(createdOrder.id, true, undefined, emailRes.messageId);
            createdOrder.emailSent = true;
            createdOrder.emailSentAt = new Date().toISOString();
            createdOrder.gmailMessageId = emailRes.messageId;
          } else {
            updateOrderEmailStatus(createdOrder.id, false, emailRes.error);
            createdOrder.emailError = emailRes.error;
          }
        } catch (emailErr: any) {
          console.warn('Gmail sending error:', emailErr);
          updateOrderEmailStatus(createdOrder.id, false, emailErr?.message || 'Email dispatch failed');
        }
      }

      setIsSubmitting(false);
      onOrderSuccess(createdOrder);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to place order. Please review your details.');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="py-24 text-center bg-white min-h-screen text-neutral-900 space-y-4">
        <h2 className="text-xl font-bold font-display uppercase text-black">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-xs text-neutral-600">
          Add apparel pieces from the collection before proceeding to checkout.
        </p>
        <button
          onClick={onBackToShop}
          className="bg-black text-white hover:bg-neutral-800 px-6 py-3 text-xs font-bold uppercase rounded-xs cursor-pointer font-display"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  // Build unique city options list from rules
  const uniqueRuleCities = Array.from(
    new Set(
      availableDeliveryRules
        .filter((r) => r.isActive !== false && r.city.toLowerCase() !== 'default')
        .map((r) => r.city)
    )
  );

  return (
    <div className="py-12 bg-white min-h-screen text-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 pb-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-mono tracking-widest text-neutral-500 uppercase">
              SECURE GUEST CHECKOUT // NO MANDATORY ACCOUNT REQUIRED
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase font-display mt-1">
              Finalize Your Order
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
            <Lock className="w-3.5 h-3.5 text-black" />
            <span>256-bit Encrypted Checkout</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Customer Shipping & Payment Details (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Destination Address */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xs space-y-5 shadow-xs">
              <h2 className="text-sm font-bold text-black uppercase tracking-wider font-display flex items-center gap-2">
                <span className="w-5 h-5 bg-black text-white flex items-center justify-center text-xs font-bold rounded-full">
                  1
                </span>
                <span>Shipping & Delivery Destination</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: '' });
                    }}
                    placeholder="e.g. Ali Reza"
                    className={`w-full bg-white border text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black ${
                      fieldErrors.fullName ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  />
                  {fieldErrors.fullName && (
                    <p className="text-[11px] text-red-600 mt-1 font-mono">{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
                    Mobile Phone (WhatsApp Active) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                    }}
                    placeholder="0300 1234567"
                    className={`w-full bg-white border text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black font-mono ${
                      fieldErrors.phone ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  />
                  {fieldErrors.phone ? (
                    <p className="text-[11px] text-red-600 mt-1 font-mono">{fieldErrors.phone}</p>
                  ) : (
                    <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                      Rider will call this number for dispatch verification
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
                    Email Address (For Invoices & Tracking) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    placeholder="yourname@gmail.com"
                    className={`w-full bg-white border text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black ${
                      fieldErrors.email ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-red-600 mt-1 font-mono">{fieldErrors.email}</p>
                  )}
                </div>

                {/* City Dropdown */}
                <div>
                  <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
                    Destination City *
                  </label>
                  <select
                    value={selectedCityOption}
                    onChange={(e) => {
                      handleCitySelectChange(e.target.value);
                      if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: '' });
                    }}
                    className={`w-full bg-white border text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black font-mono cursor-pointer ${
                      fieldErrors.city ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  >
                    {uniqueRuleCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Other / Enter manually">Other / Enter manually</option>
                  </select>
                </div>

                {/* Area / Sector */}
                <div>
                  <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
                    Area / Locality / Sector *
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => {
                      handleAreaChange(e.target.value);
                      if (fieldErrors.area) setFieldErrors({ ...fieldErrors, area: '' });
                    }}
                    placeholder="e.g. DHA Phase 5, Gulberg III, F-8"
                    className={`w-full bg-white border text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black ${
                      fieldErrors.area ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  />
                  {fieldErrors.area && (
                    <p className="text-[11px] text-red-600 mt-1 font-mono">{fieldErrors.area}</p>
                  )}
                </div>

                {/* Manual City entry */}
                {selectedCityOption === 'Other / Enter manually' && (
                  <div className="sm:col-span-2 p-3.5 bg-neutral-50 border border-neutral-300 rounded-xs">
                    <label className="block text-xs font-mono text-black font-bold mb-1">
                      Type Your City Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualCity}
                      onChange={(e) => {
                        handleManualCityChange(e.target.value);
                        if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: '' });
                      }}
                      placeholder="e.g. Sargodha, Mirpur, Rahim Yar Khan, Sukkur..."
                      className={`w-full bg-white border text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black ${
                        fieldErrors.city ? 'border-red-500' : 'border-neutral-300'
                      }`}
                    />
                    <span className="text-[11px] text-neutral-500 mt-1 block font-mono">
                      Configured nationwide fallback shipping charges apply automatically.
                    </span>
                    {fieldErrors.city && (
                      <p className="text-[11px] text-red-600 mt-1 font-mono">{fieldErrors.city}</p>
                    )}
                  </div>
                )}

                {/* Temporary restriction banner if location is suspended */}
                {isDeliveryRestricted && (
                  <div className="sm:col-span-2 p-3 bg-red-50 border border-red-300 text-red-800 rounded-xs text-xs font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      Notice: Courier delivery to {effectiveCity} is currently suspended under local logistics restrictions. Orders cannot be confirmed for this destination.
                    </span>
                  </div>
                )}

                {/* Complete Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
                    Complete Street Address (Plot/House #, Street) *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: '' });
                    }}
                    placeholder="e.g. House 42, Street 7, Block B, Near Motorsport Workshop"
                    className={`w-full bg-white border text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black ${
                      fieldErrors.address ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  />
                  {fieldErrors.address && (
                    <p className="text-[11px] text-red-600 mt-1 font-mono">{fieldErrors.address}</p>
                  )}
                </div>

                {/* Province */}
                <div>
                  <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
                    Province *
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black cursor-pointer"
                  >
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Azad Kashmir">Azad Kashmir</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                  </select>
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
                    Postal Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="54000"
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black font-mono"
                  />
                </div>

                {/* Special Delivery Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-neutral-700 font-semibold mb-1">
                    Delivery Instructions / Special Notes
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Call before arrival, leave with security guard"
                    className="w-full bg-white border border-neutral-300 text-neutral-900 text-xs px-3.5 py-2.5 rounded-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method & Schedule */}
            <div className="bg-white border border-neutral-200 p-6 rounded-xs space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-black uppercase tracking-wider font-display flex items-center gap-2">
                  <span className="w-5 h-5 bg-black text-white flex items-center justify-center text-xs font-bold rounded-full">
                    2
                  </span>
                  <span>Payment Method & Schedule</span>
                </h2>
                <span className="text-[11px] font-mono text-neutral-500">
                  Select payment plan: Full COD, Partial Advance, or 100% Upfront
                </span>
              </div>

              {incompatiblePaymentWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-[11px] text-amber-800 rounded-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{incompatiblePaymentWarning}</span>
                </div>
              )}

              {usablePaymentMethods.length === 0 ? (
                <div className="p-4 bg-red-50 border border-red-300 text-red-800 text-xs rounded-xs">
                  No valid payment method is configured or compatible with all items in your bag. Please contact support.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Payment Plan Options */}
                  <div className="space-y-3">
                    {/* Option 1: Cash on Delivery (COD) */}
                    {usablePaymentMethods.includes('COD') && (
                      <div
                        onClick={() => handleSelectPaymentPlan('COD')}
                        className={`p-4 border rounded-xs cursor-pointer transition-all ${
                          paymentPlanMode === 'COD'
                            ? 'border-black bg-neutral-50 shadow-xs ring-1 ring-black'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="paymentPlanMode"
                              checked={paymentPlanMode === 'COD'}
                              onChange={() => handleSelectPaymentPlan('COD')}
                              className="accent-black mt-1"
                            />
                            <div>
                              <div className="text-xs font-bold uppercase font-display text-black flex items-center gap-2 flex-wrap">
                                <span>1. Full Cash on Delivery (COD)</span>
                                <span className="text-[10px] font-mono text-neutral-700 bg-neutral-200 px-2 py-0.5 rounded-xs font-semibold">
                                  Pay Rs. 0 Now
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-600 mt-1">
                                Pay in cash directly to the courier rider upon parcel delivery at your doorstep. Zero advance needed.
                              </p>
                              <div className="mt-2 text-[11px] font-mono text-neutral-700 bg-white/80 p-2 rounded-xs border border-neutral-200 flex items-center gap-4">
                                <span>Pay Today: <strong className="text-emerald-700">Rs. 0</strong></span>
                                <span>•</span>
                                <span>Pay at Doorstep: <strong className="text-black">{formatPKR(cartTotal)}</strong></span>
                              </div>
                            </div>
                          </div>
                          <Banknote className="w-5 h-5 text-neutral-600 shrink-0 mt-1" />
                        </div>
                      </div>
                    )}

                    {/* Option 2: Partial Advance Payment */}
                    {isPartialPaymentEligible && (
                      <div
                        onClick={() => handleSelectPaymentPlan('PARTIAL')}
                        className={`p-4 border rounded-xs cursor-pointer transition-all ${
                          paymentPlanMode === 'PARTIAL'
                            ? 'border-black bg-amber-50/70 shadow-xs ring-1 ring-black'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="paymentPlanMode"
                              checked={paymentPlanMode === 'PARTIAL'}
                              onChange={() => handleSelectPaymentPlan('PARTIAL')}
                              className="accent-black mt-1"
                            />
                            <div>
                              <div className="text-xs font-bold uppercase font-display text-black flex items-center gap-2 flex-wrap">
                                <span>2. Partial Advance ({advancePercentage}%) + Cash on Delivery</span>
                                <span className="text-[10px] font-mono text-amber-900 bg-amber-200 px-2 py-0.5 rounded-xs font-semibold">
                                  Advance Deposit Option
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-600 mt-1">
                                Transfer {advancePercentage}% ({formatPKR(computedAdvanceAmount)}) advance now via Bank Transfer / Raast. Pay the remaining {formatPKR(cartTotal - computedAdvanceAmount)} {balanceDueTiming}.
                              </p>
                              <div className="mt-2 text-[11px] font-mono text-neutral-800 bg-white p-2 rounded-xs border border-amber-300 flex items-center gap-4">
                                <span>Pay Today: <strong className="text-amber-800">{formatPKR(computedAdvanceAmount)}</strong></span>
                                <span>•</span>
                                <span>Pay at Doorstep: <strong className="text-black">{formatPKR(cartTotal - computedAdvanceAmount)}</strong></span>
                              </div>
                            </div>
                          </div>
                          <Percent className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                        </div>
                      </div>
                    )}

                    {/* Option 3: Full 100% Upfront Bank Transfer */}
                    {usablePaymentMethods.includes('BANK_TRANSFER') && (
                      <div
                        onClick={() => handleSelectPaymentPlan('BANK_FULL')}
                        className={`p-4 border rounded-xs cursor-pointer transition-all ${
                          paymentPlanMode === 'BANK_FULL'
                            ? 'border-black bg-neutral-50 shadow-xs ring-1 ring-black'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="paymentPlanMode"
                              checked={paymentPlanMode === 'BANK_FULL'}
                              onChange={() => handleSelectPaymentPlan('BANK_FULL')}
                              className="accent-black mt-1"
                            />
                            <div>
                              <div className="text-xs font-bold uppercase font-display text-black flex items-center gap-2 flex-wrap">
                                <span>3. Full 100% Bank Transfer</span>
                                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-xs font-semibold">
                                  100% Paid Upfront
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-600 mt-1">
                                Direct transfer via Meezan Bank, Alfalah, or Raast. Contactless delivery with zero cash needed at your door.
                              </p>
                              <div className="mt-2 text-[11px] font-mono text-neutral-700 bg-white/80 p-2 rounded-xs border border-neutral-200 flex items-center gap-4">
                                <span>Pay Today: <strong className="text-black">{formatPKR(cartTotal)}</strong></span>
                                <span>•</span>
                                <span>Pay at Doorstep: <strong className="text-emerald-700">Rs. 0 (Fully Paid)</strong></span>
                              </div>
                            </div>
                          </div>
                          <Building2 className="w-5 h-5 text-neutral-600 shrink-0 mt-1" />
                        </div>
                      </div>
                    )}

                    {/* Option 4: Online Digital Payment */}
                    {usablePaymentMethods.includes('ONLINE') && (
                      <div
                        onClick={() => handleSelectPaymentPlan('ONLINE')}
                        className={`p-4 border rounded-xs cursor-pointer transition-all ${
                          paymentPlanMode === 'ONLINE'
                            ? 'border-black bg-neutral-50 shadow-xs ring-1 ring-black'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="paymentPlanMode"
                              checked={paymentPlanMode === 'ONLINE'}
                              onChange={() => handleSelectPaymentPlan('ONLINE')}
                              className="accent-black mt-1"
                            />
                            <div>
                              <div className="text-xs font-bold uppercase font-display text-black flex items-center gap-2 flex-wrap">
                                <span>4. Online Digital Payment / Raast QR</span>
                                <span className="text-[10px] font-mono text-neutral-700 bg-neutral-200 px-2 py-0.5 rounded-xs">
                                  Instant
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-600 mt-1">
                                Fast online transaction with digital transaction receipt upload.
                              </p>
                              <div className="mt-2 text-[11px] font-mono text-neutral-700 bg-white/80 p-2 rounded-xs border border-neutral-200 flex items-center gap-4">
                                <span>Pay Today: <strong className="text-black">{formatPKR(cartTotal)}</strong></span>
                                <span>•</span>
                                <span>Pay at Doorstep: <strong className="text-emerald-700">Rs. 0</strong></span>
                              </div>
                            </div>
                          </div>
                          <CreditCard className="w-5 h-5 text-neutral-600 shrink-0 mt-1" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interactive What You Will Pay Today vs Later Matrix */}
                  <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xs text-white space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-wider font-display text-white">
                          What You Will Pay — Clear Summary
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-neutral-800 text-neutral-300 font-semibold">
                        {paymentPlanMode === 'COD'
                          ? '100% Cash on Delivery'
                          : paymentPlanMode === 'PARTIAL'
                          ? `${advancePercentage}% Advance + Doorstep Balance`
                          : '100% Upfront Transfer'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Box 1: Payable Today */}
                      <div className="p-3 bg-black/60 border border-emerald-800/60 rounded-xs">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold">
                          1. Amount Due Today (Pay Now)
                        </span>
                        <div className="text-xl font-mono font-black text-emerald-300 mt-1">
                          {formatPKR(payableNowAmount)}
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono mt-1 leading-tight">
                          {paymentPlanMode === 'COD'
                            ? '✓ Rs. 0 required today. No advance deposit.'
                            : paymentPlanMode === 'PARTIAL'
                            ? `✓ Transfer ${advancePercentage}% advance via bank below.`
                            : '✓ Full 100% total transferred upfront.'}
                        </p>
                      </div>

                      {/* Box 2: Payable on Delivery */}
                      <div className="p-3 bg-black/60 border border-amber-800/60 rounded-xs">
                        <span className="text-[10px] font-mono text-amber-400 uppercase block font-bold">
                          2. Amount Due on Delivery (Doorstep)
                        </span>
                        <div className="text-xl font-mono font-black text-amber-300 mt-1">
                          {formatPKR(remainingBalanceAmount)}
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono mt-1 leading-tight">
                          {paymentPlanMode === 'COD'
                            ? `✓ Pay full ${formatPKR(cartTotal)} in cash to courier rider upon delivery.`
                            : paymentPlanMode === 'PARTIAL'
                            ? `✓ Pay remaining ${formatPKR(remainingBalanceAmount)} ${balanceDueTiming}.`
                            : '✓ Rs. 0 balance. Package handed over with zero cash needed.'}
                        </p>
                      </div>

                      {/* Box 3: Total Order Price */}
                      <div className="p-3 bg-black/60 border border-neutral-800 rounded-xs">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase block font-bold">
                          3. Total Order Value
                        </span>
                        <div className="text-xl font-mono font-black text-white mt-1">
                          {formatPKR(cartTotal)}
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono mt-1 leading-tight">
                          {cart.length} item(s) • Subtotal {formatPKR(cartSubtotal - couponDiscount)} + Delivery {isFreeDelivery ? 'FREE' : formatPKR(deliveryFee)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2C: Bank Accounts Selector & Payment Proof (Requirement 4) */}
              {(selectedPaymentMethod === 'BANK_TRANSFER' || selectedPaymentMethod === 'ONLINE') && (
                <div className="mt-4 p-5 bg-neutral-50 border border-neutral-300 rounded-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-black uppercase font-display">
                        Select Official Bank Account ({effectiveBankAccounts.length} Available)
                      </h4>
                      <p className="text-[11px] text-neutral-600">
                        Please transfer{' '}
                        <strong className="text-black font-mono">
                          {formatPKR(payableNowAmount)}
                        </strong>{' '}
                        to one of our verified store accounts below:
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-xs">
                      Verified Store Account
                    </span>
                  </div>

                  {/* Account Selector Cards */}
                  <div className="space-y-2.5">
                    {effectiveBankAccounts.map((account) => {
                      const isSelected = account.id === selectedBankAccount?.id;
                      return (
                        <div
                          key={account.id}
                          onClick={() => setSelectedBankAccountId(account.id)}
                          className={`p-3.5 border rounded-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-black bg-white shadow-xs ring-1 ring-black'
                              : 'border-neutral-200 bg-white/70 hover:border-neutral-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="bankAccountChoice"
                                checked={isSelected}
                                onChange={() => setSelectedBankAccountId(account.id)}
                                className="accent-black"
                              />
                              <div>
                                <span className="font-bold text-black text-xs font-display uppercase">
                                  {account.bankName}
                                </span>
                                <div className="text-[11px] font-mono text-neutral-600">
                                  Title: <strong className="text-black">{account.accountTitle}</strong>
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-500">
                              {account.branch || 'Official Paddock Desk'}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                              <div className="bg-neutral-50 p-2 rounded-xs flex items-center justify-between">
                                <div>
                                  <span className="text-neutral-500 text-[10px] block">ACCOUNT NUMBER</span>
                                  <strong className="text-black">{account.accountNumber}</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyText(account.accountNumber, 'accNo');
                                  }}
                                  className="text-[10px] text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer bg-neutral-200 px-2 py-1 rounded-xs"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>{copiedField === 'accNo' ? 'Copied!' : 'Copy'}</span>
                                </button>
                              </div>

                              {account.iban && (
                                <div className="bg-neutral-50 p-2 rounded-xs flex items-center justify-between">
                                  <div>
                                    <span className="text-neutral-500 text-[10px] block">IBAN NUMBER</span>
                                    <strong className="text-black">{account.iban}</strong>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyText(account.iban!, 'iban');
                                    }}
                                    className="text-[10px] text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer bg-neutral-200 px-2 py-1 rounded-xs"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>{copiedField === 'iban' ? 'Copied!' : 'Copy'}</span>
                                  </button>
                                </div>
                              )}

                              {account.instructions && (
                                <div className="sm:col-span-2 text-[11px] text-neutral-600 pt-1">
                                  <span className="font-semibold text-black">Instructions: </span>
                                  {account.instructions}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Proof File Upload */}
                  <div className="pt-3 border-t border-neutral-200 space-y-2">
                    <label className="block text-xs font-mono font-bold text-black">
                      Upload Payment Transfer Screenshot / Receipt *
                    </label>

                    <div className="flex items-center gap-3">
                      <label className="bg-black hover:bg-neutral-800 text-white px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xs cursor-pointer flex items-center gap-2 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select Receipt File</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        Max 8MB (JPG, PNG, PDF screenshot)
                      </span>
                    </div>

                    {uploadError && (
                      <p className="text-[11px] text-red-600 font-mono">{uploadError}</p>
                    )}

                    {fieldErrors.paymentProof && (
                      <p className="text-[11px] text-red-600 font-mono">{fieldErrors.paymentProof}</p>
                    )}

                    {proofFile && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xs text-xs font-mono text-emerald-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="line-clamp-1">{proofFile.fileName}</span>
                        </div>
                        <span className="text-neutral-500 text-[10px]">
                          {(proofFile.fileSize / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary & Mandatory 10-Point Breakdown (Right 5 Cols - Requirement 6) */}
          <div className="lg:col-span-5 bg-neutral-50 border border-neutral-200 p-6 rounded-xs space-y-6 shadow-xs sticky top-24">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider font-display pb-3 border-b border-neutral-200">
              Order Summary ({cart.length} Pieces)
            </h3>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto divide-y divide-neutral-200 pr-1">
              {cart.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex gap-3 text-xs">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-14 h-16 object-cover rounded-xs border border-neutral-200 bg-white shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-black line-clamp-1 font-display">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] font-mono text-neutral-500">
                        {item.clothingType} · Size {item.size} · Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-black tabular-nums">
                      {formatPKR(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* MANDATORY CHECKOUT BREAKDOWN MODULE (All 10 Points) */}
            <div className="space-y-3 pt-4 border-t border-neutral-200 text-xs font-mono">
              <div className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider pb-1">
                Amount Breakdown & Terms
              </div>

              {/* 1. Subtotal of products */}
              <div className="flex justify-between text-neutral-600">
                <span>1. Subtotal of Products</span>
                <span className="text-black font-semibold tabular-nums">
                  {formatPKR(cartSubtotal)}
                </span>
              </div>

              {/* 2. Discounts and promotional deductions */}
              <div className="flex justify-between text-neutral-600">
                <span>2. Discounts & Deductions {appliedCouponCode ? `(${appliedCouponCode})` : ''}</span>
                <span className={couponDiscount > 0 ? 'text-emerald-700 font-semibold tabular-nums' : 'text-neutral-500 tabular-nums'}>
                  {couponDiscount > 0 ? `-${formatPKR(couponDiscount)}` : 'Rs. 0'}
                </span>
              </div>

              {/* 3. Shipping charges */}
              <div className="flex justify-between text-neutral-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-neutral-500" />
                  <span>3. Shipping Charges ({effectiveCity || 'Nationwide'})</span>
                </span>
                <span className="text-black font-semibold tabular-nums">
                  {isFreeDelivery ? 'FREE' : formatPKR(deliveryFee)}
                </span>
              </div>

              {/* 4. Additional applicable charges */}
              <div className="flex justify-between text-neutral-600">
                <span>4. Additional Charges</span>
                <span className="text-neutral-500 tabular-nums">Rs. 0</span>
              </div>

              {/* 5. Final order total */}
              <div className="flex justify-between text-sm font-extrabold text-black pt-2 border-t border-neutral-200 font-display">
                <span>5. Final Order Total</span>
                <span className="tabular-nums font-mono text-base">{formatPKR(cartTotal)}</span>
              </div>

              {/* 6. Selected payment method */}
              <div className="flex justify-between text-neutral-600 pt-1">
                <span>6. Selected Payment Method</span>
                <span className="text-black font-bold uppercase">{selectedPaymentMethod}</span>
              </div>

              {/* 7. Advance payment percentage (if applicable) */}
              {isActuallyPartial && (
                <div className="flex justify-between text-amber-800 bg-amber-50 p-2 rounded-xs">
                  <span>7. Advance Percentage</span>
                  <span className="font-bold">{advancePercentage}%</span>
                </div>
              )}

              {/* 8. Amount payable now */}
              <div className="flex justify-between text-sm font-bold text-black bg-neutral-100 p-2.5 rounded-xs">
                <span>8. Amount Payable Now (Today)</span>
                <span className="tabular-nums font-mono text-emerald-800 font-black">
                  {formatPKR(payableNowAmount)}
                </span>
              </div>

              {/* 9. Remaining balance */}
              <div className="flex justify-between text-neutral-700 p-2 rounded-xs bg-amber-50/60 border border-amber-200/60">
                <span className="font-semibold text-amber-950">9. Balance Due Upon Delivery</span>
                <span className="tabular-nums font-mono font-bold text-black">
                  {formatPKR(remainingBalanceAmount)}
                </span>
              </div>

              {/* 10. When and how remaining balance must be paid */}
              <div className="p-3 bg-white border border-neutral-300 rounded-xs text-[11px] space-y-1">
                <span className="text-neutral-500 uppercase block text-[10px] font-bold">
                  10. Balance Payment Terms:
                </span>
                <p className="text-black leading-relaxed font-semibold">
                  {isActuallyPartial
                    ? balanceDueTiming
                    : paymentPlanMode === 'COD'
                    ? 'Total ' + formatPKR(cartTotal) + ' payable in cash to courier rider upon doorstep inspection.'
                    : '100% full order total paid upfront. Zero balance payable at delivery.'}
                </p>
              </div>
            </div>

            {/* Confirm & Place Order Button */}
            <button
              type="submit"
              disabled={isSubmitting || isDeliveryRestricted}
              className="w-full bg-black hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 px-4 rounded-xs text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-display shadow-md transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'PROCESSING ORDER...'
                  : isDeliveryRestricted
                  ? 'DELIVERY RESTRICTED FOR LOCATION'
                  : payableNowAmount === 0
                  ? `CONFIRM ORDER (RS. 0 DUE NOW • PAY ${formatPKR(cartTotal)} AT DELIVERY)`
                  : isActuallyPartial
                  ? `CONFIRM & PLACE ORDER (${formatPKR(payableNowAmount)} ADVANCE DUE NOW)`
                  : `CONFIRM & PLACE ORDER (${formatPKR(payableNowAmount)} DUE NOW)`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] font-mono text-neutral-500 text-center space-y-1">
              <p>✓ No login or password required for guest checkout.</p>
              <p>✓ Verified receipt tracking and doorstep courier inspection.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
