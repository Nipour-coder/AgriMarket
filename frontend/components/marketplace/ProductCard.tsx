'use client';

import React from 'react';
import NextLink from 'next/link';
import { Product } from '@/lib/types';
import { 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare, 
  Star, 
  Package, 
  TrendingUp 
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenDetails?: (product: Product) => void;
  onRequestQuote?: (product: Product) => void;
}

export default function ProductCard({ 
  product, 
  onOpenDetails,
  onRequestQuote 
}: ProductCardProps) {
  const isQuoteOnly = product.price === null;

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/80 hover:border-emerald-500/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image & Badges */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#114227]/90 backdrop-blur-md text-emerald-200 shadow-sm border border-emerald-500/30">
            {product.category}
          </span>

          {/* Stock / Availability Badge */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium backdrop-blur-md shadow-xs ${
            product.stockStatus === 'In Stock'
              ? 'bg-emerald-600/90 text-white'
              : 'bg-amber-600/90 text-white'
          }`}>
            {product.stockStatus}
          </span>
        </div>

        {/* Bottom image overlay info */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="flex items-center gap-1 font-medium bg-black/40 backdrop-blur-md px-2 py-0.5 rounded">
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            Min: {product.minOrderQuantity}
          </span>
          <span className="flex items-center gap-1 font-semibold text-amber-300 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded">
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            {product.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Seller & Verification Status */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-stone-700 truncate hover:text-emerald-700 transition-colors">
                {product.seller.businessName}
              </span>
            </div>
            {product.seller.isVerified && (
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
                title={`${product.seller.verificationBadge} - Verified by AgriMarket`}
              >
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Verified</span>
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onOpenDetails?.(product)}
            className="font-bold text-stone-900 text-base sm:text-lg leading-snug line-clamp-2 hover:text-emerald-800 cursor-pointer transition-colors"
          >
            {product.name}
          </h3>

          {/* Location / Province */}
          <div className="flex items-center gap-1 text-xs text-stone-500 mt-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{product.province}</span>
            <span className="text-stone-300">•</span>
            <span className="truncate">{product.seller.district}</span>
          </div>

          {/* Short description excerpt */}
          <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Actions Section */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase font-semibold text-stone-400 block tracking-wide">
                Price Structure
              </span>
              {isQuoteOnly ? (
                <div className="text-base font-bold text-emerald-800 flex items-center gap-1">
                  <span>Request a Quote</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-xl font-extrabold text-[#114227]">
                    R {product.price?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-normal text-stone-500">
                    {product.priceUnit}
                  </span>
                </div>
              )}
            </div>

            {/* Synthetic Data tag */}
            <span className="text-[9px] text-stone-400 font-mono bg-stone-100 px-1.5 py-0.5 rounded">
              Demo Data
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenDetails?.(product)}
              className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold py-2 px-3 rounded-xl border border-stone-300 text-stone-700 bg-stone-50 hover:bg-stone-100 hover:text-stone-900 transition-colors"
            >
              <span>View Details</span>
            </button>

            <button
              type="button"
              onClick={() => onRequestQuote?.(product)}
              className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold py-2 px-3 rounded-xl bg-[#114227] hover:bg-[#0d341f] text-white shadow-xs hover:shadow transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Quote</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
