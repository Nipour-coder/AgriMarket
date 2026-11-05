'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Menu, ShoppingBasket, Sprout, X, LogOut } from 'lucide-react';
import { useStore } from '@/lib/store';
import { clearStoredToken } from '@/lib/apiFetch';

type SessionUser = { id: string; name: string; role: 'buyer' | 'seller' | 'admin' };

export default function Navbar() {
  const { itemCount } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to check the current sign-in session.');
      const result = await response.json() as { user: SessionUser | null };
      setUser(result.user);
    } catch (issue) {
      console.error('Unable to load account session', issue);
    }
  }, []);

  useEffect(() => {
    void loadSession();
    window.addEventListener('agrimarket:auth', loadSession);
    return () => window.removeEventListener('agrimarket:auth', loadSession);
  }, [loadSession]);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop products' },
    { href: '/categories', label: 'Categories' },
    { href: '/sell', label: 'Sell on AgriMarket' },
    ...(user?.role === 'buyer' ? [{ href: '/buyer/orders', label: 'My orders' }] : []),
    ...(user?.role === 'buyer' ? [{ href: '/buyer/disputes', label: 'Complaints' }] : []),
    ...(user?.role === 'seller' ? [{ href: '/seller/dashboard', label: 'Seller dashboard' }, { href: '/seller/disputes', label: 'Complaints' }] : []),
    ...(user?.role === 'admin' ? [{ href: '/admin/dashboard', label: 'Admin dashboard' }, { href: '/admin/disputes', label: 'Disputes' }] : []),
  ];

  const signOut = async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (!response.ok) {
      console.error('Unable to sign out.');
      return;
    }
    clearStoredToken();
    setUser(null);
    window.dispatchEvent(new Event('agrimarket:auth'));
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-green-950/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3.5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="AgriMarket home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#194d32] text-white">
            <Sprout size={22} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-[#173c2a]">
            Agri<span className="text-[#77934c]">Market</span>
            <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[.18em] text-stone-500">From Farm to Market. Made Simple.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold text-stone-600 transition hover:text-[#194d32]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="max-w-36 truncate text-xs font-semibold text-stone-600">{user.name}</span>
              <button type="button" onClick={signOut} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"><LogOut size={14} />Sign out</button>
            </div>
          ) : <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 sm:block">Log in</Link>}
          <Link href="/cart" className="relative inline-flex items-center gap-2 rounded-full bg-[#194d32] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#103b25]" aria-label={`Cart, ${itemCount} items`}>
            <ShoppingBasket size={18} />
            <span className="hidden sm:inline">Cart</span>
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#d8e6a8] px-1 text-[11px] font-extrabold text-[#173c2a]">{itemCount}</span>
          </Link>
          <button type="button" className="rounded-full p-2 text-stone-700 hover:bg-stone-100 lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-stone-100 bg-white px-5 py-3 lg:hidden" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold text-stone-700 hover:bg-green-50">
              {link.label}
            </Link>
          ))}
          {user ? <button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-stone-700 hover:bg-green-50"><LogOut size={15} />Sign out</button> : <Link href="/login" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold text-stone-700 hover:bg-green-50">Log in / Register</Link>}
        </nav>
      )}
    </header>
  );
}
