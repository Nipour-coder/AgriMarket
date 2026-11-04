'use client';

import React from 'react';
import NextLink from 'next/link';
import { MOCK_CATEGORIES } from '@/data/mockData';
import { 
  Carrot, 
  Apple, 
  Wheat, 
  Beef, 
  Milk, 
  Egg, 
  Tractor, 
  ArrowRight, 
  ShieldCheck, 
  Layers,
  Sprout
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Carrot: <Carrot className="w-6 h-6 text-emerald-600" />,
  Apple: <Apple className="w-6 h-6 text-emerald-600" />,
  Wheat: <Wheat className="w-6 h-6 text-emerald-600" />,
  Beef: <Beef className="w-6 h-6 text-emerald-600" />,
  Milk: <Milk className="w-6 h-6 text-emerald-600" />,
  Egg: <Egg className="w-6 h-6 text-emerald-600" />,
  Tractor: <Tractor className="w-6 h-6 text-emerald-600" />,
};

export default function CategoriesPage() {
  return (
    <div className="bg-stone-50 min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Agricultural Commodity Directory</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#114227] tracking-tight">
            Agricultural Categories
          </h1>
          <p className="text-stone-600 text-sm sm:text-base">
            Source bulk agricultural products across South Africa&apos;s key farming subsectors with complete transparency and verified quality standards.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-3xl border border-stone-200 hover:border-emerald-500/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
            >
              <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-white">
                  <div className="p-2.5 rounded-2xl bg-white/95 text-stone-900 shadow-md">
                    {iconMap[cat.iconName]}
                  </div>
                  <span className="text-xs font-bold bg-[#114227]/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-400/30">
                    {cat.itemCount} Verified Listings
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                    {cat.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                      Popular Commodities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.popularItems.map((item) => (
                        <span
                          key={item}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <NextLink
                    href={`/marketplace?category=${encodeURIComponent(cat.name)}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#114227] hover:bg-[#0c311c] text-white text-xs font-bold shadow transition-colors"
                  >
                    <span>Browse {cat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </NextLink>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
