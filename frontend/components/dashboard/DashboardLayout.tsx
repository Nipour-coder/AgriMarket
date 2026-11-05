'use client';

import React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { clearStoredToken } from '@/lib/apiFetch';
import { 
  Sprout, 
  ShieldCheck, 
  User, 
  Store, 
  LogOut, 
  LayoutDashboard, 
  ChevronRight, 
  Bell, 
  SlidersHorizontal,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface DashboardLayoutProps {
  role: 'buyer' | 'seller' | 'admin';
  title: string;
  subtitle: string;
  activeTab: string;
  tabs: TabItem[];
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export default function DashboardLayout({
  role,
  title,
  subtitle,
  activeTab,
  tabs,
  onTabChange,
  children,
}: DashboardLayoutProps) {
  const router = useRouter();

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    clearStoredToken();
    router.push('/login');
  };

  const roleConfig = {
    buyer: {
      label: 'Buyer Commercial Portal',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: <User className="w-4 h-4 text-emerald-700" />,
      company: 'Soweto Wholesale Food Distributors',
      user: 'David Khumalo',
    },
    seller: {
      label: 'Seller Producer Portal',
      badgeColor: 'bg-green-100 text-green-900 border-green-300',
      icon: <Store className="w-4 h-4 text-green-700" />,
      company: 'Valley Green Agri Cooperative',
      user: 'Francois Pretorius',
    },
    admin: {
      label: 'Platform Administration HQ',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: <ShieldCheck className="w-4 h-4 text-amber-700" />,
      company: 'AgriMarket Oversight Bureau',
      user: 'Admin Moderator',
    },
  }[role];

  return (
    <div className="min-h-screen bg-stone-100/70">
      {/* Top Demo Bar & Quick Role Switcher */}
      <div className="bg-[#0b2b1a] text-white py-2 px-4 sm:px-8 border-b border-emerald-900 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Demonstration Dashboard Active
            </span>
            <span className="hidden sm:inline text-stone-400">
              Logged in as <strong className="text-white">{roleConfig.user}</strong> ({roleConfig.company})
            </span>
          </div>

          {/* Quick Role Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-stone-400 text-[11px]">Switch Role:</span>
            <div className="inline-flex rounded-lg bg-emerald-950 p-0.5 border border-emerald-800/80">
              <NextLink
                href="/dashboard/buyer"
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  role === 'buyer'
                    ? 'bg-emerald-500 text-stone-950'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Buyer
              </NextLink>
              <NextLink
                href="/dashboard/seller"
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  role === 'seller'
                    ? 'bg-emerald-500 text-stone-950'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Seller
              </NextLink>
              <NextLink
                href="/dashboard/admin"
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  role === 'admin'
                    ? 'bg-amber-400 text-stone-950'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Admin
              </NextLink>
            </div>
            <NextLink
              href="/marketplace"
              className="text-stone-400 hover:text-white text-[11px] flex items-center gap-1 ml-2"
            >
              <span>Marketplace</span>
              <ExternalLink className="w-3 h-3" />
            </NextLink>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Strip */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleConfig.badgeColor}`}>
                {roleConfig.icon}
                {roleConfig.label}
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs font-medium text-stone-500">{roleConfig.company}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#114227] tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <NextLink
              href="/marketplace"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center gap-1.5"
            >
              <span>Browse Products</span>
            </NextLink>
            <button
              type="button"
              onClick={() => void signOut()}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 text-stone-600 hover:text-red-700 hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none border-b border-stone-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#114227] text-white shadow-md'
                    : 'bg-white hover:bg-stone-50 text-stone-600 border border-stone-200/80'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-400 text-stone-950'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Content */}
        <div className="transition-all duration-200">{children}</div>
      </div>
    </div>
  );
}
