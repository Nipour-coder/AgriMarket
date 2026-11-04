'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { PROVINCES_LIST } from '@/data/mockData';
import { 
  X, 
  Send, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  Info,
  Building,
  Package
} from 'lucide-react';

interface RequestQuoteModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestQuoteModal({
  product,
  isOpen,
  onClose,
}: RequestQuoteModalProps) {
  const [quantity, setQuantity] = useState('');
  const [province, setProvince] = useState(product?.province || 'Gauteng');
  const [targetPrice, setTargetPrice] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [message, setMessage] = useState('');
  const [companyName, setCompanyName] = useState('Apex Agricultural Procurement (Demo)');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate interactive demo submission
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setQuantity('');
    setMessage('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-[#114227]">
              Demonstration Enquiry Dispatched
            </h3>

            <p className="text-sm text-stone-600 max-w-md mx-auto">
              Your Request for Quotation (RFQ) for <strong>{product.name}</strong> has been simulated.
            </p>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2 text-stone-600">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <Info className="w-4 h-4" />
                Backend Connection Prepared:
              </div>
              <p>
                In production, this triggers <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">POST /api/enquiries</code> on your Node.js Express service, notifying <strong>{product.seller.businessName}</strong> via SMS &amp; email notifications.
              </p>
              <p className="text-stone-500">
                You can review ongoing simulated enquiries in the <strong>Buyer Dashboard</strong>.
              </p>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-[#114227] hover:bg-[#0e3721] text-white font-semibold text-sm shadow transition-colors"
              >
                Close &amp; Return to Marketplace
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Supplier RFQ
              </div>
              <h2 className="text-2xl font-bold text-stone-900">
                Request a Bulk Quotation
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Recipient: <strong>{product.seller.businessName}</strong> • {product.name}
              </p>
            </div>

            {/* Product Summary Mini Card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
              <img
                src={product.image}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="text-xs">
                <div className="font-semibold text-stone-800">{product.name}</div>
                <div className="text-stone-500">Min Order: {product.minOrderQuantity}</div>
                <div className="text-emerald-700 font-bold mt-0.5">
                  {product.price ? `Reference: R ${product.price} ${product.priceUnit}` : 'Price on RFQ'}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Buyer Business / Entity Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Required Volume / Quantity *
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder={`e.g. 50 Tons / 200 Crates`}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Target Price or Budget (Optional)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. R 4,200 / Ton"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Delivery Destination Province *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <select
                    value={province}
                    onChange={(e) => {
                      const selectedProvince = PROVINCES_LIST.find((item) => item.id === e.target.value)?.id;
                      if (selectedProvince) setProvince(selectedProvince);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {PROVINCES_LIST.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Required Delivery By (Date)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Specifications, Quality Tolerances or Delivery Instructions
              </label>
              <textarea
                rows={3}
                required
                placeholder="Specify preferred grade, packing requirements, delivery timing, or transport method..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] text-stone-400">
                Front-end demonstration interaction.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-[#114227] hover:bg-[#0c311c] text-white shadow flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Transmit Quote Request</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
