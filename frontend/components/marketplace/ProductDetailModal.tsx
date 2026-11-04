'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  Package, 
  Calendar, 
  Award, 
  Building2, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Thermometer, 
  Truck,
  Phone,
  Mail,
  Share2
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: (product: Product) => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onRequestQuote,
}: ProductDetailModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {product.category}
            </span>
            <span className="text-xs font-medium text-stone-400">
              ID: {product.id}
            </span>
            <span className="text-[11px] font-mono bg-stone-100 text-stone-500 px-2 py-0.5 rounded">
              Demonstration Item
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Top Grid: Image + Main Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="space-y-3">
              <div className="aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#114227] text-white shadow">
                    {product.stockStatus}
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone-400 text-center italic">
                Realistic agricultural commercial demonstration imagery.
              </p>
            </div>

            {/* Main Info */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {product.seller.businessName}
                  </span>
                  {product.seller.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {product.seller.verificationBadge}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#114227] leading-tight">
                  {product.name}
                </h1>

                <div className="flex items-center gap-2 text-sm text-stone-500 mt-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{product.province}, South Africa</span>
                  <span>•</span>
                  <span>{product.seller.district}</span>
                </div>

                {/* Price Display */}
                <div className="mt-5 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 block mb-1">
                    Direct Producer Pricing
                  </span>
                  {product.price ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-[#114227]">
                        R {product.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm font-medium text-emerald-800">
                        {product.priceUnit}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-emerald-900">
                      Price upon RFQ / Contract Negotiation
                    </div>
                  )}
                  <p className="text-xs text-emerald-700 mt-2 flex items-center gap-1.5">
                    <Package className="w-4 h-4" />
                    Minimum Order Quantity: <strong>{product.minOrderQuantity}</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestQuote(product);
                  }}
                  className="flex-1 py-3 px-6 rounded-xl bg-[#114227] hover:bg-[#0c311c] text-white font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Request Formal B2B Quote</span>
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-stone-200 pt-6">
            <h3 className="text-lg font-bold text-stone-900 mb-2">Commodity Overview</h3>
            <p className="text-stone-700 leading-relaxed text-sm whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Specifications Table */}
          <div className="border-t border-stone-200 pt-6">
            <h3 className="text-lg font-bold text-stone-900 mb-4">Technical Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {product.specifications.grade && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 flex justify-between">
                  <span className="text-stone-500 font-medium">Commercial Grade:</span>
                  <span className="font-semibold text-stone-900">{product.specifications.grade}</span>
                </div>
              )}
              {product.specifications.variety && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 flex justify-between">
                  <span className="text-stone-500 font-medium">Cultivar / Variety:</span>
                  <span className="font-semibold text-stone-900">{product.specifications.variety}</span>
                </div>
              )}
              {product.specifications.packaging && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 flex justify-between">
                  <span className="text-stone-500 font-medium">Packaging Unit:</span>
                  <span className="font-semibold text-stone-900">{product.specifications.packaging}</span>
                </div>
              )}
              {product.specifications.moistureContent && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 flex justify-between">
                  <span className="text-stone-500 font-medium">Moisture Content:</span>
                  <span className="font-semibold text-stone-900">{product.specifications.moistureContent}</span>
                </div>
              )}
              {product.specifications.shelfLife && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 flex justify-between">
                  <span className="text-stone-500 font-medium">Expected Shelf Life:</span>
                  <span className="font-semibold text-stone-900">{product.specifications.shelfLife}</span>
                </div>
              )}
              {product.specifications.storageConditions && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70 flex justify-between">
                  <span className="text-stone-500 font-medium">Storage Requirements:</span>
                  <span className="font-semibold text-stone-900">{product.specifications.storageConditions}</span>
                </div>
              )}
            </div>

            {/* Certifications tags */}
            {product.specifications.certifications && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Accreditations:
                </span>
                {product.specifications.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Seller Business Profile Section */}
          <div className="border-t border-stone-200 pt-6 bg-stone-50/80 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 rounded-b-3xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={product.seller.avatar}
                  alt={product.seller.businessName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-600/30"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-stone-900 text-base">
                      {product.seller.businessName}
                    </h4>
                    {product.seller.isVerified && (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Reg: {product.seller.registrationNumber} • {product.seller.yearsInOperation} Years in Agricultural Production
                  </p>
                  <p className="text-xs text-stone-600 mt-1 max-w-lg">
                    {product.seller.description}
                  </p>
                </div>
              </div>

              <div className="text-xs text-stone-500 space-y-1">
                <div><strong>Farm Size:</strong> {product.seller.farmSize || 'Commercial Estate'}</div>
                <div><strong>Location:</strong> {product.seller.address}</div>
                <div><strong>Verified Since:</strong> {product.seller.verifiedSince || '2023'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
