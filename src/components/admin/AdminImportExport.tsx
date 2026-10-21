import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  generateProductCsvTemplate,
  parseAndValidateCsv,
  exportOrdersCsv,
  exportInventoryCsv,
  saveProduct,
  getAllProducts,
} from '../../services/storage';
import { Product, ProductVariant } from '../../types';
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, FileCheck } from 'lucide-react';

export const AdminImportExport: React.FC = () => {
  const { products, refreshData, showToast } = useStore();

  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<ReturnType<typeof parseAndValidateCsv> | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const csv = generateProductCsvTemplate();
    downloadBlob(csv, 'REVORA_Product_Import_Template.csv', 'text/csv');
    showToast('Downloaded CSV template');
  };

  const handleExportOrders = () => {
    const csv = exportOrdersCsv();
    downloadBlob(csv, `REVORA_Orders_Export_${Date.now()}.csv`, 'text/csv');
    showToast('Exported orders CSV');
  };

  const handleExportInventory = () => {
    const csv = exportInventoryCsv();
    downloadBlob(csv, `REVORA_Inventory_Export_${Date.now()}.csv`, 'text/csv');
    showToast('Exported inventory CSV');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      const res = parseAndValidateCsv(text);
      setPreviewResult(res);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!previewResult || previewResult.validCount === 0) return;

    setIsImporting(true);
    let importedCount = 0;

    try {
      const currentProducts = getAllProducts();

      for (const row of previewResult.rows) {
        if (!row.isValid) continue;

        const data = row.data;
        const name = data['Product Name'];
        const designName = data['Design Name'] || 'Apex Motifs';
        const clothingType = (data['Clothing Type'] as any) || 'Hoodie';
        const category = data['Category'] || 'Hoodies';
        const price = Number(data['Base Price']);
        const salePrice = data['Sale Price'] ? Number(data['Sale Price']) : undefined;
        const baseSku = data['SKU'] || 'REV-IMP';
        const size = data['Size'] || 'M';
        const color = data['Color'] || 'Black';
        const variantSku = data['Variant SKU'] || `${baseSku}-${size}-${color}`;
        const stock = Number(data['Stock']) || 10;
        const isFeatured = data['Is Featured (true/false)']?.toLowerCase() === 'true';
        const isWinter = data['Is Winter Collection (true/false)']?.toLowerCase() === 'true';

        // Check if product already exists by Base SKU
        let existingProd = currentProducts.find((p) => p.sku === baseSku.toUpperCase());

        if (existingProd) {
          // Add or update variant
          const varIdx = existingProd.variants.findIndex((v) => v.sku === variantSku.toUpperCase());
          if (varIdx >= 0) {
            existingProd.variants[varIdx].stock = stock;
            existingProd.variants[varIdx].available = stock > 0;
          } else {
            existingProd.variants.push({
              id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              sku: variantSku.toUpperCase(),
              size,
              color,
              stock,
              available: stock > 0,
            });
            if (!existingProd.sizes.includes(size)) existingProd.sizes.push(size);
            if (!existingProd.colors.includes(color)) existingProd.colors.push(color);
          }
          saveProduct(existingProd);
        } else {
          // Create new product
          const newProduct: Product = {
            id: 'prod-imp-' + Date.now() + '-' + importedCount,
            name,
            designId: 'dsg-tachometer',
            designName,
            clothingType,
            category,
            description: data['Description'] || 'Imported via REVORA bulk matrix',
            images: [products[0]?.images[0] || ''],
            price,
            salePrice,
            sku: baseSku.toUpperCase(),
            tags: (data['Tags (comma separated)'] || '').split(',').map((t) => t.trim()).filter(Boolean),
            sizes: [size],
            colors: [color],
            variants: [
              {
                id: `var-imp-${Date.now()}-${importedCount}`,
                sku: variantSku.toUpperCase(),
                size,
                color,
                stock,
                available: stock > 0,
              },
            ],
            status: 'active',
            isFeatured,
            isNewArrival: true,
            isBestSeller: false,
            isWinterCollection: isWinter,
            allowedPaymentMethods: ['COD', 'ONLINE', 'BANK_TRANSFER'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          saveProduct(newProduct);
        }
        importedCount++;
      }

      refreshData();
      setIsImporting(false);
      setImportSummary(`Successfully imported ${importedCount} records into the catalog.`);
      setPreviewResult(null);
      showToast(`Imported ${importedCount} product variants.`);
    } catch (err: any) {
      setIsImporting(false);
      alert(err.message || 'Import error');
    }
  };

  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-neutral-800">
        <h2 className="text-xl font-bold text-white uppercase font-display">
          Bulk Data Import & CSV Export Studio
        </h2>
        <p className="text-xs font-mono text-neutral-400">
          Upload multi-variant product sheets with automated error detection or export store records
        </p>
      </div>

      {/* Export Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-xs space-y-3">
          <div className="flex items-center gap-2 text-white font-bold font-display uppercase text-xs">
            <FileSpreadsheet className="w-4 h-4 text-neutral-400" />
            <span>Product Import Template</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Download our verified CSV format with column schema for sizes, colors, and SKUs.
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white py-2 text-xs font-mono rounded-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-xs space-y-3">
          <div className="flex items-center gap-2 text-white font-bold font-display uppercase text-xs">
            <FileSpreadsheet className="w-4 h-4 text-neutral-400" />
            <span>Export Store Orders</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Export all completed and pending orders with customer addresses and totals.
          </p>
          <button
            onClick={handleExportOrders}
            className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white py-2 text-xs font-mono rounded-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Orders (.CSV)</span>
          </button>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-xs space-y-3">
          <div className="flex items-center gap-2 text-white font-bold font-display uppercase text-xs">
            <FileSpreadsheet className="w-4 h-4 text-neutral-400" />
            <span>Export Full Inventory</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Export comprehensive variant matrix with SKU, sizes, colorways, and current stock.
          </p>
          <button
            onClick={handleExportInventory}
            className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white py-2 text-xs font-mono rounded-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Inventory (.CSV)</span>
          </button>
        </div>
      </div>

      {/* CSV Upload & Validation Module */}
      <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-white uppercase font-display tracking-wider">
            Upload & Preview Product CSV
          </h3>
          <p className="text-xs font-mono text-neutral-400 mt-1">
            Our engine validates required columns, positive price fields, and detects duplicate SKUs before modifying database records.
          </p>
        </div>

        <div className="border-2 border-dashed border-neutral-800 hover:border-neutral-600 rounded-xs p-8 text-center transition-colors">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            id="csv-file-input"
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
            <Upload className="w-8 h-8 mx-auto text-neutral-500" />
            <div className="text-xs text-neutral-300 font-medium">
              Click to select or drop your filled CSV file
            </div>
            <div className="text-[11px] font-mono text-neutral-500">
              Only standard comma-separated .CSV files supported
            </div>
          </label>
        </div>

        {fileName && (
          <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Selected File: <strong className="text-white">{fileName}</strong></span>
          </div>
        )}

        {importSummary && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono rounded-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{importSummary}</span>
          </div>
        )}

        {/* Validation Preview Table */}
        {previewResult && (
          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="text-white font-bold">
                  Validated {previewResult.rows.length} Rows
                </span>
                <span className="text-emerald-400">
                  {previewResult.validCount} Ready to Import
                </span>
                {previewResult.errorCount > 0 && (
                  <span className="text-red-400">
                    {previewResult.errorCount} Rows with Errors
                  </span>
                )}
              </div>

              <button
                onClick={handleExecuteImport}
                disabled={previewResult.validCount === 0 || isImporting}
                className={`px-5 py-2 rounded-xs text-xs font-bold uppercase tracking-wider font-display cursor-pointer transition-colors ${
                  previewResult.validCount > 0
                    ? 'bg-white text-black hover:bg-neutral-200 shadow-md'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isImporting ? 'Importing Rows...' : `Import ${previewResult.validCount} Valid Items`}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto border border-neutral-800 rounded-xs">
              <table className="w-full text-xs font-mono text-left text-neutral-300">
                <thead className="bg-neutral-900 text-neutral-400 uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-2">Line</th>
                    <th className="p-2">Product Name</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Variant SKU</th>
                    <th className="p-2">Stock</th>
                    <th className="p-2">Validation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {previewResult.rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.isValid ? 'hover:bg-neutral-900/40' : 'bg-red-950/20'}
                    >
                      <td className="p-2 font-bold">{row.rowNumber}</td>
                      <td className="p-2 text-white">{row.data['Product Name']}</td>
                      <td className="p-2 text-neutral-400">{row.data['Clothing Type']}</td>
                      <td className="p-2 text-white tabular-nums">{row.data['Base Price']}</td>
                      <td className="p-2 font-bold">{row.data['Variant SKU']}</td>
                      <td className="p-2">{row.data['Stock']}</td>
                      <td className="p-2">
                        {row.isValid ? (
                          <span className="text-emerald-400 font-bold">Valid</span>
                        ) : (
                          <span className="text-red-400 text-[10px]">
                            {row.errors.join(', ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
