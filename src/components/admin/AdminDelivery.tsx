import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  getAllDeliveryRules,
  saveDeliveryRule,
  deleteDeliveryRule,
  saveStoreSettings,
} from '../../services/storage';
import { DeliveryRule } from '../../types';
import {
  Plus,
  Trash2,
  Truck,
  Edit2,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Building2,
  MapPin,
} from 'lucide-react';

export const AdminDelivery: React.FC = () => {
  const { settings, formatPKR, refreshData, showToast } = useStore();
  const [rules, setRules] = useState<DeliveryRule[]>(() => getAllDeliveryRules());
  const [freeThreshold, setFreeThreshold] = useState<number>(settings.freeShippingThreshold);
  const [defaultRate, setDefaultRate] = useState<number>(settings.defaultDeliveryFee);

  // Edit / Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DeliveryRule | null>(null);

  const [cityName, setCityName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [province, setProvince] = useState('Punjab');
  const [charge, setCharge] = useState(200);
  const [codExtraCharge, setCodExtraCharge] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [estimatedDays, setEstimatedDays] = useState('2 - 3 Business Days');
  const [isActive, setIsActive] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [specialNotes, setSpecialNotes] = useState('');

  const reload = () => {
    setRules(getAllDeliveryRules());
    refreshData();
  };

  const handleOpenAdd = () => {
    setEditingRule(null);
    setCityName('');
    setAreaName('');
    setProvince('Punjab');
    setCharge(250);
    setCodExtraCharge(0);
    setMinOrderValue(0);
    setEstimatedDays('2 - 3 Business Days');
    setIsActive(true);
    setIsAvailable(true);
    setSpecialNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: DeliveryRule) => {
    setEditingRule(rule);
    setCityName(rule.city);
    setAreaName(rule.area || '');
    setProvince(rule.province || 'Punjab');
    setCharge(rule.charge);
    setCodExtraCharge(rule.codExtraCharge || 0);
    setMinOrderValue(rule.minOrderValue || 0);
    setEstimatedDays(rule.estimatedDays);
    setIsActive(rule.isActive !== false);
    setIsAvailable(rule.isAvailable !== false);
    setSpecialNotes(rule.specialNotes || '');
    setIsModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) {
      alert('Please enter city name.');
      return;
    }

    const ruleToSave: DeliveryRule = {
      id: editingRule ? editingRule.id : 'del-' + Date.now(),
      city: cityName.trim(),
      area: areaName.trim() || undefined,
      province,
      charge: Number(charge),
      codExtraCharge: Number(codExtraCharge) || 0,
      minOrderValue: Number(minOrderValue) || 0,
      estimatedDays: estimatedDays.trim(),
      isActive,
      isAvailable,
      specialNotes: specialNotes.trim() || undefined,
      order: editingRule?.order || rules.length + 1,
    };

    saveDeliveryRule(ruleToSave);
    reload();
    setIsModalOpen(false);
    showToast(`Saved delivery rule for ${ruleToSave.city}${ruleToSave.area ? ` (${ruleToSave.area})` : ''}`);
  };

  const handleToggleActive = (rule: DeliveryRule) => {
    const updated: DeliveryRule = {
      ...rule,
      isActive: !rule.isActive,
    };
    saveDeliveryRule(updated);
    reload();
    showToast(`Rule for ${rule.city} ${updated.isActive ? 'activated' : 'deactivated'}.`);
  };

  const handleToggleAvailable = (rule: DeliveryRule) => {
    const updated: DeliveryRule = {
      ...rule,
      isAvailable: rule.isAvailable === false ? true : false,
    };
    saveDeliveryRule(updated);
    reload();
    showToast(
      updated.isAvailable
        ? `Delivery to ${rule.city} marked available.`
        : `Temporary restriction placed on ${rule.city} (delivery suspended).`
    );
  };

  const handleDelete = (id: string, city: string) => {
    if (city.toLowerCase() === 'default') {
      alert('The Default nationwide delivery rule cannot be deleted. You can edit its charge.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete delivery rule for ${city}?`)) {
      deleteDeliveryRule(id);
      reload();
      showToast('Delivery rule deleted.');
    }
  };

  const handleUpdateNationwideDefaults = () => {
    settings.freeShippingThreshold = Number(freeThreshold);
    settings.defaultDeliveryFee = Number(defaultRate);

    // Also update Default rule in delivery rules if present
    const defaultRule = rules.find((r) => r.city.toLowerCase() === 'default');
    if (defaultRule) {
      defaultRule.charge = Number(defaultRate);
      saveDeliveryRule(defaultRule);
    }

    saveStoreSettings(settings);
    reload();
    showToast('Updated nationwide shipping defaults and free delivery threshold.');
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rules.length) return;

    const currentItem = rules[index];
    const targetItem = rules[targetIndex];

    const tempOrder = currentItem.order || index;
    currentItem.order = targetItem.order || targetIndex;
    targetItem.order = tempOrder;

    saveDeliveryRule(currentItem);
    saveDeliveryRule(targetItem);
    reload();
    showToast('Delivery rules priority updated.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white uppercase font-display flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>Shipping & Courier Logistics Management</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400">
            Control city rates, area exceptions, COD surcharges, and temporary location delivery restrictions
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-bold uppercase rounded-xs flex items-center gap-1.5 font-display cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add City / Area Rule</span>
        </button>
      </div>

      {/* Nationwide Defaults & Free Shipping Threshold Card */}
      <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-xs grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="text-xs font-bold text-white uppercase font-display flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Nationwide Free Delivery Threshold</span>
          </div>
          <p className="text-xs text-neutral-400">
            Orders exceeding this subtotal qualify for 100% free delivery across all cities in Pakistan.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-neutral-500 font-mono text-xs">PKR</span>
            <input
              type="number"
              value={freeThreshold}
              onChange={(e) => setFreeThreshold(Number(e.target.value))}
              className="bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xs font-mono w-36 font-bold"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-white uppercase font-display flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Default Fallback Nationwide Shipping Rate</span>
          </div>
          <p className="text-xs text-neutral-400">
            Applied automatically when a customer enters an unlisted city or selects manual location entry.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <span className="text-neutral-500 font-mono text-xs">PKR</span>
            <input
              type="number"
              value={defaultRate}
              onChange={(e) => setDefaultRate(Number(e.target.value))}
              className="bg-neutral-900 border border-neutral-800 text-white text-xs px-3 py-2 rounded-xs font-mono w-36 font-bold"
            />
            <button
              onClick={handleUpdateNationwideDefaults}
              className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 text-xs font-mono rounded-xs flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xs overflow-x-auto">
        <table className="w-full text-xs font-mono text-left text-neutral-300">
          <thead className="bg-neutral-900 text-neutral-400 uppercase text-[11px] border-b border-neutral-800">
            <tr>
              <th className="p-3">Destination City / Area</th>
              <th className="p-3">Province / Zone</th>
              <th className="p-3">Shipping Charge</th>
              <th className="p-3">COD Extra</th>
              <th className="p-3">Transit Window</th>
              <th className="p-3">Service Availability</th>
              <th className="p-3">Active Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {rules.map((r, idx) => (
              <tr key={r.id} className="hover:bg-neutral-900/40 transition-colors">
                <td className="p-3">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{r.city}</span>
                    {r.city.toLowerCase() === 'default' && (
                      <span className="text-[9px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded-xs font-normal">
                        Fallback
                      </span>
                    )}
                  </div>
                  {r.area && (
                    <div className="text-neutral-400 text-[10px] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-neutral-500" />
                      <span>Specific Area: {r.area}</span>
                    </div>
                  )}
                  {r.specialNotes && (
                    <div className="text-neutral-500 text-[10px] mt-0.5 italic">{r.specialNotes}</div>
                  )}
                </td>
                <td className="p-3 text-neutral-400">{r.province || 'Nationwide'}</td>
                <td className="p-3 text-white font-bold tabular-nums">
                  {formatPKR(r.charge)}
                </td>
                <td className="p-3 text-neutral-400 tabular-nums">
                  {r.codExtraCharge ? `+${formatPKR(r.codExtraCharge)}` : 'Rs. 0'}
                </td>
                <td className="p-3 text-neutral-300">{r.estimatedDays}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleToggleAvailable(r)}
                    className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1 ${
                      r.isAvailable !== false
                        ? 'bg-emerald-950/60 border border-emerald-700 text-emerald-300'
                        : 'bg-red-950/70 border border-red-700 text-red-300'
                    }`}
                  >
                    {r.isAvailable !== false ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Available</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>Restricted / Suspended</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleToggleActive(r)}
                    className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1 ${
                      r.isActive !== false
                        ? 'bg-neutral-800 text-neutral-200'
                        : 'bg-neutral-900 text-neutral-500 opacity-60'
                    }`}
                  >
                    {r.isActive !== false ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white p-1.5 rounded-xs cursor-pointer transition-colors"
                      title="Edit rule"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {r.city.toLowerCase() !== 'default' && (
                      <button
                        onClick={() => handleDelete(r.id, r.city)}
                        className="text-neutral-500 hover:text-red-400 p-1.5 cursor-pointer transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 max-w-lg w-full p-6 sm:p-8 rounded-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-display font-bold text-white uppercase text-base">
                {editingRule ? `Edit Rule: ${editingRule.city}` : 'Add Shipping & Delivery Rule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">City Name *</label>
                  <input
                    type="text"
                    required
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="e.g. Sialkot or Gujranwala"
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Specific Area / Zone (Optional)</label>
                  <input
                    type="text"
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    placeholder="e.g. Cantt or Phase 6"
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Province / Region</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Delivery Charge (PKR) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={charge}
                    onChange={(e) => setCharge(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">COD Surcharge (PKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={codExtraCharge}
                    onChange={(e) => setCodExtraCharge(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Min Order Value (PKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Estimated Transit Window *</label>
                <input
                  type="text"
                  required
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  placeholder="e.g. 1 - 2 Business Days (Express)"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Special Notes / Exceptions</label>
                <input
                  type="text"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Trax priority air hub dispatch"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-white cursor-pointer"
                  />
                  <span className="text-white">Active Rule</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="accent-white cursor-pointer"
                  />
                  <span className={isAvailable ? 'text-emerald-400' : 'text-red-400'}>
                    {isAvailable ? 'Location Available for Delivery' : 'Temporary Delivery Restriction'}
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 rounded-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-bold uppercase rounded-xs cursor-pointer font-display"
                >
                  Save Delivery Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
