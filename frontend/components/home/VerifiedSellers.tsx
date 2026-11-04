'use client';

import React from 'react';
import NextLink from 'next/link';
import { MOCK_SELLERS } from '@/data/mockData';
import { 
  ShieldCheck, 
  MapPin, 
  Award, 
  Building2, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  Tractor,
  Layers
} from 'lucide-react';

export default function VerifiedSellers() {
  return (
    <section className="py-16 sm:py-24 bg-stone-50 border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audited Agricultural Enterprises</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#114227] tracking-tight">
            Meet Verified Agricultural Producers
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-3">
            Every seller on AgriMarket undergoes mandatory legal registration checks, farm verification, and agricultural accreditation before conducting bulk trade.
          </p>
        </div>

        {/* Sellers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_SELLERS.slice(0, 6).map((seller) => (
            <div
              key={seller.id}
              className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-500/50 p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name & Verification Badge */}
                <div className="flex items-start gap-4">
                  <img
                    src={seller.avatar}
                    alt={seller.businessName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {seller.verificationBadge}
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">
                        Since {seller.verifiedSince}
                      </span>
                    </div>

                    <h3 className="font-bold text-stone-900 text-base mt-1.5 truncate">
                      {seller.businessName}
                    </h3>

                    <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{seller.province} ({seller.district})</span>
                    </div>
                  </div>
                </div>

                {/* Rating & Stats */}
                <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-stone-50">
                    <span className="text-stone-400 block text-[10px] font-semibold uppercase">Rating</span>
                    <span className="font-bold text-stone-800 flex items-center justify-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {seller.rating}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-stone-50">
                    <span className="text-stone-400 block text-[10px] font-semibold uppercase">Experience</span>
                    <span className="font-bold text-stone-800 mt-0.5 block">
                      {seller.yearsInOperation} Yrs
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-stone-50">
                    <span className="text-stone-400 block text-[10px] font-semibold uppercase">Scale</span>
                    <span className="font-bold text-stone-800 mt-0.5 block truncate" title={seller.farmSize}>
                      {seller.farmSize ? seller.farmSize.split(' ')[0] : 'Estate'}
                    </span>
                  </div>
                </div>

                {/* Business Bio Excerpt */}
                <p className="text-xs text-stone-600 mt-3 line-clamp-2 leading-relaxed">
                  {seller.description}
                </p>

                {/* Primary commodities pills */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                    Core Commodities
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {seller.primaryCommodities.map((crop) => (
                      <span
                        key={crop}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                {seller.certifications && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {seller.certifications.slice(0, 2).map((cert) => (
                      <span
                        key={cert}
                        className="text-[10px] text-stone-500 font-medium flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-stone-100">
                <NextLink
                  href={`/marketplace?search=${encodeURIComponent(seller.businessName)}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-[#114227] text-stone-800 hover:text-white transition-colors duration-200"
                >
                  <span>View Farm Listings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NextLink>
              </div>
            </div>
          ))}
        </div>

        {/* Verification Standards Callout */}
        <div className="mt-12 text-center">
          <NextLink
            href="/how-it-works#verification-standards"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 underline"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Learn how our 4-tier agricultural verification process protects buyers &amp; sellers →</span>
          </NextLink>
        </div>
      </div>
    </section>
  );
}
