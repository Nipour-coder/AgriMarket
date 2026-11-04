'use client';

import React from 'react';
import NextLink from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  FileCheck2, 
  Truck, 
  Store, 
  Coins, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  FileText, 
  Scale, 
  Award,
  Users
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="bg-stone-50 min-h-screen py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Commercial B2B Operations Guide</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#114227] tracking-tight">
            How the AgriMarket demo works
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Explore sample listings, try a buyer enquiry, and follow a simulated order. No seller verification, payment, courier booking or real trade takes place here.
          </p>
        </div>

        {/* Two Track Grid: Buyers vs Sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* For Buyers Track */}
          <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900">For Buyers &amp; Offtakers</h2>
                <p className="text-xs text-stone-500">Supermarket chains, wholesalers, feedlots &amp; food processors</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Search &amp; Filter Graded Commodities</h3>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                    Filter by harvest date, moisture content tolerances, cultivar variety, and geographical province to source directly from nearest producers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Submit Structured RFQs</h3>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                    Try the sample enquiry flow to record a local request. It is not sent to a seller and no quote is generated.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Coordinate Cold Chain &amp; Logistics</h3>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                    Review the demo delivery options or collection details shown at checkout. Real availability and required documents must be confirmed through a live service.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <NextLink
                href="/marketplace"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#114227] hover:bg-[#0c311c] text-white font-bold text-sm shadow transition-colors"
              >
                <span>Browse Products Now</span>
                <ArrowRight className="w-4 h-4" />
              </NextLink>
            </div>
          </div>

          {/* For Sellers Track */}
          <div className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900">For Producers &amp; SMMEs</h2>
                <p className="text-xs text-stone-500">Commercial farms, emerging growers &amp; agricultural cooperatives</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Register Your Farm Business</h3>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                    Submit your enterprise credentials (CIPC registration, tax PIN, farm location) to start your verification application.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Publish Farm Inventories</h3>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                    List upcoming seasonal harvests, grain silo tonnages, livestock batches, or farm services with minimum order constraints and farm-gate pricing.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Expand Offtake &amp; Manage Enquiries</h3>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                    Respond to inbound quotes through your dedicated Seller Dashboard. Establish recurring supply agreements and eliminate speculative brokers.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <NextLink
                href="/register?type=seller"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow transition-colors"
              >
                <span>Register as a Seller</span>
                <ArrowRight className="w-4 h-4" />
              </NextLink>
            </div>
          </div>
        </div>

        {/* Verification Standards Detailed Section */}
        <div id="verification-standards" className="bg-[#0c2f1b] rounded-3xl p-8 sm:p-12 text-white space-y-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">
              Planned trust workflow · not active in this demo
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Seller verification concept
            </h2>
            <p className="text-stone-300 text-sm sm:text-base mt-2">
              Sample seller badges do not indicate real-world approval. A live marketplace would need an authorised review process before sellers could be verified.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-emerald-500/20 space-y-3">
              <div className="p-2.5 rounded-xl bg-emerald-900/60 text-emerald-400 w-fit">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Tier 1: Legal Entity</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                A future process may review business registration and other necessary records through a secure service.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-emerald-500/20 space-y-3">
              <div className="p-2.5 rounded-xl bg-emerald-900/60 text-emerald-400 w-fit">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Tier 2: Land &amp; Facility</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                A future process may confirm the seller&apos;s facility and business location.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-emerald-500/20 space-y-3">
              <div className="p-2.5 rounded-xl bg-emerald-900/60 text-emerald-400 w-fit">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Tier 3: Quality Audits</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Relevant quality, commodity and regulatory documentation could be reviewed where applicable.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-emerald-500/20 space-y-3">
              <div className="p-2.5 rounded-xl bg-emerald-900/60 text-emerald-400 w-fit">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Tier 4: Trade Reputation</h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                A future service could support seller performance and dispute management; this demo has no real reviews or arbitration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
