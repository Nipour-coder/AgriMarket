'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  TrendingUp, 
  Sprout, 
  CheckCircle2, 
  MapPin, 
  Truck,
  Building,
  Users
} from 'lucide-react';

export default function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/marketplace');
    }
  };

  const trendingTags = ['Yellow Maize', 'Roma Tomatoes', 'Hass Avocados', 'Bonsmara Cattle', 'Bulk Milk'];

  return (
    <div className="relative overflow-hidden bg-[#0a2315] text-white">
      {/* Background Image with Deep Agricultural Forest Green Gradient Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=85"
          alt="South African Agricultural Farmland"
          className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105 animate-in fade-in duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06180e] via-[#092918]/90 to-[#0e3b23]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#092918] via-transparent to-black/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="max-w-3xl space-y-6">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-medium backdrop-blur-md shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>South Africa&apos;s B2B Commercial Agricultural Exchange</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-300">Verified Producers</span>
          </div>

          {/* Large Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Connecting Farmers to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-200">Better Markets.</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed font-normal max-w-2xl">
            AgriMarket directly connects verified agricultural businesses, commercial estates, and emerging farming SMMEs with accredited buyers, food processors, wholesalers, and retail supply chains across all 9 provinces.
          </p>

          {/* High-Impact Agricultural Search Bar */}
          <form onSubmit={handleSearch} className="pt-2">
            <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-stone-400 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search agricultural commodities, bulk grain, produce, or verified farms..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-3 py-3 text-stone-900 text-sm sm:text-base placeholder-stone-500 bg-transparent focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="bg-[#114227] hover:bg-[#0b2f1c] text-white px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 shrink-0"
              >
                <span>Search Products</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

            {/* Trending tags */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-emerald-200/80">
              <span className="font-semibold text-emerald-300">Frequent Inquiries:</span>
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => router.push(`/marketplace?search=${encodeURIComponent(tag)}`)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-800 text-emerald-100 border border-emerald-800/60 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>

          {/* Call to Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <NextLink
              href="/marketplace"
              className="bg-emerald-500 hover:bg-emerald-600 text-stone-950 hover:text-black font-bold px-6 py-3.5 rounded-xl text-sm sm:text-base flex items-center gap-2 shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
            >
              <span>Browse Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </NextLink>

            <NextLink
              href="/register?type=seller"
              className="bg-emerald-950/70 hover:bg-emerald-900/90 text-white border border-emerald-600/50 font-semibold px-6 py-3.5 rounded-xl text-sm sm:text-base flex items-center gap-2 transition-all duration-200"
            >
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span>Become a Verified Seller</span>
            </NextLink>

            <NextLink
              href="/how-it-works"
              className="text-emerald-300 hover:text-white text-sm font-medium px-3 py-2 flex items-center gap-1.5 transition-colors"
            >
              <span>How It Works</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NextLink>
          </div>
        </div>

        {/* Key Commercial Metrics Strip */}
        <div className="mt-14 pt-8 border-t border-emerald-800/50 grid grid-cols-2 md:grid-cols-4 gap-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-900/50 border border-emerald-700/40 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">1,450+</div>
              <div className="text-xs text-emerald-200/80">Verified Producers</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-900/50 border border-emerald-700/40 text-emerald-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">9 Provinces</div>
              <div className="text-xs text-emerald-200/80">National Coverage</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-900/50 border border-emerald-700/40 text-emerald-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">48,000 MT</div>
              <div className="text-xs text-emerald-200/80">Traded Annually</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-900/50 border border-emerald-700/40 text-emerald-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">R 120M+</div>
              <div className="text-xs text-emerald-200/80">B2B Order Value</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
