'use client';

import React from 'react';
import NextLink from 'next/link';
import { 
  Sprout, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp, 
  Store,
  FileCheck
} from 'lucide-react';

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0c311c] via-[#114227] to-[#072112] text-white py-16 sm:py-24">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-green-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 sm:p-12 lg:p-16 border border-emerald-500/20 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span>Agricultural SMME &amp; Cooperative Development</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Empowering Agricultural SMMEs to Reach Commercial Scale.
              </h2>

              <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
                Whether you are a commercial fruit estate, a community grain cooperative, or an emerging poultry producer, AgriMarket provides the platform, verified credentials, and institutional buyers needed to secure profitable offtake.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-emerald-100 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Free initial registration &amp; profile setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Verified Producer trust badge</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct contact with wholesale buyers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Assistance with GAP &amp; food safety audits</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <NextLink
                  href="/register?type=seller"
                  className="bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-bold px-8 py-3.5 rounded-xl text-sm sm:text-base flex items-center gap-2 shadow-lg hover:shadow-emerald-400/30 transition-all duration-200"
                >
                  <Store className="w-5 h-5" />
                  <span>Register Your Farm / Business</span>
                  <ArrowRight className="w-4 h-4" />
                </NextLink>

                <NextLink
                  href="/marketplace"
                  className="bg-emerald-950/60 hover:bg-emerald-900/80 text-white border border-emerald-600/40 font-semibold px-6 py-3.5 rounded-xl text-sm sm:text-base transition-colors"
                >
                  Explore Current Demand
                </NextLink>
              </div>
            </div>

            {/* Right Card / Visual Trust Element */}
            <div className="lg:col-span-5">
              <div className="bg-[#072414] rounded-2xl p-6 sm:p-8 border border-emerald-600/30 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-emerald-800/60">
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                    Seller Verification Steps
                  </span>
                  <span className="text-xs bg-emerald-900/80 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-700/60 font-mono">
                    24-48h Review
                  </span>
                </div>

                <div className="space-y-4 text-xs text-stone-300">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <strong className="text-white block text-sm">Submit CIPC &amp; Location</strong>
                      <span>Provide company registration and primary farm/facility GPS address.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <strong className="text-white block text-sm">Agricultural Audit Verification</strong>
                      <span>Verification team validates commodity production capacity and certificates.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <strong className="text-white block text-sm">Publish Verified Listings</strong>
                      <span>Receive the Verified Badge and publish bulk product cards to verified buyers.</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-xs text-emerald-200 flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Compliant with South African agricultural marketing &amp; biosecurity codes.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
