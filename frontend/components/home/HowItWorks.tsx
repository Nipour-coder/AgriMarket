'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { 
  Search, 
  FileCheck2, 
  Truck, 
  Store, 
  ShieldCheck, 
  Coins, 
  ArrowRight,
  CheckCircle2,
  Users
} from 'lucide-react';

export default function HowItWorks() {
  const [activeRole, setActiveRole] = useState<'buyer' | 'seller'>('buyer');

  const buyerSteps = [
    {
      step: '01',
      title: 'Discover Verified Farm Commodities',
      description: 'Search hundreds of graded agricultural listings across 9 provinces with verified provenance, cultivar details, and farm-gate pricing.',
      icon: <Search className="w-6 h-6 text-emerald-600" />,
      detail: 'Filter by province, commercial grade, minimum order quantities, and accredited organic or GAP certificates.',
    },
    {
      step: '02',
      title: 'Request Structured B2B Quotations',
      description: 'Submit an online Request for Quotation (RFQ) specifying your required volume, delivery frequency, target price, and delivery terminal.',
      icon: <FileCheck2 className="w-6 h-6 text-emerald-600" />,
      detail: 'Negotiate transparently with verified producers with no hidden intermediary commissions.',
    },
    {
      step: '03',
      title: 'Receive Inspected Freight & Secure Trade',
      description: 'Coordinate directly with producers and vetted agricultural road freight providers. Receive verified batch lab certificates and invoices.',
      icon: <Truck className="w-6 h-6 text-emerald-600" />,
      detail: 'Build recurring seasonal supply contracts with dependable South African primary producers.',
    },
  ];

  const sellerSteps = [
    {
      step: '01',
      title: 'Register & Complete Verification',
      description: 'Create an agricultural business account and submit basic verification documents (CIPC registration, tax clearance, or farm address proof).',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      detail: 'Our verification team reviews applications within 24-48 business hours to award your Verified Producer badge.',
    },
    {
      step: '02',
      title: 'Showcase Bulk Farm Produce & Commodities',
      description: 'List your harvested crops, livestock, dairy tanks, or contract services with high-resolution imagery, grading specs, and packaging units.',
      icon: <Store className="w-6 h-6 text-emerald-600" />,
      detail: 'Set fixed farm-gate pricing or invite formal commercial RFQs for harvest-scale tonnages.',
    },
    {
      step: '03',
      title: 'Manage Inbound Enquiries & Expand Offtake',
      description: 'Receive real-time buyer enquiries from food processors, wholesalers, supermarket supply chains, and municipal produce market agents.',
      icon: <Coins className="w-6 h-6 text-emerald-600" />,
      detail: 'Secure guaranteed offtake agreements and improve farm cash flows before harvest begins.',
    },
  ];

  const currentSteps = activeRole === 'buyer' ? buyerSteps : sellerSteps;

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Simple, Transparent B2B Trade</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#114227] tracking-tight">
            How AgriMarket Works
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-3">
            A secure commercial framework designed specifically for bulk agricultural trade, eliminating friction between the field and the market.
          </p>

          {/* Role Switcher Toggle */}
          <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-stone-100 border border-stone-200">
            <button
              type="button"
              onClick={() => setActiveRole('buyer')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                activeRole === 'buyer'
                  ? 'bg-[#114227] text-white shadow'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>For Buyers &amp; Offtakers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('seller')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                activeRole === 'seller'
                  ? 'bg-[#114227] text-white shadow'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>For Agricultural Producers (Sellers)</span>
            </button>
          </div>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {currentSteps.map((item, index) => (
            <div
              key={item.step}
              className="bg-stone-50 rounded-3xl p-8 border border-stone-200/80 hover:border-emerald-500/50 shadow-xs hover:shadow-xl transition-all duration-300 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-[#114227] flex items-center justify-center shadow-xs">
                    {item.icon}
                  </div>
                  <span className="text-3xl font-black text-emerald-900/20 font-mono">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-stone-900 leading-snug mb-3">
                  {item.title}
                </h3>

                <p className="text-sm text-stone-600 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200/60 text-xs text-stone-500 bg-white/70 p-3 rounded-xl">
                <strong className="text-emerald-800 block mb-0.5">Key Advantage:</strong>
                {item.detail}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs matching the role */}
        <div className="mt-12 text-center">
          {activeRole === 'buyer' ? (
            <NextLink
              href="/marketplace"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#114227] hover:bg-[#0c311c] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <span>Explore Marketplace Now</span>
              <ArrowRight className="w-4 h-4" />
            </NextLink>
          ) : (
            <NextLink
              href="/register?type=seller"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <span>Start Seller Registration</span>
              <ArrowRight className="w-4 h-4" />
            </NextLink>
          )}
        </div>
      </div>
    </section>
  );
}
