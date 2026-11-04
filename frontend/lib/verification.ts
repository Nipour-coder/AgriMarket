export const SELLER_APPLICATION_KEY = 'agrimarket-demo-seller-application';

export type SellerVerificationStatus =
  | 'Pending Verification'
  | 'Under Review'
  | 'Verified'
  | 'Rejected'
  | 'Suspended';

export interface SellerKycDocuments {
  identityFront?: string;
  identityBack?: string;
  proofOfAddress?: string;
  supportingDocuments?: string[];
}

export interface SellerNotification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface SellerApplication {
  fullName?: string;
  representativeRole?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  farmName?: string;
  registrationNumber?: string;
  farmAddress?: string;
  province?: string;
  verificationStatus?: SellerVerificationStatus;
  verificationSubmittedAt?: string;
  verificationReason?: string;
  verificationUpdatedAt?: string;
  kycDocuments?: SellerKycDocuments;
  notifications?: SellerNotification[];
}

export function hasCompleteKycDocuments(application: SellerApplication): boolean {
  const documents = application.kycDocuments;
  return Boolean(
    documents?.identityFront
    && documents.identityBack
    && documents.proofOfAddress
    && documents.supportingDocuments?.some(Boolean),
  );
}
