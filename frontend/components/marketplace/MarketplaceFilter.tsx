'use client';

import React from 'react';
import { MOCK_CATEGORIES, PROVINCES_LIST } from '@/data/mockData';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  RotateCcw, 
  MapPin, 
  Layers, 
  ArrowUpDown,
  Check
} from 'lucide-react';

interface MarketplaceFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedProvince: string;
  onProvinceChange: (value: string) => void;
  verifiedOnly: boolean;
  onVerifiedOnlyChange: (value: boolean) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onReset: () => void;
  totalResults: number;
}

export default function MarketplaceFilter({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedProvince,
  onProvinceChange,
  verifiedOnly,
  onVerifiedOnlyChange,
  sortBy,
  onSortByChange,
  onReset,
  totalResults,
}: MarketplaceFilterProps) {
  const isFiltered = searchTerm || selectedCategory !== 'All' || selectedProvince !== 'All' || verifiedOnly;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-6 shadow-xs space-y-4">
      {/* Top Search Bar & Sort Dropdown */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search commodities, crops, livestock, or suppliers (e.g. Yellow Maize, Roma Tomatoes, Bonsmara)..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-xs text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-stone-500 hidden sm:block" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full sm:w-auto px-3 py-2.5 text-sm rounded-xl border border-stone-200 bg-white font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="featured">Sort: Featured First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Recently Listed</option>
          </select>
        </div>
      </div>

      {/* Filter Row: Categories, Province, Verified Checkbox */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone-100 items-center">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">
            Category Sector
          </label>
          <div className="relative">
            <Layers className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 bg-white text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Agricultural Categories</option>
              {MOCK_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Province Selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-500 mb-1">
            Production Province
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
            <select
              value={selectedProvince}
              onChange={(e) => onProvinceChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-200 bg-white text-stone-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Provinces (National)</option>
              {PROVINCES_LIST.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Verified Seller Toggle */}
        <div className="sm:pt-5">
          <label 
            className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer select-none transition-all ${
              verifiedOnly 
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold' 
                : 'border-stone-200 hover:bg-stone-50 text-stone-700 font-medium'
            }`}
          >
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => onVerifiedOnlyChange(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
              verifiedOnly ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 bg-white'
            }`}>
              {verifiedOnly && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <ShieldCheck className={`w-4 h-4 ${verifiedOnly ? 'text-emerald-600' : 'text-stone-400'}`} />
            <span className="text-xs">Verified Producers Only</span>
          </label>
        </div>

        {/* Reset & Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:pt-5">
          <span className="text-xs text-stone-500 font-medium">
            Found <strong className="text-stone-900">{totalResults}</strong> commodities
          </span>

          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
