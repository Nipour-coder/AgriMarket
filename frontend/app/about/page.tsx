'use client';

import React from 'react';
import NextLink from 'next/link';
import { 
  Sprout, 
  ShieldCheck, 
  Users, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  Target,
  Award
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-stone-50 min-h-screen py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>About AgriMarket</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#114227] tracking-tight">
            A simpler way to discover South African agriculture
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            AgriMarket is a frontend marketplace prototype exploring how local farmers, agricultural businesses and buyers can find one another online.
          </p>
        </div>

        {/* Mission & Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-xs space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 w-fit">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Our Core Mission</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              To make agricultural product discovery and buyer-seller communication easier through a clear, accessible digital marketplace.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-xs space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 w-fit">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Our Trade Philosophy</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              We believe clear product details, transparent seller status and practical order workflows can help buyers and growers connect with confidence.
            </p>
          </div>
        </div>

        {/* Pillars of AgriMarket */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200/90 space-y-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#114227] text-center">
            What Sets AgriMarket Apart
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Trust by design</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Seller profiles and verification labels shown here are sample data. Real identity checks require a secured operational review process that is not part of this prototype.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">SMME Empowerment</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Smallholder cooperatives and emerging black-owned farming enterprises gain direct visibility to institutional procurement teams without broker exploitation.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Direct Contract Stability</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                The prototype demonstrates product browsing and simulated checkout; it does not arrange supply contracts or guarantee fulfilment.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-stone-900">
            Ready to Connect with South Africa&apos;s Agricultural Network?
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <NextLink
              href="/marketplace"
              className="px-6 py-3 rounded-xl bg-[#114227] hover:bg-[#0c311c] text-white font-bold text-sm shadow transition-colors"
            >
              Browse Agricultural Commodities
            </NextLink>
            <NextLink
              href="/register?type=seller"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition-colors"
            >
              Register as Seller
            </NextLink>
          </div>
        </div>
      </div>
    </div>
  );
}
