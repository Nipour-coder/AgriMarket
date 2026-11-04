import Link from 'next/link';
import { Sprout } from 'lucide-react';

const groups = [
  { title: 'Shop', links: [['Shop products', '/shop'], ['Categories', '/categories'], ['Shopping cart', '/cart']] },
  { title: 'Your account', links: [['Buyer dashboard', '/buyer/dashboard'], ['My orders', '/buyer/orders'], ['Log in', '/login']] },
  { title: 'For growers', links: [['Sell on AgriMarket', '/sell'], ['Seller dashboard', '/seller/dashboard'], ['Seller products', '/seller/products']] },
  { title: 'Learn more', links: [['About AgriMarket', '/about'], ['Contact us', '/contact'], ['Delivery information', '/delivery-policy'], ['Returns and cancellations', '/returns'], ['Terms and conditions', '/terms'], ['Privacy policy', '/privacy']] },
];

export default function Footer() {
  return (
    <footer className="mt-10 bg-[#183a28] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#d4e5a5] text-[#183a28]"><Sprout size={19} /></span><span className="text-xl font-extrabold">Agri<span className="text-[#d4e5a5]">Market</span></span></Link>
            <p className="mt-4 text-sm leading-6 text-white/65">From Farm to Market. Made Simple. A South African agricultural marketplace prototype connecting growers and buyers.</p>
            <span className="mt-4 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-[#d4e5a5]">DEMONSTRATION WEBSITE · NO LIVE TRANSACTIONS</span>
          </div>
          {groups.map((group) => <div key={group.title}><h2 className="text-xs font-extrabold uppercase tracking-[.14em] text-[#d4e5a5]">{group.title}</h2><ul className="mt-4 space-y-3">{group.links.map(([label, href]) => <li key={href}><Link href={href} className="text-sm text-white/65 transition hover:text-white">{label}</Link></li>)}</ul></div>)}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between"><span>AgriMarket · Prototype</span><span>Sample listings, seller profiles and delivery updates are demonstration data.</span></div>
      </div>
    </footer>
  );
}
