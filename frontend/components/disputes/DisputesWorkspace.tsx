'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

type Role = 'buyer' | 'seller' | 'admin';
type OrderLine = { orderItemId: string; sellerId: string; productId: string; name: string; quantity: number };
type Order = { id: string; lines: OrderLine[]; status: string };
type DisputeSummary = {
  id: string;
  orderDisplayId: string;
  productName: string;
  quantity: number;
  category: string;
  direction: 'buyer_to_seller' | 'seller_to_buyer';
  status: string;
  reporterName: string;
  respondentName: string;
  createdAt: string;
  resolution: string | null;
  resolutionReason: string | null;
  refundAmountCents: number | null;
};
type DisputeDetail = Omit<DisputeSummary, 'reporterName' | 'respondentName'> & {
  description: string;
  reporterId: string;
  respondentId: string;
  reporter: { id: string; name: string };
  respondent: { id: string; name: string };
  messages: { id: string; senderId: string; senderName: string; message: string; createdAt: string }[];
  evidence: { id: string; fileName: string; sizeBytes: number; uploaderId: string; createdAt: string }[];
};
type ApiError = { error?: string };

const buyerCategories = [
  'Damaged product',
  'Quality not as described',
  'Wrong product',
  'Incorrect quantity',
  'Order not delivered',
  'Other',
];
const sellerCategories = [
  'False non-delivery claim',
  'Misleading evidence',
  'Product damaged after delivery',
  'Repeated refund abuse',
  'Refused delivery or collection',
  'Other',
];
const resolutions = [
  'Buyer refund recommended',
  'Partial refund recommended',
  'Seller upheld',
  'No refund',
] as const;
const money = (amount: number) => new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  maximumFractionDigits: 2,
}).format(amount);

async function responseError(response: Response, fallback: string): Promise<Error> {
  const result = await response.json() as ApiError;
  return new Error(result.error ?? fallback);
}

