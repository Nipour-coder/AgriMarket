'use client';

import { useCallback, useEffect, useState } from 'react';
import { MOCK_CATEGORIES, PROVINCES_LIST } from '@/data/mockData';
import { PackagePlus, Pencil, Trash2 } from 'lucide-react';

type SellerProduct = {
  id: string;
  name: string;
  category: string;
  province: string;
  price: number | null;
  priceUnit: string;
  minimumQuantity: number;
  stockQuantity: number;
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
};

export default function SellerProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/seller/products', { cache: 'no-store' });
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

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(editing ? `/api/products/${editing}` : '/api/products', {
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
    });
  };

  const archive = async (product: SellerProduct) => {
    setError('');
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
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
      <div className="mt-7 grid gap-7 lg:grid-cols-[.9fr_1.1fr]">
        <form onSubmit={submit} className="h-fit space-y-4 rounded-3xl border border-stone-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-extrabold text-[#20372a]"><PackagePlus size={18} className="text-[#789456]" />{editing ? 'Edit product' : 'Add a product'}</h2>
          <label className="block text-xs font-bold text-stone-600">Product name<input required minLength={2} maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold text-stone-600">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal">{MOCK_CATEGORIES.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label>
            <label className="text-xs font-bold text-stone-600">Province<select value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-normal">{PROVINCES_LIST.map((province) => <option key={province.id} value={province.name}>{province.name}</option>)}</select></label>
            <label className="text-xs font-bold text-stone-600">Price (ZAR)<input type="number" min="0" step="0.01" value={form.price ?? ''} onChange={(event) => setForm({ ...form, price: event.target.value === '' ? null : Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal" /></label>
            <label className="text-xs font-bold text-stone-600">Price unit<input required maxLength={80} value={form.priceUnit} onChange={(event) => setForm({ ...form, priceUnit: event.target.value })} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal" /></label>
            <label className="text-xs font-bold text-stone-600">Available quantity<input required type="number" min="0" step="1" value={form.stockQuantity} onChange={(event) => setForm({ ...form, stockQuantity: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal" /></label>
            <label className="text-xs font-bold text-stone-600">Minimum order<input required type="number" min="1" step="1" value={form.minimumQuantity} onChange={(event) => setForm({ ...form, minimumQuantity: Number(event.target.value) })} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-normal" /></label>
          </div>
          <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Image upload is disabled until secure object storage is configured.</p>
          <div className="flex gap-2"><button disabled={saving} className="rounded-xl bg-[#1d4d32] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(initialForm); }} className="rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-600">Cancel</button>}</div>
        </form>

        <section>
          <h2 className="font-extrabold text-[#20372a]">Your products <span className="text-sm font-semibold text-stone-400">({products.length})</span></h2>
          {!loaded ? <p className="mt-4 text-sm text-stone-500">Loading…</p> : products.length ? <div className="mt-4 space-y-3">{products.map((product) => <article key={product.id} className="rounded-2xl border border-stone-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-[#20372a]">{product.name}</p><p className="mt-1 text-xs text-stone-500">{product.category} · {product.price === null ? 'Request a quote' : `R ${product.price.toFixed(2)}`} {product.price === null ? '' : product.priceUnit}</p><p className="mt-1 text-[11px] text-stone-500">Stock: {product.stockQuantity} · Minimum: {product.minimumQuantity} · {product.province}</p><span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${product.status === 'active' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>{product.status === 'active' ? 'Published' : product.status}</span></div><div className="flex gap-1"><button type="button" onClick={() => edit(product)} aria-label={`Edit ${product.name}`} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"><Pencil size={15} /></button><button type="button" onClick={() => void archive(product)} aria-label={`Archive ${product.name}`} className="rounded-lg p-2 text-stone-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></div></div></article>)}</div> : <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">No products yet.</div>}
        </section>
      </div>
    </div>
  );
}
