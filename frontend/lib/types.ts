export type CategoryType = 
  | 'Fresh Vegetables'
  | 'Fresh Fruits'
  | 'Grains and Cereals'
  | 'Livestock'
  | 'Livestock and Animal Products'
  | 'Dairy Products'
  | 'Poultry'
  | 'Poultry and Eggs'
  | 'Nuts and Seeds'
  | 'Herbs and Spices'
  | 'Processed Agricultural Products'
  | 'Agricultural Supplies'
  | 'Agricultural Services';

export type Province =
  | 'Limpopo'
  | 'Western Cape'
  | 'Gauteng'
  | 'Mpumalanga'
  | 'KwaZulu-Natal'
  | 'Free State'
  | 'Eastern Cape'
  | 'North West'
  | 'Northern Cape';

export interface Seller {
  id: string;
  businessName: string;
  tradingName?: string;
  registrationNumber: string;
  isVerified: boolean;
  verificationBadge: 'Gold Verified Supplier' | 'Verified Producer' | 'Verified Co-op' | 'Pending Verification';
  verifiedSince?: string;
  province: Province;
  district: string;
  latitude?: number;
  longitude?: number;
  farmSize?: string;
  avatar: string;
  bannerImage?: string;
  rating: number;
  reviewsCount: number;
  yearsInOperation: number;
  primaryCommodities: string[];
  certifications: string[];
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: CategoryType;
  subcategory: string;
  sellerId: string;
  seller: Seller;
  province: Province;
  price: number | null; // null indicates "Request a Quote"
  currency: string;
  priceUnit: string; // e.g., 'per Ton', 'per 50kg Bag', 'per Kg', 'per Crate', 'per Head', 'per Day'
  minOrderQuantity: string;
  stockStatus: 'In Stock' | 'Seasonal Harvest' | 'Available on Contract' | 'Limited Stock' | 'Out of Stock';
  availableQuantity?: string;
  availableForDelivery?: boolean;
  availableForCollection?: boolean;
  description: string;
  specifications: {
    grade?: string;
    variety?: string;
    packaging?: string;
    moistureContent?: string;
    shelfLife?: string;
    origin?: string;
    storageConditions?: string;
    organic?: boolean;
    certifications?: string[];
  };
  image: string;
  gallery?: string[];
  featured?: boolean;
  rating: number;
  reviewsCount: number;
  harvestDate?: string;
  createdAt: string;
}

export interface CategoryInfo {
  id: string;
  name: CategoryType;
  slug: string;
  description: string;
  iconName: string;
  itemCount: number;
  image: string;
  popularItems: string[];
}

export interface Enquiry {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  buyerEmail: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  quantityRequested: string;
  targetPrice?: string;
  deliveryProvince: Province;
  deliveryAddress?: string;
  requiredByDate?: string;
  status: 'Pending' | 'Quote Received' | 'In Negotiation' | 'Accepted' | 'Declined';
  message: string;
  createdAt: string;
  replies?: {
    id: string;
    sender: string;
    senderRole: 'buyer' | 'seller';
    message: string;
    quotePrice?: string;
    validUntil?: string;
    timestamp: string;
  }[];
}

export interface VerificationRequest {
  id: string;
  sellerId: string;
  businessName: string;
  legalRepresentative: string;
  registrationNumber: string;
  taxNumber?: string;
  province: Province;
  farmAddress: string;
  documentType: string;
  documentFileName: string;
  submittedDate: string;
  status: 'Pending Review' | 'Verified' | 'Under Investigation' | 'Rejected';
  notes?: string;
  verificationTier: 'Verified Producer' | 'Gold Verified Supplier' | 'Verified Co-op';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  companyName?: string;
  phone: string;
  province: Province;
  city: string;
  avatar: string;
  isVerified?: boolean;
  joinedDate: string;
}

export interface ComplaintOrFeedback {
  id: string;
  userId: string;
  userName: string;
  userRole: 'buyer' | 'seller';
  targetEntityName: string;
  type: 'Complaint' | 'Platform Feedback' | 'Quality Dispute' | 'Delivery Issue';
  subject: string;
  details: string;
  status: 'Open' | 'Under Review' | 'Resolved';
  submittedDate: string;
  resolution?: string;
}
