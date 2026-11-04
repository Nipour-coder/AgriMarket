'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          subject: form.get('subject'),
          message: form.get('message'),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to send your message.');
      setSubmitted(true);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to send your message.');
    } finally {
      setSending(false);
    }
  };
  return <div className="mx-auto max-w-3xl px-5 py-12"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#789456]">We&apos;re here to help</p><h1 className="mt-2 text-4xl font-extrabold text-[#20372a]">Contact AgriMarket</h1><p className="mt-3 text-sm leading-6 text-stone-600">Send a message to the AgriMarket team.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}{submitted ? <div role="status" className="mt-7 rounded-3xl bg-green-50 p-6 text-sm font-semibold text-[#426e45]">Your message has been received.</div> : <form onSubmit={submit} className="mt-7 space-y-4 rounded-3xl border border-stone-200 bg-white p-6"><label className="block text-xs font-bold text-stone-600">Name<input name="name" required maxLength={160} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-3 text-sm font-normal" /></label><label className="block text-xs font-bold text-stone-600">Email<input name="email" type="email" required maxLength={320} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-3 text-sm font-normal" /></label><label className="block text-xs font-bold text-stone-600">Subject<input name="subject" required maxLength={200} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-3 text-sm font-normal" /></label><label className="block text-xs font-bold text-stone-600">Message<textarea name="message" required minLength={10} maxLength={5000} rows={4} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-3 text-sm font-normal" /></label><button disabled={sending} className="rounded-xl bg-[#1d4d32] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{sending ? 'Sending…' : 'Send message'}</button></form>}</div>;
}
