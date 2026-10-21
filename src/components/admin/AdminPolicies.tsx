import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { StorePolicy } from '../../types';
import {
  getAllPolicies,
  savePolicy,
  deletePolicy,
} from '../../services/storage';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Save,
  Search,
} from 'lucide-react';

export const AdminPolicies: React.FC = () => {
  const { showToast, refreshData } = useStore();
  const [policies, setPolicies] = useState<StorePolicy[]>(() => getAllPolicies());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<StorePolicy | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<StorePolicy['category']>('Order Rules');
  const [formContent, setFormContent] = useState('');
  const [formPublished, setFormPublished] = useState(true);
  const [formOrder, setFormOrder] = useState<number>(1);

  const reload = () => {
    const list = getAllPolicies();
    setPolicies(list);
    refreshData();
  };

  const handleOpenNew = () => {
    setEditingPolicy(null);
    setFormTitle('');
    setFormCategory('Order Rules');
    setFormContent('');
    setFormPublished(true);
    setFormOrder(policies.length + 1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: StorePolicy) => {
    setEditingPolicy(p);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormContent(p.content);
    setFormPublished(p.isPublished);
    setFormOrder(p.order);
    setIsModalOpen(true);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Please fill in policy title and content.');
      return;
    }

    const policyToSave: StorePolicy = {
      id: editingPolicy ? editingPolicy.id : 'pol-' + Date.now(),
      title: formTitle.trim(),
      category: formCategory,
      content: formContent.trim(),
      isPublished: formPublished,
      order: Number(formOrder) || 1,
      updatedAt: new Date().toISOString(),
    };

    savePolicy(policyToSave);
    reload();
    setIsModalOpen(false);
    showToast(`Policy "${policyToSave.title}" saved.`);
  };

  const handleTogglePublish = (p: StorePolicy) => {
    const updated: StorePolicy = {
      ...p,
      isPublished: !p.isPublished,
      updatedAt: new Date().toISOString(),
    };
    savePolicy(updated);
    reload();
    showToast(`Policy "${p.title}" ${updated.isPublished ? 'published' : 'unpublished'}.`);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete policy "${title}"?`)) {
      deletePolicy(id);
      reload();
      showToast(`Policy "${title}" deleted.`);
    }
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const sorted = [...policies].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const currentItem = sorted[index];
    const targetItem = sorted[targetIndex];

    const tempOrder = currentItem.order;
    currentItem.order = targetItem.order;
    targetItem.order = tempOrder;

    savePolicy(currentItem);
    savePolicy(targetItem);
    reload();
    showToast('Policy display order updated.');
  };

  const filtered = policies
    .filter((p) => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchContent = p.content.toLowerCase().includes(q);
        if (!matchTitle && !matchContent) return false;
      }
      return true;
    })
    .sort((a, b) => a.order - b.order);

  const categoriesList: Array<StorePolicy['category']> = [
    'Order Rules',
    'Payment & Advance Rules',
    'Cash on Delivery Rules',
    'Delivery & Shipping',
    'Cancellation Policy',
    'Refund Policy',
    'Replacement & Exchange',
    'Damaged/Defective Claims',
    'Size & Color Selection',
    'Customer Support Rules',
    'General Policies',
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white uppercase font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-neutral-300" />
            <span>Store Rules & Policies Management</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400">
            {policies.length} operating policies saved. Changes update customer storefront in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenNew}
            className="bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-bold uppercase rounded-xs flex items-center gap-1.5 font-display cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Policy</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950 p-4 border border-neutral-800 rounded-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies by keyword..."
            className="bg-neutral-900 border border-neutral-800 text-xs pl-8 pr-3 py-2 rounded-xs text-white placeholder-neutral-500 font-mono w-64"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-neutral-400">Filter Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-xs text-white"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Policies Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xs overflow-x-auto">
        <table className="w-full text-xs font-mono text-left text-neutral-300">
          <thead className="bg-neutral-900 text-neutral-400 uppercase text-[11px] border-b border-neutral-800">
            <tr>
              <th className="p-3 w-16 text-center">Order</th>
              <th className="p-3">Policy Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Updated</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-500">
                  No policies found.
                </td>
              </tr>
            ) : (
              filtered.map((p, idx) => (
                <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-bold text-white text-xs">{p.order}</span>
                      <div className="flex flex-col ml-1">
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0}
                          className="text-neutral-500 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === filtered.length - 1}
                          className="text-neutral-500 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-white font-bold">{p.title}</div>
                    <div className="text-neutral-500 text-[11px] line-clamp-1 mt-0.5">
                      {p.content}
                    </div>
                  </td>
                  <td className="p-3 text-neutral-300">
                    <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-xs text-[10px]">
                      {p.category}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleTogglePublish(p)}
                      className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1 ${
                        p.isPublished
                          ? 'bg-emerald-950/70 border border-emerald-700 text-emerald-300'
                          : 'bg-neutral-900 border border-neutral-700 text-neutral-400'
                      }`}
                    >
                      {p.isPublished ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Published</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-neutral-500" />
                          <span>Draft / Hidden</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="p-3 text-neutral-400 text-[11px]">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white p-1.5 rounded-xs cursor-pointer transition-colors"
                        title="Edit policy"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(p.id, p.title)}
                        className="text-neutral-500 hover:text-red-400 p-1.5 cursor-pointer transition-colors"
                        title="Delete policy"
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 max-w-xl w-full p-6 sm:p-8 rounded-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-display font-bold text-white uppercase text-base">
                {editingPolicy ? 'Edit Policy' : 'Create Store Operating Policy'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-neutral-400 mb-1">Policy Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. 7-Day Size & Color Exchange Protocol"
                  className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Policy Statement / Content *</label>
                <textarea
                  rows={6}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Write the clear terms, courier requirements, refund or replacement procedures..."
                  className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="publishedToggle"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="accent-white cursor-pointer"
                />
                <label htmlFor="publishedToggle" className="text-white cursor-pointer">
                  Publish immediately on customer-facing website
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
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
