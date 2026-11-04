import Link from 'next/link';
import { ArrowDownRight, ArrowRight, Leaf, MapPin, PackageCheck, ShieldCheck, Truck, CheckCircle2 } from 'lucide-react';
import { MOCK_CATEGORIES, PROVINCES_LIST } from '@/data/mockData';
import FeaturedProducts from '@/components/marketplace/FeaturedProducts';
import SellerHighlights from '@/components/marketplace/SellerHighlights';

export default function Home() {
  return (
    <div className="pb-16 bg-[#fafbf7]">
      {/* Hero Section with Vibrant Green Agricultural Crop Background */}
      <section className="relative isolate overflow-hidden bg-[#0d2a1b] min-h-[580px] flex items-center">
        {/* High-resolution lush green crop fields agricultural background */}
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center transition-all duration-1000 scale-105" 
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=2600&q=85')" 
          }} 
        />
        {/* Rich dark forest green gradient overlay for contrast and depth */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#071d12]/95 via-[#0e3321]/85 to-[#0b291a]/40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#071d12] via-transparent to-black/30" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
          <div className="max-w-2xl text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/60 backdrop-blur-md px-4 py-2 text-xs font-semibold tracking-wide text-[#d4ecc0]">
              <Leaf size={15} className="text-emerald-400 animate-pulse" />
              <span>SOUTH AFRICAN GROWN · VERIFIED B2B AGRI MARKETPLACE</span>
            </div>
            
            <h1 className="max-w-xl text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl text-white">
              Connecting Farmers to <span className="text-[#a8e063] drop-shadow-sm">Better Markets.</span>
            </h1>
            
            <p className="mt-6 max-w-lg text-base leading-7 text-emerald-100/90 sm:text-lg">
              AgriMarket connects verified agricultural producers, commercial cooperatives, and smallholder farmers directly with wholesale buyers, retailers, and food processors.
            </p>
            
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link 
                href="/shop" 
                className="inline-flex items-center gap-2 rounded-full bg-[#72b043] px-7 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/40 transition hover:bg-[#5b9632] hover:scale-[1.02] active:scale-[0.98]"
              >
                Browse Marketplace <ArrowRight size={17} />
              </Link>
              <Link 
                href="/register" 
                className="rounded-full border border-white/50 bg-white/10 backdrop-blur-sm px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#0d2a1b] hover:scale-[1.02] active:scale-[0.98]"
              >
                Become a Seller
              </Link>
            </div>
            
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs font-medium text-emerald-200/90">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#a8e063]" /> Verified Producer Badges
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#a8e063]" /> Bulk Commercial Quotes
              </span>
              <span className="flex items-center gap-2">
                <Truck size={16} className="text-[#a8e063]" /> Nationwide Freight & Collection
              </span>
            </div>
          </div>

          {/* Search Card */}
          <form action="/shop" className="rounded-[2.5rem] bg-white/95 backdrop-blur-md p-6 shadow-2xl border border-emerald-100 sm:p-8">
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-[.18em] text-[#4d7c2a]">Commercial Discovery</span>
              <h2 className="mt-1 text-2xl font-extrabold text-[#112d1c]">Source Bulk Farm Harvests</h2>
              <p className="mt-1 text-xs text-stone-500">Search fresh crops, bulk grains, livestock, or agricultural inputs.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="home-search" className="mb-2 block text-xs font-bold text-stone-700">Product or Crop Keyword</label>
                <input 
                  id="home-search" 
                  name="q" 
                  placeholder="e.g. Yellow Maize, Valencia Oranges, Bonsmara Cattle..." 
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 px-4 py-3.5 text-sm text-stone-800 placeholder-stone-400 outline-none transition focus:border-[#4d7c2a] focus:bg-white focus:ring-4 focus:ring-emerald-600/10" 
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="home-category" className="mb-2 block text-xs font-bold text-stone-700">Category</label>
                  <select 
                    id="home-category" 
                    name="category" 
                    defaultValue="" 
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 px-3 py-3.5 text-sm text-stone-700 outline-none focus:border-[#4d7c2a] focus:bg-white"
                  >
                    <option value="">All Categories</option>
                    {MOCK_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="home-province" className="mb-2 block text-xs font-bold text-stone-700">Province</label>
                  <select 
                    id="home-province" 
                    name="province" 
                    defaultValue="" 
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 px-3 py-3.5 text-sm text-stone-700 outline-none focus:border-[#4d7c2a] focus:bg-white"
                  >
                    <option value="">All 9 Provinces</option>
                    {PROVINCE_OPTIONS.map((province) => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#133d26] py-4 text-sm font-bold text-white transition hover:bg-[#0c2919] hover:shadow-lg active:scale-[0.99]"
              >
                Search Verified Listings <ArrowRight size={17} />
              </button>
            </div>
            
            <p className="mt-4 text-center text-[11px] text-stone-400 flex items-center justify-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-600" />
              Direct connection with accredited agricultural producers
            </p>
          </form>
        </div>
      </section>

      {/* Featured Categories with Crop Badges */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#4d7c2a]">Explore Agricultural Commodities</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#163824]">Marketplace Categories</h2>
          </div>
          <Link href="/shop" className="hidden items-center gap-2 text-sm font-bold text-[#356d40] hover:text-[#163824] sm:flex">
            Browse All Categories <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {MOCK_CATEGORIES.map((category, index) => (
            <Link 
              key={category.id} 
              href={`/shop?category=${encodeURIComponent(category.name)}`} 
              className="group relative min-h-48 overflow-hidden rounded-3xl bg-stone-200 sm:min-h-60 shadow-sm hover:shadow-md transition"
            >
              <img 
                src={category.image} 
                alt={category.name} 
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" 
                loading="lazy" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e13]/90 via-[#0a1e13]/25 to-transparent" />
              <span className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-xs font-extrabold text-[#234b31] shadow-sm">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="absolute inset-x-4 bottom-4 text-white">
                <h3 className="text-sm font-extrabold sm:text-lg">{category.name}</h3>
                <p className="mt-1 text-xs text-emerald-100/80">{category.popularItems.slice(0, 2).join(' · ')}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Farm Produce */}
      <section className="bg-[#edf3e8] py-16 sm:py-20 border-y border-emerald-950/5">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#4d7c2a]">Fresh Harvests</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#163824]">Featured Agricultural Listings</h2>
            </div>
            <Link href="/shop" className="hidden items-center gap-2 text-sm font-bold text-[#356d40] hover:text-[#163824] sm:flex">
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
          <FeaturedProducts />
        </div>
      </section>

      {/* Verified Producers / Sellers Highlights */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#4d7c2a]">Accredited Producers</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#163824]">Verified Agricultural Businesses</h2>
          </div>
          <Link href="/shop" className="hidden items-center gap-2 text-sm font-bold text-[#356d40] hover:text-[#163824] sm:flex">
            Discover Verified Farms <ArrowRight size={16} />
          </Link>
        </div>
        <SellerHighlights />
      </section>

      {/* How it Works Section */}
      <section className="bg-[#f3f7ef] py-16 sm:py-20 border-t border-emerald-950/5">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#4d7c2a]">Streamlined B2B Trade</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#163824] sm:text-4xl">
              Connecting growers and buyers in three simple steps.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-stone-600">
              AgriMarket eliminates redundant intermediaries. Source fresh harvests directly from verified farms across all 9 provinces with transparent pricing and logistics.
            </p>
            <Link href="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#356d40] hover:text-[#163824]">
              Learn more about AgriMarket <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#143d26] p-6 text-white shadow-sm">
              <PackageCheck size={24} className="text-[#a8e063]" />
              <h3 className="mt-4 text-base font-extrabold">1. Browse & Request Quotes</h3>
              <p className="mt-2 text-xs leading-5 text-emerald-100/75">
                Inspect bulk commodities, verified certifications, province location, and request quotes or samples.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 text-[#163824] border border-stone-200/80 shadow-sm">
              <ShieldCheck size={24} className="text-[#4d7c2a]" />
              <h3 className="mt-4 text-base font-extrabold">2. Verified Producers</h3>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                All registered agricultural SMMEs undergo business registration and farm location verification.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 text-[#163824] border border-stone-200/80 shadow-sm">
              <MapPin size={24} className="text-[#4d7c2a]" />
              <h3 className="mt-4 text-base font-extrabold">3. Farm Collection & Freight</h3>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                Arrange depot pick-up or schedule temperature-controlled freight straight to your warehouse.
              </p>
            </div>

            <div className="rounded-3xl bg-[#e3eed7] p-6 text-[#163824] shadow-sm">
              <Truck size={24} className="text-[#356d40]" />
              <h3 className="mt-4 text-base font-extrabold">Fast Commercial Settlement</h3>
              <p className="mt-2 text-xs leading-5 text-stone-700">
                Track status directly from your personalized buyer and seller portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action for Agricultural SMMEs */}
      <section className="mx-auto max-w-7xl px-5 pt-16">
        <div 
          className="relative isolate overflow-hidden rounded-[2.5rem] bg-[#113521] px-6 py-12 sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between shadow-xl"
        >
          {/* Subtle crop overlay for the CTA card */}
          <div 
            className="absolute inset-0 -z-10 bg-cover bg-center opacity-30 mix-blend-overlay"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80')" }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0d2a1b] via-[#113521]/90 to-[#18452c]/80" />

          <div className="max-w-xl text-white">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-[#a8e063]">Agricultural Producers & SMMEs</span>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Have fresh produce or livestock to sell?</h2>
            <p className="mt-3 text-sm text-emerald-100/80 leading-6">
              Showcase your agricultural products to institutional buyers, food distributors, supermarkets, and restaurants across South Africa.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 lg:mt-0">
            <Link 
              href="/register" 
              className="inline-flex items-center gap-2 rounded-full bg-[#72b043] px-7 py-4 text-sm font-extrabold text-white shadow-md transition hover:bg-[#5b9632] hover:scale-105 active:scale-95"
            >
              Register as Seller <ArrowRight size={17} />
            </Link>
            <Link 
              href="/about" 
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/20"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const PROVINCE_OPTIONS = PROVINCES_LIST.map((province) => province.name);
