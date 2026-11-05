'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { MOCK_CATEGORIES, PROVINCES_LIST } from '@/data/mockData';
import { apiFetch } from '@/lib/apiFetch';
import { PackagePlus, Pencil, Trash2, UploadCloud, X, Image as ImageIcon, Loader2 } from 'lucide-react';

type SellerProduct = {
  id: string;
  name: string;
  category: string;
  province: string;
  price: number | null;
  priceUnit: string;
  minimumQuantity: number;
  stockQuantity: number;
  image?: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
};

type ProductForm = Omit<SellerProduct, 'id' | 'status'>;
const initialForm: ProductForm = {
  name: '',
  category: MOCK_CATEGORIES[0].name,
  province: PROVINCES_LIST[0].name,
  price: 0,
  priceUnit: 'per kg',
  minimumQuantity: 1,
  stockQuantity: 0,
  image: '',
  description: '',
};

export default function SellerProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    try {
      const response = await apiFetch('/api/seller/products', { cache: 'no-store' });
      const result = await response.json() as SellerProduct[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) throw new Error('error' in result ? result.error : 'Unable to load your products.');
      setProducts(result);
      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to load your products.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    try {
      const data = new FormData();
      data.append('image', file);

      const response = await apiFetch('/api/upload/product-image', {
        method: 'POST',
        body: data,
      });

      const result = await response.json() as { success?: boolean; url?: string; error?: string };
      if (!response.ok || !result.url) {
        throw new Error(result.error || 'Failed to upload product picture.');
      }

      setForm((prev) => ({ ...prev, image: result.url! }));
      setNotice('Picture uploaded successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload image.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: '' }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch(editing ? `/api/products/${editing}` : '/api/products', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to save product.');
      setForm(initialForm);
      setEditing(null);
      setNotice('Product saved to your AgriMarket account.');
      await loadProducts();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (product: SellerProduct) => {
    setEditing(product.id);
    setForm({
      name: product.name,
      category: product.category,
      province: product.province,
      price: product.price,
      priceUnit: product.priceUnit,
      minimumQuantity: product.minimumQuantity,
      stockQuantity: product.stockQuantity,
      image: product.image || '',
      description: product.description || '',
    });
  };

  const archive = async (product: SellerProduct) => {
    setError('');
    try {
      const response = await apiFetch(`/api/products/${product.id}`, { method: 'DELETE' });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to archive product.');
      await loadProducts();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to archive product.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">Seller portal</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">Products</h1>
      <p className="mt-2 text-sm text-stone-500">Listings are stored on the server. They remain drafts until the seller account is verified.</p>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-800">{notice}</p>}

      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_1.1fr]">
        <form onSubmit={submit} className="h-fit space-y-4 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-extrabold text-[#20372a]">
            <PackagePlus size={18} className="text-[#789456]" />
            {editing ? 'Edit product' : 'Add a product'}
          </h2>

          <label className="block text-xs font-bold text-stone-600">
            Product name *
            <input required minLength={2} maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal" placeholder="e.g. Grade A Yellow Maize" />
          </label>

          {/* Product Picture Upload Section */}
          <div className="border border-dashed border-stone-200 rounded-2xl p-4 bg-stone-50/50">
            <label className="block text-xs font-bold text-stone-700 mb-2">
              Product Picture
            </label>

            {form.image ? (
              <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-white">
                <div className="h-44 w-full relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.image}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition shadow"
                    title="Remove picture"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="p-2.5 flex items-center justify-between text-xs bg-stone-50 text-stone-600">
                  <span className="truncate max-w-[220px] font-mono text-[11px]">{form.image}</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-bold text-[#426e45] hover:underline ml-2 shrink-0"
                  >
                    Change photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 px-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-[#426e45] flex items-center justify-center mb-2">
                  {uploadingImage ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
                </div>
                <p className="text-xs font-bold text-stone-700">
                  {uploadingImage ? 'Uploading picture…' : 'Upload product photo'}
                </p>
                <p className="text-[11px] text-stone-400 mt-1 mb-3">
                  PNG, JPG, or WebP up to 10MB
                </p>
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-stone-800 text-white hover:bg-stone-900 transition shadow-sm disabled:opacity-50"
                >
                  Choose Picture
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold text-stone-600">Category *
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal">
                {MOCK_CATEGORIES.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-stone-600">Province *
              <select value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal">
                {PROVINCES_LIST.map((province) => <option key={province.id} value={province.name}>{province.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-stone-600">Price (ZAR)
              <input type="number" min="0" step="0.01" value={form.price ?? ''} onChange={(event) => setForm({ ...form, price: event.target.value === '' ? null : Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal" placeholder="Leave empty for quote" />
            </label>
            <label className="text-xs font-bold text-stone-600">Price unit *
              <input required maxLength={80} value={form.priceUnit} onChange={(event) => setForm({ ...form, priceUnit: event.target.value })} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal" placeholder="e.g. 1 Metric Tonne" />
            </label>
            <label className="text-xs font-bold text-stone-600">Available quantity *
              <input required type="number" min="0" step="1" value={form.stockQuantity} onChange={(event) => setForm({ ...form, stockQuantity: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold text-stone-600">Minimum order *
              <input required type="number" min="1" step="1" value={form.minimumQuantity} onChange={(event) => setForm({ ...form, minimumQuantity: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal" />
            </label>
          </div>

          <label className="block text-xs font-bold text-stone-600">
            Product Description
            <textarea
              rows={3}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm font-normal"
              placeholder="Describe grade, quality certifications, packaging, or collection instructions..."
            />
          </label>

          <div className="flex gap-2 pt-2">
            <button disabled={saving || uploadingImage} className="rounded-xl bg-[#1d4d32] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#153a25] transition disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm(initialForm); }} className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50">
                Cancel
              </button>
            )}
          </div>
        </form>

        <section>
          <h2 className="font-extrabold text-[#20372a]">
            Your products <span className="text-sm font-semibold text-stone-400">({products.length})</span>
          </h2>
          {!loaded ? (
            <p className="mt-4 text-sm text-stone-500">Loading…</p>
          ) : products.length ? (
            <div className="mt-4 space-y-3">
              {products.map((product) => (
                <article key={product.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm hover:border-stone-300 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      {product.image ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-stone-100 text-stone-400 shrink-0 flex items-center justify-center border border-stone-200">
                          <ImageIcon size={22} />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[#20372a] text-sm">{product.name}</p>
                        <p className="mt-0.5 text-xs text-stone-500 font-medium">
                          {product.category} · {product.price === null ? 'Request a quote' : `R ${product.price.toFixed(2)}`} {product.price === null ? '' : product.priceUnit}
                        </p>
                        <p className="mt-1 text-[11px] text-stone-400">
                          Stock: {product.stockQuantity} · Min Order: {product.minimumQuantity} · {product.province}
                        </p>
                        <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          product.status === 'active' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
                        }`}>
                          {product.status === 'active' ? 'Published' : product.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => edit(product)} aria-label={`Edit ${product.name}`} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition">
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => void archive(product)} aria-label={`Archive ${product.name}`} className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-600 transition">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
              No products yet. Add your first product above.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
