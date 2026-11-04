'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '@/lib/types';
import { MOCK_PRODUCTS } from '@/data/mockData';
import { minimumOrderAmount } from '@/lib/commerce';

const CART_KEY = 'agrimarket-demo-cart';

export interface CartLine {
  productId: string;
  quantity: number;
  product?: Product;
}

export interface DemoOrder {
  id: string;
  createdAt: string;
  customer: { name: string; email: string; phone: string };
  address: { province: string; city: string; suburb: string; street: string; postalCode: string; instructions: string };
  delivery: 'standard' | 'express' | 'collection' | 'scheduled';
  deliveryDate?: string;
  payment: string;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  status: string;
  history: { status: string; timestamp: string }[];
}

interface StoreContextValue {
  hydrated: boolean;
  cart: CartLine[];
  orders: DemoOrder[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number) => boolean;
  updateQuantity: (productId: string, quantity: number) => boolean;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeDemoOrder: (order: Omit<DemoOrder, 'id' | 'createdAt' | 'lines' | 'subtotal' | 'status' | 'history'>) => Promise<DemoOrder>;
  findOrder: (id: string) => DemoOrder | undefined;
  advanceOrder: (id: string) => boolean;
  cancelOrder: (id: string) => boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  const stored = window.localStorage.getItem(key);
  return stored ? (JSON.parse(stored) as T) : fallback;
}

function availableStock(product: Product): number {
  const availability = product.availableQuantity?.toLowerCase() ?? '';
  const parsed = Number(availability.match(/[\d,]+/)?.[0]?.replaceAll(',', ''));
  if (product.priceUnit.toLowerCase().includes('kg') && availability.includes('pallet')) {
    const kgPerPallet = Number(product.minOrderQuantity.match(/\(([\d,]+)\s*kg/i)?.[1]?.replaceAll(',', ''));
    if (Number.isFinite(kgPerPallet) && kgPerPallet > 0) return parsed * kgPerPallet;
  }
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1000;
}

function productForLine(line: CartLine): Product | undefined {
  return line.product ?? MOCK_PRODUCTS.find((product) => product.id === line.productId);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readStorage<CartLine[]>(CART_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    if (!hydrated || product.price === null || !Number.isInteger(quantity) || quantity < 1) return false;
    const currentQty = cart.find((line) => line.productId === product.id)?.quantity ?? 0;
    if (currentQty + quantity > availableStock(product) || (currentQty === 0 && quantity < minimumOrderAmount(product))) return false;
    setCart(currentQty
      ? cart.map((line) => line.productId === product.id ? { ...line, quantity: line.quantity + quantity, product } : line)
      : [...cart, { productId: product.id, quantity, product }]);
    return true;
  }, [cart, hydrated]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const line = cart.find((item) => item.productId === productId);
    const product = line ? productForLine(line) : undefined;
    if (!product || !Number.isInteger(quantity) || quantity < minimumOrderAmount(product) || quantity > availableStock(product)) return false;
    setCart((current) => current.map((item) => item.productId === productId ? { ...item, quantity, product } : item));
    return true;
  }, [cart]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const placeDemoOrder = useCallback(async (details: Omit<DemoOrder, 'id' | 'createdAt' | 'lines' | 'subtotal' | 'status' | 'history'>) => {
    const validLines = cart.filter((line) => {
      const product = productForLine(line);
      return product && product.price !== null && line.quantity >= minimumOrderAmount(product) && line.quantity <= availableStock(product);
    });
    if (validLines.length !== cart.length || validLines.length === 0) throw new Error('Some cart items are unavailable. Review your cart before placing the order.');
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines: validLines.map(({ productId, quantity }) => ({ productId, quantity })),
        address: { ...details.address, name: details.customer.name, phone: details.customer.phone },
        deliveryMethod: details.delivery,
        deliveryDate: details.deliveryDate,
        paymentMethod: details.payment,
      }),
    });
    const result = await response.json() as { id?: string; status?: string; subtotal?: number; deliveryFee?: number; error?: string };
    if (!response.ok || !result.id) throw new Error(result.error ?? 'Unable to place order.');
    const total = result.subtotal ?? validLines.reduce((sum, line) => sum + (productForLine(line)?.price ?? 0) * line.quantity, 0);
    const timestamp = new Date().toISOString();
    const order: DemoOrder = {
      ...details,
      id: result.id,
      createdAt: timestamp,
      lines: validLines,
      subtotal: total,
      deliveryFee: result.deliveryFee ?? 0,
      status: result.status ?? 'Order Placed',
      history: [{ status: result.status ?? 'Order Placed', timestamp }],
    };
    setOrders((current) => [order, ...current]);
    setCart([]);
    return order;
  }, [cart]);

  const findOrder = useCallback((id: string) => orders.find((order) => order.id === id), [orders]);
  const advanceOrder = useCallback((id: string) => {
    const target = orders.find((order) => order.id === id);
    if (!target) return false;
    const statuses = target.delivery === 'collection'
      ? ['Order Placed', 'Seller Processing Order', 'Ready for Collection', 'Collected']
      : ['Order Placed', 'Seller Processing Order', 'Ready for Collection or Dispatched', 'Out for Delivery', 'Delivered'];
    const next = statuses[statuses.indexOf(target.status) + 1];
    if (!next) return false;
    const timestamp = new Date().toISOString();
    setOrders((current) => current.map((order) => {
      if (order.id !== id) return order;
      return { ...order, status: next, history: [...order.history, { status: next, timestamp }] };
    }));
    return true;
  }, [orders]);
  const cancelOrder = useCallback((id: string) => {
    const target = orders.find((order) => order.id === id);
    if (!target || !['Order Placed', 'Seller Processing Order'].includes(target.status)) return false;
    const timestamp = new Date().toISOString();
    setOrders((current) => current.map((order) => {
      if (order.id !== id) return order;
      return { ...order, status: 'Cancelled', history: [...order.history, { status: 'Cancelled', timestamp }] };
    }));
    return true;
  }, [orders]);
  const itemCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce((total, line) => {
    const product = productForLine(line);
    return total + (product?.price ?? 0) * line.quantity;
  }, 0);

  const value = useMemo(() => ({
    hydrated, cart, orders, itemCount, subtotal, addToCart, updateQuantity, removeFromCart, clearCart, placeDemoOrder, findOrder, advanceOrder, cancelOrder,
  }), [hydrated, cart, orders, itemCount, subtotal, addToCart, updateQuantity, removeFromCart, clearCart, placeDemoOrder, findOrder, advanceOrder, cancelOrder]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
