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
  TrendingUp,
  PackageCheck
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

export default function CategoryGrid() {
  return (
    <section className="py-16 sm:py-20 bg-stone-50 border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Commodity Sectors
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#114227] tracking-tight">
              Explore Agricultural Categories
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-2xl">
              Source direct from audited primary producers across major food, feed, livestock, and technical farming sectors.
            </p>
          </div>

          <NextLink
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 group shrink-0"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </NextLink>
        </div>

        {/* Categories Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {MOCK_CATEGORIES.map((cat) => (
            <NextLink
              key={cat.id}
              href={`/marketplace?category=${encodeURIComponent(cat.name)}`}
              className="group bg-white rounded-2xl border border-stone-200/90 hover:border-emerald-500/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1"
            >
              {/* Image banner */}
              <div className="relative h-36 w-full overflow-hidden bg-stone-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-white/90 backdrop-blur-md shadow-sm">
                      {iconMap[cat.iconName]}
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-800/90 backdrop-blur-md px-2.5 py-1 rounded-full text-white border border-emerald-500/30">
                    {cat.itemCount} Listings
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-lg group-hover:text-emerald-800 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100">
                  <div className="flex flex-wrap gap-1">
                    {cat.popularItems.slice(0, 3).map((item) => (
                      <span
                        key={item}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs font-semibold text-emerald-800 pt-1">
                    <span>Explore Products</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </NextLink>
          ))}
        </div>
      </div>
    </section>
  );
}
