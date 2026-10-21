import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Design, ClothingType, PaymentMethodType, ProductVariant, DesignClothingTypeConfig } from '../../types';
import {
  saveProduct,
  deleteProduct,
  saveDesignWithClothingTypes,
  deleteDesign,
} from '../../services/storage';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Upload,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  RefreshCw,
} from 'lucide-react';

const DEFAULT_CLOTHING_TYPES = [
  { name: 'Regular T-shirt', defaultPrice: 1800 },
  { name: 'Oversized T-shirt', defaultPrice: 2800 },
  { name: 'Full-sleeve shirt', defaultPrice: 3200 },
  { name: 'Tank top', defaultPrice: 2200 },
  { name: 'Hoodie', defaultPrice: 5500 },
  { name: 'Sweatshirt', defaultPrice: 4200 },
  { name: 'Sweater', defaultPrice: 6200 },
  { name: 'Jacket', defaultPrice: 7500 },
  { name: 'Winter shirt', defaultPrice: 3800 },
  { name: 'Kids clothing', defaultPrice: 2400 },
];

export const AdminProducts: React.FC = () => {
  const { products, designs, categories, formatPKR, refreshData, showToast } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'designs' | 'products'>('designs');

  // Edit / Create Design Modal State
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [designName, setDesignName] = useState('');
  const [designCode, setDesignCode] = useState('');
  const [designDescription, setDesignDescription] = useState('');
  const [designImages, setDesignImages] = useState<string[]>([]);
  
  // Clothing type configs for this design
  const [clothingConfigs, setClothingConfigs] = useState<DesignClothingTypeConfig[]>([]);
  const [newCustomClothingType, setNewCustomClothingType] = useState('');

  // Image upload feedback state
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit / Create Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesignId, setProdDesignId] = useState('');
  const [prodClothingType, setProdClothingType] = useState<string>('Hoodie');
  const [prodCategory, setProdCategory] = useState('Hoodies');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodPrice, setProdPrice] = useState(5500);
  const [prodSalePrice, setProdSalePrice] = useState<number | undefined>(undefined);
  const [prodSku, setProdSku] = useState('');
  const [prodTags, setProdTags] = useState('Automotive, Streetwear');
  const [prodSizesStr, setProdSizesStr] = useState('S, M, L, XL');
  const [prodColorsStr, setProdColorsStr] = useState('Asphalt Black, Pure White');
  const [prodAllowedPayments, setProdAllowedPayments] = useState<PaymentMethodType[]>(['COD', 'BANK_TRANSFER', 'ONLINE']);
  const [prodIsWinter, setProdIsWinter] = useState(false);
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodIsNewArrival, setProdIsNewArrival] = useState(true);
  const [prodIsBestSeller, setProdIsBestSeller] = useState(false);
  const [prodStatus, setProdStatus] = useState<'active' | 'draft' | 'archived'>('active');

  // -------------------------------------------------------------
  // IMAGE MANAGEMENT: Upload, Preview, Reorder, Replace, Delete (1 to 4 images)
  // -------------------------------------------------------------
  const handleImageFiles = (
    files: FileList | null,
    targetImages: string[],
    setImages: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setImageError(null);
    if (!files || files.length === 0) return;

    const availableSlots = 4 - targetImages.length;
    if (availableSlots <= 0) {
      setImageError('Maximum of 4 images allowed per product/design.');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    setIsUploading(true);

    const readers: Promise<string>[] = filesToProcess.map((file) => {
      return new Promise((resolve, reject) => {
        // Validate type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          reject(new Error(`Invalid format for ${file.name}. Only JPG, PNG, and WEBP supported.`));
          return;
        }

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          reject(new Error(`File ${file.name} exceeds 5MB limit. Please upload compressed images.`));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Failed to load ${file.name}`));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers)
      .then((newUrls) => {
        setImages((prev) => [...prev, ...newUrls].slice(0, 4));
        setIsUploading(false);
        showToast('Image(s) uploaded successfully.');
      })
      .catch((err: any) => {
        setIsUploading(false);
        setImageError(err.message || 'Error processing images.');
      });
  };

  const handleReorderImage = (
    index: number,
    direction: 'left' | 'right',
    images: string[],
    setImages: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const newIdx = direction === 'left' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= images.length) return;
    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setImages(copy);
  };

  const handleDeleteImage = (
    index: number,
    images: string[],
    setImages: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (images.length <= 1) {
      setImageError('At least 1 image is required.');
      return;
    }
    setImages(images.filter((_, i) => i !== index));
    setImageError(null);
  };

  const handleReplaceImage = (
    index: number,
    file: File | undefined,
    images: string[],
    setImages: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (!file) return;
    setImageError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Only JPG, PNG, and WEBP supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const copy = [...images];
      copy[index] = reader.result as string;
      setImages(copy);
      showToast('Image replaced.');
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // DESIGN MODAL HANDLERS (Clothing Type Selection & Separate Pricing)
  // -------------------------------------------------------------
  const openCreateDesign = () => {
    setEditingDesign(null);
    setDesignName('');
    setDesignCode('REV-DSG-' + Math.floor(100 + Math.random() * 900));
    setDesignDescription('');
    setDesignImages([designs[0]?.artworkImage || '/src/assets/images/hero_banner_automotive_1791711104210.jpg']);
    setImageError(null);

    // Initial clothing type configs
    const initialConfigs: DesignClothingTypeConfig[] = DEFAULT_CLOTHING_TYPES.map((t) => ({
      clothingType: t.name,
      price: t.defaultPrice,
      salePrice: undefined,
      description: `Premium motorsport ${t.name.toLowerCase()} with precision embroidery.`,
      isAvailable: ['Regular T-shirt', 'Oversized T-shirt', 'Hoodie'].includes(t.name),
    }));
    setClothingConfigs(initialConfigs);
    setIsDesignModalOpen(true);
  };

  const openEditDesign = (des: Design) => {
    setEditingDesign(des);
    setDesignName(des.name);
    setDesignCode(des.code);
    setDesignDescription(des.description);
    
    // Look for images in linked products or fallback to artwork
    const linked = products.filter((p) => p.designId === des.id);
    const existingImgs = linked[0]?.images?.length ? linked[0].images : [des.artworkImage];
    setDesignImages(existingImgs.slice(0, 4));
    setImageError(null);

    // Merge existing availableTypes with default options
    const existingTypeMap = new Map((des.availableTypes || []).map((t) => [t.clothingType.toLowerCase(), t]));
    
    // Also include any linked product types
    linked.forEach((p) => {
      if (!existingTypeMap.has(p.clothingType.toLowerCase())) {
        existingTypeMap.set(p.clothingType.toLowerCase(), {
          clothingType: p.clothingType,
          price: p.price,
          salePrice: p.salePrice,
          isAvailable: p.status === 'active',
          description: p.description,
        });
      }
    });

    const mergedConfigs: DesignClothingTypeConfig[] = DEFAULT_CLOTHING_TYPES.map((def) => {
      const existing = existingTypeMap.get(def.name.toLowerCase());
      if (existing) {
        return {
          clothingType: def.name,
          price: existing.price || def.defaultPrice,
          salePrice: existing.salePrice,
          description: existing.description,
          isAvailable: existing.isAvailable,
        };
      }
      return {
        clothingType: def.name,
        price: def.defaultPrice,
        salePrice: undefined,
        description: `Premium motorsport ${def.name.toLowerCase()}`,
        isAvailable: false,
      };
    });

    // Add any custom types from existing
    existingTypeMap.forEach((val) => {
      if (!mergedConfigs.some((c) => c.clothingType.toLowerCase() === val.clothingType.toLowerCase())) {
        mergedConfigs.push(val);
      }
    });

    setClothingConfigs(mergedConfigs);
    setIsDesignModalOpen(true);
  };

  const handleAddCustomClothingType = () => {
    if (!newCustomClothingType.trim()) return;
    const trimmed = newCustomClothingType.trim();
    if (clothingConfigs.some((c) => c.clothingType.toLowerCase() === trimmed.toLowerCase())) {
      alert('This clothing type already exists in the matrix.');
      return;
    }
    setClothingConfigs([
      ...clothingConfigs,
      {
        clothingType: trimmed,
        price: 3500,
        isAvailable: true,
        description: `Custom ${trimmed} silhouette with automotive styling.`,
      },
    ]);
    setNewCustomClothingType('');
    showToast(`Added ${trimmed} to clothing type matrix.`);
  };

  const handleSaveDesign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!designName.trim() || !designCode.trim()) {
      alert('Design name and code are required.');
      return;
    }

    if (designImages.length === 0) {
      setImageError('Please upload at least 1 image (minimum 1, maximum 4).');
      return;
    }

    const enabledTypes = clothingConfigs.filter((c) => c.isAvailable);
    if (enabledTypes.length === 0) {
      alert('Please select at least 1 clothing type that will feature this design.');
      return;
    }

    // Verify all enabled types have valid positive price
    for (const type of enabledTypes) {
      if (!type.price || type.price <= 0) {
        alert(`Please specify a valid price for ${type.clothingType}.`);
        return;
      }
    }

    const designToSave: Design = {
      id: editingDesign?.id || 'dsg-' + Date.now(),
      name: designName.trim(),
      code: designCode.trim().toUpperCase(),
      description: designDescription.trim(),
      artworkImage: designImages[0],
      tags: ['Motorsport', 'Streetwear'],
      productIds: editingDesign?.productIds || [],
      availableTypes: clothingConfigs,
      createdAt: editingDesign?.createdAt || new Date().toISOString(),
    };

    try {
      saveDesignWithClothingTypes(designToSave, clothingConfigs, designImages);
      refreshData();
      setIsDesignModalOpen(false);
      showToast(`Design "${designToSave.name}" and ${enabledTypes.length} clothing silhouettes updated successfully!`);
    } catch (err: any) {
      alert(err.message || 'Error saving design.');
    }
  };

  const handleDeleteDesign = (id: string) => {
    if (window.confirm('Delete this design matrix? All linked apparel silhouettes will be archived.')) {
      deleteDesign(id);
      refreshData();
      showToast('Design matrix deleted.');
    }
  };

  // -------------------------------------------------------------
  // PRODUCT EDIT / CREATE HANDLERS
  // -------------------------------------------------------------
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesignId(designs[0]?.id || '');
    setProdClothingType('Hoodie');
    setProdCategory('Hoodies');
    setProdDescription('');
    setProdImages([designs[0]?.artworkImage || '/src/assets/images/hero_banner_automotive_1791711104210.jpg']);
    setProdPrice(5500);
    setProdSalePrice(undefined);
    setProdSku('REV-NEW-01');
    setProdTags('Streetwear, Automotive');
    setProdSizesStr('S, M, L, XL');
    setProdColorsStr('Asphalt Black');
    setProdAllowedPayments(['COD', 'BANK_TRANSFER', 'ONLINE']);
    setProdIsWinter(false);
    setProdIsFeatured(false);
    setProdIsNewArrival(true);
    setProdIsBestSeller(false);
    setProdStatus('active');
    setImageError(null);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdDesignId(prod.designId);
    setProdClothingType(prod.clothingType);
    setProdCategory(prod.category);
    setProdDescription(prod.description);
    setProdImages((prod.images || []).slice(0, 4));
    setProdPrice(prod.price);
    setProdSalePrice(prod.salePrice);
    setProdSku(prod.sku);
    setProdTags((prod.tags || []).join(', '));
    setProdSizesStr((prod.sizes || []).join(', '));
    setProdColorsStr((prod.colors || []).join(', '));
    setProdAllowedPayments(prod.allowedPaymentMethods || ['COD', 'BANK_TRANSFER', 'ONLINE']);
    setProdIsWinter(prod.isWinterCollection);
    setProdIsFeatured(prod.isFeatured);
    setProdIsNewArrival(prod.isNewArrival);
    setProdIsBestSeller(prod.isBestSeller);
    setProdStatus(prod.status);
    setImageError(null);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodSku.trim()) return;

    if (prodImages.length === 0) {
      setImageError('A minimum of 1 image is required (maximum 4).');
      return;
    }

    const sizesArr = prodSizesStr.split(',').map((s) => s.trim()).filter(Boolean);
    const colorsArr = prodColorsStr.split(',').map((c) => c.trim()).filter(Boolean);
    const targetDesign = designs.find((d) => d.id === prodDesignId);

    const variants: ProductVariant[] = [];
    sizesArr.forEach((s) => {
      colorsArr.forEach((c) => {
        const existingVar = editingProduct?.variants.find((v) => v.size === s && v.color === c);
        variants.push({
          id: existingVar?.id || `var-${prodSku}-${s}-${c}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          sku: `${prodSku}-${s}-${c.substring(0, 3).toUpperCase()}`,
          size: s,
          color: c,
          stock: existingVar ? existingVar.stock : 15,
          available: existingVar ? existingVar.stock > 0 : true,
        });
      });
    });

    const productToSave: Product = {
      id: editingProduct?.id || 'prod-' + Date.now(),
      name: prodName.trim(),
      designId: prodDesignId,
      designName: targetDesign ? targetDesign.name : 'Independent Motif',
      clothingType: prodClothingType,
      category: prodCategory,
      description: prodDescription,
      images: prodImages.slice(0, 4),
      price: Number(prodPrice),
      salePrice: prodSalePrice ? Number(prodSalePrice) : undefined,
      discountPercentage: prodSalePrice ? Math.round(((prodPrice - prodSalePrice) / prodPrice) * 100) : undefined,
      sku: prodSku.trim().toUpperCase(),
      tags: prodTags.split(',').map((t) => t.trim()).filter(Boolean),
      sizes: sizesArr,
      colors: colorsArr,
      variants,
      status: prodStatus,
      isFeatured: prodIsFeatured,
      isNewArrival: prodIsNewArrival,
      isBestSeller: prodIsBestSeller,
      isWinterCollection: prodIsWinter,
      allowedPaymentMethods: prodAllowedPayments,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      saveProduct(productToSave);
      refreshData();
      setIsProductModalOpen(false);
      showToast('Product saved successfully.');
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Delete this product?')) {
      deleteProduct(id);
      refreshData();
      showToast('Product removed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs: Design Matrices vs All Products */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('designs')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xs border transition-colors cursor-pointer ${
              activeSubTab === 'designs'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            Design Matrices ({designs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xs border transition-colors cursor-pointer ${
              activeSubTab === 'products'
                ? 'bg-white text-black border-white font-bold'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            All Apparel Products ({products.length})
          </button>
        </div>

        {activeSubTab === 'designs' ? (
          <button
            onClick={openCreateDesign}
            className="bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-bold uppercase rounded-xs flex items-center gap-1.5 font-display transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Design Matrix</span>
          </button>
        ) : (
          <button
            onClick={openCreateProduct}
            className="bg-white hover:bg-neutral-200 text-black px-4 py-2 text-xs font-bold uppercase rounded-xs flex items-center gap-1.5 font-display transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Single Product</span>
          </button>
        )}
      </div>

      {/* Subtab 1: Design Matrices (Section 3: Core Design + Clothing Type Selection + Separate Pricing) */}
      {activeSubTab === 'designs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {designs.map((des) => {
            const linked = products.filter((p) => p.designId === des.id && p.status === 'active');
            return (
              <div key={des.id} className="bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-4">
                <div className="flex gap-4">
                  <img
                    src={des.artworkImage}
                    alt={des.name}
                    className="w-24 h-24 object-cover bg-neutral-900 rounded-xs border border-neutral-800 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="text-[11px] font-mono text-neutral-500 uppercase">{des.code}</div>
                    <h3 className="font-bold text-white font-display text-base">{des.name}</h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1">{des.description}</p>
                    <div className="mt-2 text-xs font-mono text-emerald-400 font-bold">
                      {linked.length} active clothing type(s) enabled
                    </div>
                  </div>
                </div>

                {/* Clothing cuts badges with their prices */}
                <div className="pt-2 border-t border-neutral-900">
                  <div className="text-[11px] font-mono text-neutral-400 mb-1.5">Enabled Silhouettes & Pricing:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {linked.map((p) => (
                      <span
                        key={p.id}
                        className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] font-mono px-2 py-0.5 rounded-xs flex items-center gap-1.5"
                      >
                        <span>{p.clothingType}:</span>
                        <strong className="text-white">{formatPKR(p.salePrice || p.price)}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-900 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">Matrix Controls</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditDesign(des)}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xs border border-neutral-700 cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Design & Cuts</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDesign(des.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 cursor-pointer"
                      title="Delete Design"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Subtab 2: Products Table */
        <div className="bg-neutral-950 border border-neutral-800 rounded-xs overflow-x-auto">
          <table className="w-full text-xs font-mono text-left text-neutral-300">
            <thead className="bg-neutral-900 text-neutral-400 uppercase text-[11px] border-b border-neutral-800">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Clothing Type</th>
                <th className="p-3">Design Line</th>
                <th className="p-3">Images (1-4)</th>
                <th className="p-3">Base SKU</th>
                <th className="p-3">Price (PKR)</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {products.map((p) => {
                const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                return (
                  <tr key={p.id} className="hover:bg-neutral-900/40">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-xs border border-neutral-800 bg-neutral-900 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white font-display line-clamp-1">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-neutral-500">{p.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-white">{p.clothingType}</td>
                    <td className="p-3 text-neutral-400">{p.designName}</td>
                    <td className="p-3 text-neutral-400">{p.images?.length || 1} image(s)</td>
                    <td className="p-3 font-bold text-neutral-300">{p.sku}</td>
                    <td className="p-3 text-white tabular-nums font-bold">
                      {formatPKR(p.salePrice || p.price)}
                    </td>
                    <td className="p-3 tabular-nums">
                      <span className={totalStock <= 5 ? 'text-amber-400 font-bold' : 'text-neutral-300'}>
                        {totalStock} units
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-xs border ${
                          p.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditProduct(p)}
                          className="p-1 hover:text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================== */}
      {/* DESIGN MATRIX MODAL: 1 to 4 Images + Clothing Types + Separate Pricing */}
      {/* ============================================================== */}
      {isDesignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-950 border border-neutral-800 max-w-4xl w-full p-6 sm:p-8 rounded-xs space-y-6 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-display font-bold text-white uppercase text-base">
                  {editingDesign ? 'Edit Design Matrix & Clothing Cuts' : 'Create New Automotive Design Matrix'}
                </h3>
                <p className="text-xs font-mono text-neutral-400">
                  Select applicable clothing types and set individual prices for each cut under this design.
                </p>
              </div>
              <button
                onClick={() => setIsDesignModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {imageError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDesign} className="space-y-6 text-xs font-mono">
              {/* Basic Design Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1">Design Code *</label>
                  <input
                    type="text"
                    required
                    value={designCode}
                    onChange={(e) => setDesignCode(e.target.value.toUpperCase())}
                    placeholder="REV-DSG-005"
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Design Title *</label>
                  <input
                    type="text"
                    required
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="e.g. RPM Tachometer Redline"
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 mb-1">Design Inspiration & Story</label>
                  <textarea
                    rows={2}
                    value={designDescription}
                    onChange={(e) => setDesignDescription(e.target.value)}
                    placeholder="Describe the car culture motif, rev limiter origin, or racing telemetry coordinates..."
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>
              </div>

              {/* Requirement 3: 1 to 4 Images Upload, Preview, Reorder, Replace, Delete */}
              <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white uppercase text-xs">
                      Product & Design Artwork Images (Min 1, Max 4)
                    </span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      JPG, PNG, or WEBP (Max 5MB each). Drag/reorder to change primary thumbnail.
                    </span>
                  </div>
                  <label className="bg-white hover:bg-neutral-200 text-black px-3 py-1.5 rounded-xs text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageFiles(e.target.files, designImages, setDesignImages)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Thumbnails Grid with Controls */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  {designImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative bg-neutral-950 border border-neutral-800 rounded-xs overflow-hidden group p-2 space-y-2"
                    >
                      <div className="aspect-square bg-neutral-900 rounded-xs overflow-hidden relative">
                        <img src={img} alt={`Slot ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-xs">
                          {idx === 0 ? 'Primary' : `#${idx + 1}`}
                        </span>
                      </div>

                      {/* Image Action Buttons */}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleReorderImage(idx, 'left', designImages, setDesignImages)}
                            className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Left"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === designImages.length - 1}
                            onClick={() => handleReorderImage(idx, 'right', designImages, setDesignImages)}
                            className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Right"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-neutral-400 hover:text-white cursor-pointer text-[10px] underline">
                            Replace
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => handleReplaceImage(idx, e.target.files?.[0], designImages, setDesignImages)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(idx, designImages, setDesignImages)}
                            className="text-neutral-500 hover:text-red-400 cursor-pointer text-[10px]"
                            title="Delete Image"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty Slot Placeholder if < 4 */}
                  {designImages.length < 4 && (
                    <label className="aspect-square border border-dashed border-neutral-800 hover:border-neutral-600 rounded-xs flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors p-4 text-center">
                      <Upload className="w-5 h-5" />
                      <span className="text-[10px] uppercase font-mono">
                        Add Image ({designImages.length}/4)
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageFiles(e.target.files, designImages, setDesignImages)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Requirement 3: Clothing Type Selection & Separate Pricing */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                  <div>
                    <h4 className="font-bold text-white uppercase text-xs">
                      Clothing Type Selection & Separate Pricing (PKR)
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Enable the clothing types featuring this design and enter a separate price for each.
                    </p>
                  </div>

                  {/* Add New Custom Clothing Type */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCustomClothingType}
                      onChange={(e) => setNewCustomClothingType(e.target.value)}
                      placeholder="Add New Type..."
                      className="bg-neutral-900 border border-neutral-800 text-white text-[11px] px-2.5 py-1 rounded-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomClothingType}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] px-2.5 py-1 rounded-xs uppercase font-bold"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Clothing Types Matrix Table */}
                <div className="bg-neutral-900/40 border border-neutral-800 rounded-xs overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-neutral-900 text-neutral-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3 w-10">Enable</th>
                        <th className="p-3">Clothing Type</th>
                        <th className="p-3">Separate Price (PKR) *</th>
                        <th className="p-3">Sale Price (PKR, Opt)</th>
                        <th className="p-3">Silhoutte Note / Cut Specs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {clothingConfigs.map((cfg, idx) => (
                        <tr
                          key={cfg.clothingType}
                          className={cfg.isAvailable ? 'bg-neutral-950/60' : 'opacity-50'}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={cfg.isAvailable}
                              onChange={(e) => {
                                const copy = [...clothingConfigs];
                                copy[idx].isAvailable = e.target.checked;
                                setClothingConfigs(copy);
                              }}
                              className="accent-white cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-semibold text-white">
                            {cfg.clothingType}
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              disabled={!cfg.isAvailable}
                              value={cfg.price}
                              onChange={(e) => {
                                const copy = [...clothingConfigs];
                                copy[idx].price = Number(e.target.value);
                                setClothingConfigs(copy);
                              }}
                              className="w-28 bg-neutral-900 border border-neutral-800 text-white px-2 py-1 rounded-xs font-mono tabular-nums disabled:opacity-40"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              disabled={!cfg.isAvailable}
                              value={cfg.salePrice || ''}
                              placeholder="Regular"
                              onChange={(e) => {
                                const copy = [...clothingConfigs];
                                copy[idx].salePrice = e.target.value ? Number(e.target.value) : undefined;
                                setClothingConfigs(copy);
                              }}
                              className="w-28 bg-neutral-900 border border-neutral-800 text-white px-2 py-1 rounded-xs font-mono tabular-nums disabled:opacity-40"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              disabled={!cfg.isAvailable}
                              value={cfg.description || ''}
                              placeholder="e.g. 240 GSM drop shoulder"
                              onChange={(e) => {
                                const copy = [...clothingConfigs];
                                copy[idx].description = e.target.value;
                                setClothingConfigs(copy);
                              }}
                              className="w-full bg-neutral-900 border border-neutral-800 text-white px-2 py-1 rounded-xs text-[11px] disabled:opacity-40"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDesignModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 hover:text-white rounded-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white text-black font-bold uppercase rounded-xs cursor-pointer hover:bg-neutral-200"
                >
                  Save Design & Sync Silhouettes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PRODUCT MODAL: Single Product Edit (1 to 4 Images) */}
      {/* ============================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-950 border border-neutral-800 max-w-3xl w-full p-6 sm:p-8 rounded-xs space-y-4 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-display font-bold text-white uppercase text-base">
                {editingProduct ? 'Edit Single Clothing Product' : 'Add Single Clothing Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {imageError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Design Matrix Line *</label>
                  <select
                    value={prodDesignId}
                    onChange={(e) => setProdDesignId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  >
                    {designs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} · {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Clothing Type *</label>
                  <input
                    type="text"
                    required
                    value={prodClothingType}
                    onChange={(e) => setProdClothingType(e.target.value)}
                    placeholder="e.g. Hoodie, Oversized T-shirt..."
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Base SKU *</label>
                  <input
                    type="text"
                    required
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value.toUpperCase())}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Sale Price (PKR, Optional)</label>
                  <input
                    type="number"
                    value={prodSalePrice || ''}
                    placeholder="Regular Price"
                    onChange={(e) => setProdSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Images Upload for Product (1 to 4 images) */}
                <div className="sm:col-span-2 p-4 bg-neutral-900/60 border border-neutral-800 rounded-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white uppercase">Product Images (1 to 4)</span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        JPG, PNG, or WEBP (Max 5MB each). First image is primary thumbnail.
                      </span>
                    </div>
                    <label className="bg-white hover:bg-neutral-200 text-black px-3 py-1.5 rounded-xs text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageFiles(e.target.files, prodImages, setProdImages)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {prodImages.map((img, idx) => (
                      <div key={idx} className="relative bg-neutral-950 border border-neutral-800 rounded-xs p-2 space-y-1.5">
                        <img src={img} alt="Product preview" className="aspect-square object-cover rounded-xs" />
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleReorderImage(idx, 'left', prodImages, setProdImages)}
                              className="p-0.5 hover:text-white disabled:opacity-30"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === prodImages.length - 1}
                              onClick={() => handleReorderImage(idx, 'right', prodImages, setProdImages)}
                              className="p-0.5 hover:text-white disabled:opacity-30"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(idx, prodImages, setProdImages)}
                            className="text-neutral-500 hover:text-red-400"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 mb-1">Sizes (Comma separated)</label>
                  <input
                    type="text"
                    value={prodSizesStr}
                    onChange={(e) => setProdSizesStr(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 mb-1">Colors (Comma separated)</label>
                  <input
                    type="text"
                    value={prodColorsStr}
                    onChange={(e) => setProdColorsStr(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white p-2.5 rounded-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 hover:text-white rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white text-black font-bold uppercase rounded-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
