'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Grid2X2, List, LocateFixed, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { MOCK_CATEGORIES, PROVINCES_LIST } from '@/data/mockData';
import StoreProductCard from '@/components/marketplace/StoreProductCard';
import { distanceInKm, MANUAL_LOCATIONS } from '@/lib/location';
import type { SearchLocation } from '@/lib/location';
import type { Product } from '@/lib/types';

const RADIUS_STEPS = [5, 10, 25, 50, 100];
type BuyerLocation = SearchLocation & { source: 'device' | 'manual' };

export default function ShopPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [province, setProvince] = useState('All');
  const [sort, setSort] = useState('distance');
  const [verified, setVerified] = useState(false);
  const [listView, setListView] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availability, setAvailability] = useState('All');
  const [fulfilment, setFulfilment] = useState('All');
  const [location, setLocation] = useState<BuyerLocation | null>(null);
  const [maximumDistance, setMaximumDistance] = useState(25);
  const [locationMessage, setLocationMessage] = useState('');
  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [catalogueError, setCatalogueError] = useState('');
  const [catalogueLoaded, setCatalogueLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json() as Product[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) throw new Error('error' in result ? result.error : 'Unable to load marketplace listings.');
      setCatalogue(result);
    }).catch((issue: unknown) => setCatalogueError(issue instanceof Error ? issue.message : 'Unable to load marketplace listings.'))
      .finally(() => setCatalogueLoaded(true));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
    setCategory(params.get('category') || 'All');
    setProvince(params.get('province') || 'All');
    setVerified(params.get('verifiedOnly') === 'true');
  }, []);

  const requestDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location access is unavailable in this browser. Choose a town below instead.');
      return;
    }

    setLocationMessage('Requesting permission to use your location…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ label: 'Your current location', latitude: coords.latitude, longitude: coords.longitude, source: 'device' });
        setLocationMessage('Using your device location for this search. It is not saved.');
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Choose a town below to search manually.'
          : error.code === error.TIMEOUT
            ? 'Could not get your location in time. Choose a town below or try again.'
            : 'Could not determine your location. Choose a town below or try again.';
        setLocation(null);
        setLocationMessage(message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const matchingProducts = useMemo(() => catalogue.filter((item) => {
    const text = `${item.name} ${item.subcategory} ${item.seller.businessName}`.toLowerCase();
    return text.includes(query.toLowerCase())
      && (category === 'All' || item.category === category)
      && (province === 'All' || item.province === province)
      && (!verified || item.seller.isVerified)
      && (!minPrice || (item.price !== null && item.price >= Number(minPrice)))
      && (!maxPrice || (item.price !== null && item.price <= Number(maxPrice)))
      && (availability === 'All' || (availability === 'In stock' ? item.stockStatus === 'In Stock' : item.stockStatus !== 'In Stock'))
      && (fulfilment === 'All'
        || (fulfilment === 'Delivery' ? item.availableForDelivery !== false : item.availableForCollection !== false));
  }), [catalogue, query, category, province, verified, minPrice, maxPrice, availability, fulfilment]);

  const radiusSearch = useMemo<{ radius: number; products: { product: Product; distanceKm?: number }[] }>(() => {
    if (!location) return { radius: maximumDistance, products: matchingProducts.map((product) => ({ product })) };

    const calculateDistance = (product: Product) => {
      const { latitude, longitude } = product.seller;
      if (latitude === undefined || longitude === undefined) return null;
      return distanceInKm(location, { latitude, longitude });
    };

    const radii = RADIUS_STEPS.filter((radius) => radius <= maximumDistance);
    const radius = radii.find((candidate) => matchingProducts.some((product) => {
      const distance = calculateDistance(product);
      return distance !== null && distance <= candidate;
    })) ?? maximumDistance;

    const products = matchingProducts
      .map((product) => ({ product, distanceKm: calculateDistance(product) }))
      .filter((entry): entry is { product: Product; distanceKm: number } =>
        entry.distanceKm !== null && entry.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return { radius, products };
  }, [location, maximumDistance, matchingProducts]);

  const products = useMemo(() => {
    const sorted: { product: Product; distanceKm?: number }[] = location
      ? radiusSearch.products.map(({ product, distanceKm }) => ({ product, distanceKm }))
      : matchingProducts.map((product) => ({ product, distanceKm: undefined }));

    if (sort === 'price-asc') sorted.sort((a, b) => (a.product.price ?? Infinity) - (b.product.price ?? Infinity));
    if (sort === 'price-desc') sorted.sort((a, b) => (b.product.price ?? -Infinity) - (a.product.price ?? -Infinity));
    if (sort === 'newest') sorted.sort((a, b) => b.product.createdAt.localeCompare(a.product.createdAt));
    if (sort === 'popular') sorted.sort((a, b) => b.product.rating - a.product.rating);
    if (sort === 'distance' && location) sorted.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    return sorted;
  }, [location, matchingProducts, radiusSearch.products, sort]);

  const chooseManualLocation = (label: string) => {
    const selected = MANUAL_LOCATIONS.find((item) => item.label === label);
    if (!selected) return;
    setLocation({ ...selected, source: 'manual' });
    setLocationMessage(`Searching near ${selected.label}.`);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
      <div className="mb-9">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#789456]">The AgriMarket shop</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#20372a]">Find good things, grown locally.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">Browse live listings from verified agricultural sellers across South Africa.</p>
      </div>

      <div className="mb-7 rounded-3xl border border-stone-200 bg-white p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
          <label className="relative block"><span className="sr-only">Search products</span><Search size={17} className="absolute left-3.5 top-3.5 text-stone-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products or sellers" className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#789456]" /></label>
          <label><span className="sr-only">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-700 outline-none focus:border-[#789456]"><option value="All">All categories</option>{MOCK_CATEGORIES.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
          <label><span className="sr-only">Province</span><select value={province} onChange={(event) => setProvince(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-700 outline-none focus:border-[#789456]"><option value="All">All provinces</option>{PROVINCES_LIST.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
          <label><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-700 outline-none focus:border-[#789456]"><option value="distance">Nearest first</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="newest">Newest</option><option value="popular">Popular</option></select></label>
        </div>

        <section aria-labelledby="location-search-title" className="mt-4 rounded-2xl border border-green-100 bg-green-50/60 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <h2 id="location-search-title" className="flex items-center gap-2 text-sm font-bold text-[#20372a]"><MapPin size={16} className="text-[#426e45]" /> Find matching sellers near you</h2>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={requestDeviceLocation} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1d4d32] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#103b25]"><LocateFixed size={15} /> Use my location</button>
                <label className="min-w-0 flex-1"><span className="sr-only">Or choose a town manually</span><select value={location?.source === 'manual' ? location.label : ''} onChange={(event) => chooseManualLocation(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-700"><option value="">Or choose a town manually</option>{MANUAL_LOCATIONS.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}</select></label>
              </div>
              {locationMessage && <p role="status" className="mt-2 text-xs text-stone-600">{locationMessage}</p>}
              {location && <p className="mt-1 text-[11px] font-semibold text-[#426e45]">Location: {location.label}</p>}
            </div>
            <label className="w-full text-xs font-semibold text-stone-600 lg:max-w-52">Maximum search distance
              <select value={maximumDistance} onChange={(event) => setMaximumDistance(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-700">
                {RADIUS_STEPS.map((radius) => <option key={radius} value={radius}>{radius} km</option>)}
              </select>
            </label>
          </div>
          <p className="mt-3 text-[11px] leading-4 text-stone-500">If no matching sellers are found within 5 km, the search automatically widens up to your selected maximum. Distances use seller-submitted business coordinates.</p>
        </section>

        <div className="mt-3 grid gap-3 border-t border-stone-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-2"><span className="shrink-0 text-xs font-semibold text-stone-500">Price R</span><input aria-label="Minimum price" type="number" min="0" placeholder="Min" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} className="w-full min-w-0 rounded-lg border border-stone-200 px-2.5 py-2 text-xs outline-none focus:border-[#789456]" /><span className="text-xs text-stone-400">–</span><input aria-label="Maximum price" type="number" min="0" placeholder="Max" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="w-full min-w-0 rounded-lg border border-stone-200 px-2.5 py-2 text-xs outline-none focus:border-[#789456]" /></label>
          <label><span className="sr-only">Availability</span><select value={availability} onChange={(event) => setAvailability(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-700"><option value="All">Any availability</option><option value="In stock">In stock</option><option value="Other">Seasonal / limited / contract</option></select></label>
          <label><span className="sr-only">Delivery or collection</span><select value={fulfilment} onChange={(event) => setFulfilment(event.target.value)} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-700"><option value="All">Delivery or collection</option><option value="Delivery">Delivery available</option><option value="Collection">Seller collection</option></select></label>
          <p className="self-center text-[10px] leading-4 text-stone-400">Confirm fulfilment details with the seller.</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600"><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="h-4 w-4 accent-[#1d4d32]" /> Verified sellers only</label>
          <div className="flex items-center gap-3"><span className="text-xs text-stone-500">{products.length} {products.length === 1 ? 'product' : 'products'}{location ? ` within ${radiusSearch.radius} km` : ''}</span><div className="flex rounded-lg border border-stone-200 p-1"><button type="button" aria-label="Grid view" onClick={() => setListView(false)} className={`rounded-md p-1.5 ${!listView ? 'bg-green-50 text-[#1d4d32]' : 'text-stone-400'}`}><Grid2X2 size={16} /></button><button type="button" aria-label="List view" onClick={() => setListView(true)} className={`rounded-md p-1.5 ${listView ? 'bg-green-50 text-[#1d4d32]' : 'text-stone-400'}`}><List size={16} /></button></div><SlidersHorizontal size={16} className="text-stone-400 sm:hidden" /></div>
        </div>
      </div>

      {location && radiusSearch.radius > 5 && products.length > 0 && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">No matching sellers were found within 5 km, so the search expanded to {radiusSearch.radius} km.</p>}

      {catalogueError && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{catalogueError}</p>}
      {!catalogueLoaded ? <p className="py-12 text-center text-sm text-stone-500">Loading marketplace listings…</p> : products.length ? (
        <div className={listView ? 'grid gap-4 sm:grid-cols-2' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'}>
          {products.map(({ product, distanceKm }) => <StoreProductCard key={product.id} product={product} listView={listView} distanceKm={distanceKm} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-bold text-stone-800">{location ? `No matching sellers within ${maximumDistance} km` : 'No listings match those filters yet'}</p><p className="mt-2 text-sm text-stone-500">{location ? 'Try another product or increase the maximum search distance.' : 'Try another search or browse the full catalogue.'}</p>
          <button type="button" onClick={() => { setQuery(''); setCategory('All'); setProvince('All'); setVerified(false); setMinPrice(''); setMaxPrice(''); setAvailability('All'); setFulfilment('All'); setLocation(null); setLocationMessage(''); }} className="mt-5 rounded-full bg-[#1d4d32] px-5 py-2.5 text-sm font-bold text-white">Clear filters</button>
        </div>
      )}
      <p className="mt-6 text-xs text-stone-400">Seller listings, prices and availability are managed by account holders. Confirm fulfilment details before ordering.</p>
      <Link href="/categories" className="mt-5 inline-block text-sm font-semibold text-[#426e45]">Explore all categories →</Link>
    </div>
  );
}