export default function DisputesWorkspace({ role, initialOrderId = '' }: { role: Role; initialOrderId?: string }) {
  const isAdmin = role === 'admin';
  const [disputes, setDisputes] = useState<DisputeSummary[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const selectedIdRef = useRef('');
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<DisputeDetail | null>(null);
  const [orderId, setOrderId] = useState(initialOrderId);
  const [orderItemId, setOrderItemId] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [resolution, setResolution] = useState<(typeof resolutions)[number]>('Buyer refund recommended');
  const [resolutionReason, setResolutionReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadDisputes = useCallback(async () => {
    const response = await apiFetch(isAdmin ? '/api/admin/disputes' : '/api/disputes', { cache: 'no-store' });
    if (!response.ok) throw await responseError(response, 'Unable to load complaints.');
    const result = await response.json() as DisputeSummary[];
    setDisputes(result);
    const nextId = result.some((item) => item.id === selectedIdRef.current)
      ? selectedIdRef.current
      : result[0]?.id ?? '';
    selectedIdRef.current = nextId;
    setSelectedId(nextId);
    return nextId;
  }, [isAdmin]);

  const loadDetail = useCallback(async (id: string) => {
    if (!id) return;
    const response = await apiFetch(`/api/disputes/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!response.ok) throw await responseError(response, 'Unable to load complaint details.');
    setDetail(await response.json() as DisputeDetail);
  }, []);

  const loadPage = useCallback(async () => {
    try {
      const nextId = await loadDisputes();
      if (!isAdmin) {
        const response = await apiFetch('/api/orders', { cache: 'no-store' });
        if (!response.ok) throw await responseError(response, 'Unable to load orders.');
        setOrders(await response.json() as Order[]);
      }
      if (nextId) await loadDetail(nextId);
      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to load complaints.');
    } finally {
      setLoaded(true);
    }
  }, [isAdmin, loadDetail, loadDisputes]);

  // This effect starts async data loading; state updates happen after the requests settle.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadPage(); }, [loadPage]);

  const selectDispute = async (id: string) => {
    selectedIdRef.current = id;
    setSelectedId(id);
    setDetail(null);
    setError('');
    try {
      await loadDetail(id);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to load complaint details.');
    }
  };

  const createCase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, orderItemId, category, description }),
      });
      if (!response.ok) throw await responseError(response, 'Unable to submit complaint.');
      const result = await response.json() as { id: string };
      setOrderId('');
      setOrderItemId('');
      setCategory('');
      setDescription('');
      setNotice('Complaint submitted. The other party has been notified.');
      selectedIdRef.current = result.id;
      await loadDisputes();
      await loadDetail(result.id);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to submit complaint.');
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail || !message.trim()) return;
    setBusy(true);
    setError('');
    try {
      const response = await apiFetch(`/api/disputes/${detail.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw await responseError(response, 'Unable to send reply.');
      setMessage('');
      await loadDetail(detail.id);
      await loadDisputes();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to send reply.');
    } finally {
      setBusy(false);
    }
  };

  const uploadEvidence = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!detail || !files.length) return;
    setBusy(true);
    setError('');
    setNotice('');
    let pendingEvidenceId: string | null = null;
    try {
      for (const file of files) {
        const prepare = await apiFetch(`/api/disputes/${detail.id}/evidence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, contentType: file.type, sizeBytes: file.size }),
        });
        if (!prepare.ok) throw await responseError(prepare, 'Unable to prepare evidence upload.');
        const target = await prepare.json() as { id: string; url: string; fields: Record<string, string> };
        pendingEvidenceId = target.id;
        const formData = new FormData();
        Object.entries(target.fields).forEach(([key, value]) => formData.append(key, value));
        formData.append('file', file);
        const uploaded = await fetch(target.url, { method: 'POST', body: formData });
        if (!uploaded.ok) throw new Error(`Storage rejected ${file.name}. Check the bucket CORS policy and allowed file size.`);
        const completed = await apiFetch(`/api/disputes/${detail.id}/evidence/${target.id}`, { method: 'POST' });
        if (!completed.ok) throw await responseError(completed, `Unable to verify ${file.name} upload.`);
        pendingEvidenceId = null;
      }
      setNotice('Evidence uploaded to private storage.');
      await loadDetail(detail.id);
    } catch (issue) {
      if (pendingEvidenceId) {
        await apiFetch(`/api/disputes/${detail.id}?evidenceId=${encodeURIComponent(pendingEvidenceId)}`, { method: 'DELETE' });
      }
      setError(issue instanceof Error ? issue.message : 'Unable to upload evidence.');
    } finally {
      setBusy(false);
    }
  };

  const updateAdminStatus = async (status: 'Under Review' | 'Resolved') => {
    if (!detail) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch(`/api/admin/disputes/${detail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolution: status === 'Resolved' ? resolution : undefined,
          resolutionReason: status === 'Resolved' ? resolutionReason : undefined,
          refundAmountCents: status === 'Resolved' && ['Buyer refund recommended', 'Partial refund recommended'].includes(resolution)
            ? Math.round(Number(refundAmount) * 100)
            : undefined,
        }),
      });
      if (!response.ok) throw await responseError(response, 'Unable to update complaint.');
      setNotice(status === 'Resolved' ? 'Decision saved and both parties notified. No payment refund was processed.' : 'Complaint marked under review.');
      await loadDisputes();
      await loadDetail(detail.id);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to update complaint.');
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <div className="mx-auto max-w-6xl px-5 py-20 text-sm text-stone-500">Loading complaints…</div>;

  return <main className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
    <Link href={isAdmin ? '/admin/dashboard' : `/${role}/dashboard`} className="text-sm font-bold text-[#426e45]">← {isAdmin ? 'Admin dashboard' : 'Dashboard'}</Link>
    <p className="mt-5 text-xs font-bold uppercase tracking-[.15em] text-[#789456]">{isAdmin ? 'Administrator' : `${role} account`}</p>
    <h1 className="mt-2 text-3xl font-extrabold text-[#20372a]">{isAdmin ? 'Dispute review queue' : 'Complaints and resolutions'}</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{isAdmin
      ? 'Review order complaints, evidence, and both parties’ replies. Refund recommendations are recorded only; payment is not processed.'
      : 'Open an order complaint, share evidence and communicate with the other party. An administrator can review unresolved cases.'}</p>

    {notice && <p role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

    {!isAdmin && <form onSubmit={createCase} className="mt-7 rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
      <h2 className="text-lg font-extrabold text-[#20372a]">Open a complaint</h2>
      <p className="mt-1 text-xs text-stone-500">Provide the order, issue and enough detail for both sides to understand the claim.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-stone-700">Order
          <select required value={orderId} onChange={(event) => { setOrderId(event.target.value); setOrderItemId(''); }} className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-normal">
            <option value="">Select an order</option>
            {orders.filter((order) => !['Cancelled', 'Rejected'].includes(order.status)).map((order) => <option key={order.id} value={order.id}>{order.id}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-stone-700">Product in dispute
          <select required value={orderItemId} onChange={(event) => setOrderItemId(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-normal">
            <option value="">Select the order item</option>
            {orders.find((order) => order.id === orderId)?.lines.map((line) => <option key={line.orderItemId} value={line.orderItemId}>{line.name} · quantity {line.quantity}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-stone-700">Complaint type
          <select required value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-normal">
            <option value="">Select a reason</option>
            {(role === 'buyer' ? buyerCategories : sellerCategories).map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <label className="mt-4 block text-xs font-bold text-stone-700">Explain what happened
        <textarea required minLength={20} maxLength={5000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 text-sm font-normal" placeholder="Include relevant dates, what was agreed, and what outcome you are seeking." />
      </label>
      <button disabled={busy || !orders.length} className="mt-4 rounded-full bg-[#1d4d32] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit complaint'}</button>
      {!orders.length && <p className="mt-2 text-xs text-stone-500">Complaints can be opened for orders on your account.</p>}
    </form>}

    <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.7fr)]">
      <section>
        <h2 className="mb-3 text-sm font-extrabold text-[#20372a]">{isAdmin ? 'All complaints' : 'Your complaint history'} <span className="text-stone-400">({disputes.length})</span></h2>
        {disputes.length ? <div className="space-y-2">        {disputes.map((item) => <button key={item.id} type="button" onClick={() => void selectDispute(item.id)} className={`w-full rounded-2xl border p-4 text-left ${selectedId === item.id ? 'border-[#1d4d32] bg-green-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}>
          <div className="flex items-start justify-between gap-2"><span className="text-xs font-extrabold text-[#20372a]">{item.orderDisplayId}</span><span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-700">{item.status}</span></div>
          <p className="mt-2 text-xs font-semibold text-stone-700">{item.category}</p>
          <p className="mt-1 text-[11px] text-stone-500">{item.productName} · quantity {item.quantity}</p>
          <p className="mt-1 text-[11px] text-stone-500">{item.direction === 'buyer_to_seller' ? 'Buyer → Seller' : 'Seller → Buyer'} · {new Date(item.createdAt).toLocaleDateString('en-ZA')}</p>
          {isAdmin && <p className="mt-1 text-[11px] text-stone-500">{item.reporterName} vs {item.respondentName}</p>}
        </button>)}</div> : <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">{isAdmin ? 'No complaints have been submitted.' : 'No complaints yet.'}</div>}
      </section>

      <section className="min-w-0">
        {!detail ? <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">Select a complaint to view its case file and replies.</div> : <article className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="font-mono text-xs font-bold text-[#426e45]">{detail.orderDisplayId} · {detail.id.slice(0, 8).toUpperCase()}</p><h2 className="mt-2 text-xl font-extrabold text-[#20372a]">{detail.category}</h2><p className="mt-1 text-xs text-stone-500">{detail.productName} · quantity {detail.quantity}</p><p className="mt-1 text-xs text-stone-500">{detail.direction === 'buyer_to_seller' ? 'Buyer complaint' : 'Seller complaint'} · Reported by {detail.reporter.name}</p></div>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">{detail.status}</span>
          </div>
          <div className="mt-5 rounded-2xl bg-[#f7f8f3] p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">{detail.description}</p><p className="mt-2 text-[11px] text-stone-500">Respondent: {detail.respondent.name}</p></div>
          {detail.resolution && <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-950"><strong>{detail.resolution}</strong>{detail.resolutionReason && <p className="mt-1">{detail.resolutionReason}</p>}{detail.refundAmountCents ? <p className="mt-2 font-semibold">Recommended amount: {money(detail.refundAmountCents / 100)}. Not processed as a payment.</p> : null}</div>}

          <div className="mt-6">
            <h3 className="text-sm font-extrabold text-[#20372a]">Evidence <span className="font-normal text-stone-500">(private files)</span></h3>
            {detail.evidence.length ? <ul className="mt-3 space-y-2">{detail.evidence.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-100 p-3 text-xs"><span className="truncate font-semibold text-stone-700">{item.fileName} <span className="font-normal text-stone-500">· {(item.sizeBytes / 1024 / 1024).toFixed(1)} MB</span></span><a href={`/api/disputes/${detail.id}/evidence/${item.id}`} className="font-bold text-[#426e45]">Download</a></li>)}</ul> : <p className="mt-2 text-xs text-stone-500">No evidence uploaded yet.</p>}
            {!isAdmin && !['Resolved', 'Closed'].includes(detail.status) && <label className="mt-3 inline-flex cursor-pointer rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50">{busy ? 'Uploading…' : 'Add photo or video'}<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" multiple disabled={busy || detail.evidence.length >= 5} onChange={(event) => void uploadEvidence(event)} className="sr-only" /></label>}
            <p className="mt-2 text-[11px] leading-5 text-stone-500">Up to 5 photos/videos, 25 MB each. Evidence is stored privately and accessible only to case participants and administrators.</p>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-extrabold text-[#20372a]">Case conversation</h3>
            <div className="mt-3 max-h-80 space-y-3 overflow-y-auto rounded-2xl bg-stone-50 p-3">
              {detail.messages.length ? detail.messages.map((item) => <div key={item.id} className="rounded-xl bg-white p-3"><div className="flex justify-between gap-3 text-[11px]"><strong className="text-stone-700">{item.senderName}</strong><time className="text-stone-400">{new Date(item.createdAt).toLocaleString('en-ZA')}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-stone-700">{item.message}</p></div>) : <p className="p-3 text-xs text-stone-500">No replies yet.</p>}
            </div>
            {!isAdmin && !['Resolved', 'Closed'].includes(detail.status) && <form onSubmit={sendMessage} className="mt-3"><label className="sr-only" htmlFor="dispute-reply">Add a reply</label><textarea id="dispute-reply" required maxLength={3000} rows={3} value={message} onChange={(event) => setMessage(event.target.value)} className="w-full rounded-xl border border-stone-200 px-3 py-3 text-sm" placeholder="Reply with relevant information…" /><button disabled={busy || !message.trim()} className="mt-2 rounded-full bg-[#1d4d32] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Send reply</button></form>}
          </div>

          {isAdmin && !['Resolved', 'Closed'].includes(detail.status) && <div className="mt-6 border-t border-stone-100 pt-5">
            <h3 className="text-sm font-extrabold text-[#20372a]">Administrator review</h3>
            <button type="button" disabled={busy || detail.status === 'Under Review'} onClick={() => void updateAdminStatus('Under Review')} className="mt-3 rounded-xl border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-700 disabled:opacity-50">Mark under review</button>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-stone-700">Decision
                <select value={resolution} onChange={(event) => setResolution(event.target.value as (typeof resolutions)[number])} className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm font-normal">
                  {resolutions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              {['Buyer refund recommended', 'Partial refund recommended'].includes(resolution) && <label className="text-xs font-bold text-stone-700">Recommended amount (ZAR)
                <input required type="number" min="0.01" step="0.01" value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 text-sm font-normal" />
              </label>}
            </div>
            <label className="mt-3 block text-xs font-bold text-stone-700">Reason for decision
              <textarea required minLength={15} maxLength={3000} rows={3} value={resolutionReason} onChange={(event) => setResolutionReason(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 text-sm font-normal" />
            </label>
            <button type="button" disabled={busy} onClick={() => void updateAdminStatus('Resolved')} className="mt-3 rounded-full bg-[#1d4d32] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Record decision</button>
            <p className="mt-2 text-[11px] leading-5 text-amber-800">This records an administrative recommendation only. No payment provider is connected, so refunds cannot be executed here.</p>
          </div>}
        </article>}
      </section>
    </div>
  </main>;
}
