'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { MOCK_PRODUCTS } from '@/data/mockData';
import { Product } from '@/lib/types';
import ProductCard from '@/components/marketplace/ProductCard';
import ProductDetailModal from '@/components/marketplace/ProductDetailModal';
import RequestQuoteModal from '@/components/marketplace/RequestQuoteModal';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  SlidersHorizontal 
} from 'lucide-react';

export default function FeaturedProducts() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  const filterTabs = [
    'All',
    'Fresh Vegetables',
    'Grains and Cereals',
    'Fresh Fruits',
    'Livestock',
    'Agricultural Services',
  ];

  const filteredProducts = selectedCategory === 'All'
    ? MOCK_PRODUCTS.slice(0, 8)
    : MOCK_PRODUCTS.filter((p) => p.category === selectedCategory);

  const handleOpenDetails = (prod: Product) => {
    setActiveProduct(prod);
    setIsDetailOpen(true);
  };

  const handleRequestQuote = (prod: Product) => {
    setActiveProduct(prod);
    setIsQuoteOpen(true);
  };

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Verified Market Commodities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#114227] tracking-tight">
              Featured Agricultural Products
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-2xl">
              Inspected and verified commodity listings ready for immediate dispatch or harvest contract booking.
            </p>
          </div>

          <NextLink
            href="/marketplace"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#114227] font-semibold text-sm transition-colors group shrink-0"
          >
            <span>Browse Full Marketplace</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </NextLink>
        </div>

        {/* Quick Sector Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedCategory(tab)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === tab
                  ? 'bg-[#114227] text-white shadow-md'
                  : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetails={handleOpenDetails}
              onRequestQuote={handleRequestQuote}
            />
          ))}
        </div>

        {/* Demo Notice Banner */}
        <div className="mt-12 p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-600">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>
              <strong>Commercial Demonstration Environment:</strong> Product listings reflect realistic agricultural pricing benchmarks across South African regional farming hubs.
            </span>
          </div>
          <NextLink
            href="/register?type=seller"
            className="text-emerald-800 hover:text-emerald-950 font-bold underline shrink-0"
          >
            List Your Farm&apos;s Commodities →
          </NextLink>
        </div>
      </div>

      {/* Modals */}
      <ProductDetailModal
        product={activeProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRequestQuote={handleRequestQuote}
      />

      <RequestQuoteModal
        product={activeProduct}
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
      />
    </section>
  );
}
