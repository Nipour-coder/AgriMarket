/**
 * AgriMarket - Central API Service Configuration
 * 
 * Configured for connection to the Node.js Express backend service.
 * In development / demo mode, this service provides structured endpoints,
 * type safety, error boundaries, and synthetic fallback responses so that
 * the user interface functions smoothly before or during backend deployment.
 */

import { Product, Seller, Enquiry, VerificationRequest, UserProfile } from './types';

// Default Express backend endpoint: http://localhost:5000/api
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  isDemoFallback?: boolean;
}

/**
 * Generic fetch wrapper for backend Express routes
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout for graceful demo fallback

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorJson.message || `Request failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backend connection unavailable';
    // Transparently indicate that backend is not reachable and UI is running in demo mode
    return {
      success: false,
      isDemoFallback: true,
      message: `Node.js Express backend not reachable at ${API_BASE_URL} (${message}). Operating in frontend demonstration mode.`,
    };
  }
}

/**
 * AgriMarket API Client Services
 */
export const api = {
  // Health & connection status check
  health: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET', cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Authentication Endpoints (Prepared for Express JWT / Session auth)
  auth: {
    login: async (credentials: { email: string; password: string; role?: string }) => {
      return request<{ user: UserProfile; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    register: async (payload: {
      accountType: 'buyer' | 'seller';
      name: string;
      email: string;
      password?: string;
      businessName?: string;
      registrationNumber?: string;
      province: string;
      phone: string;
    }) => {
      return request<{ user: UserProfile; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    getCurrentUser: async () => {
      return request<UserProfile>('/auth/me');
    },
  },

  // Products Endpoints
  products: {
    getAll: async (params?: { category?: string; province?: string; search?: string; verifiedOnly?: boolean }) => {
      const query = new URLSearchParams();
      if (params?.category) query.append('category', params.category);
      if (params?.province) query.append('province', params.province);
      if (params?.search) query.append('search', params.search);
      if (params?.verifiedOnly) query.append('verifiedOnly', 'true');
      
      const queryString = query.toString() ? `?${query.toString()}` : '';
      return request<Product[]>(`/products${queryString}`);
    },

    getById: async (id: string) => {
      return request<Product>(`/products/${id}`);
    },

    create: async (newProduct: Partial<Product>) => {
      return request<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
      });
    },

    update: async (id: string, updates: Partial<Product>) => {
      return request<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string) => {
      return request<{ id: string }>(`/products/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Enquiries & Quotes Endpoints
  enquiries: {
    getAll: async (role?: 'buyer' | 'seller') => {
      const q = role ? `?role=${role}` : '';
      return request<Enquiry[]>(`/enquiries${q}`);
    },

    create: async (enquiryData: Partial<Enquiry>) => {
      return request<Enquiry>('/enquiries', {
        method: 'POST',
        body: JSON.stringify(enquiryData),
      });
    },

    respond: async (enquiryId: string, reply: { message: string; quotePrice?: string }) => {
      return request<Enquiry>(`/enquiries/${enquiryId}/respond`, {
        method: 'POST',
        body: JSON.stringify(reply),
      });
    },
  },

  // Verification Queue Endpoints (For Admin & Seller)
  verification: {
    getQueue: async () => {
      return request<VerificationRequest[]>('/verification/queue');
    },

    submit: async (formData: FormData) => {
      return request<VerificationRequest>('/verification/submit', {
        method: 'POST',
        body: formData,
      });
    },

    updateStatus: async (requestId: string, status: 'Verified' | 'Rejected', notes?: string) => {
      return request<VerificationRequest>(`/verification/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    },
  },

  // Users & Moderation Endpoints
  users: {
    getAll: async () => {
      return request<UserProfile[]>('/users');
    },

    updateStatus: async (userId: string, status: string) => {
      return request<UserProfile>(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  },
};
