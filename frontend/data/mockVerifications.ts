export interface VerificationDocument {
  id: string;
  name: string;
  type: 'CIPC Registration' | 'Proof of Farm Address' | 'SARS Tax Compliance' | 'GAP / GlobalG.A.P Audit' | 'Representative ID';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  verified: boolean;
  fileUrl: string;
}

export interface SellerApplication {
  userId: string;
  businessName: string;
  representativeRole: string;
  registrationNumber: string | null;
  taxNumber: string | null;
  farmAddress: string;
  province: string;
  primarySector: string;
  farmSize: string | null;
  status: 'Pending Verification' | 'Under Review' | 'Verified' | 'Rejected' | 'Suspended';
  reason: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  contactName: string;
  email: string;
  phone: string;
  emailVerifiedAt: string | null;
  hasOfficialBadge: boolean;
  documents: VerificationDocument[];
  checklist: {
    cipcVerified: boolean;
    taxCompliant: boolean;
    farmLocationInspected: boolean;
    directorIdMatched: boolean;
    foodSafetyAccredited: boolean;
  };
  notificationsSent: {
    id: string;
    message: string;
    timestamp: string;
    type: 'approval' | 'rejection' | 'review' | 'suspension';
  }[];
}

export const INITIAL_APPLICATIONS: SellerApplication[] = [
  {
    userId: 'seller-new-1',
    businessName: 'Lebowakgomo Citrus & Subtropical Farm Co-op',
    representativeRole: 'Managing Director & Lead Farmer',
    registrationNumber: '2022/419821/24',
    taxNumber: '9482103891',
    farmAddress: 'Farm Groothoek 112, Lebowakgomo Agricultural District',
    province: 'Limpopo',
    primarySector: 'Fresh Fruits (Citrus, Avocados, Mangoes)',
    farmSize: '320 Hectares Under Drip Irrigation',
    status: 'Pending Verification',
    reason: null,
    submittedAt: '2026-11-02T08:30:00Z',
    contactName: 'Thabo Mokoena',
    email: 'thabo@lebowakgomo-agri.co.za',
    phone: '+27 (0)15 632 8910',
    emailVerifiedAt: '2026-11-02T08:35:00Z',
    hasOfficialBadge: false,
    documents: [
      {
        id: 'doc-1',
        name: 'CIPC Official Registration Certificate (Co-op)',
        type: 'CIPC Registration',
        fileName: 'Lebowakgomo_CIPC_Cert_2022.pdf',
        fileSize: '1.4 MB',
        uploadedAt: '2026-11-02',
        verified: true,
        fileUrl: '#preview-cipc',
      },
      {
        id: 'doc-2',
        name: 'Title Deed & Municipal Water Rights Permit',
        type: 'Proof of Farm Address',
        fileName: 'Groothoek_112_Title_Deed.pdf',
        fileSize: '3.8 MB',
        uploadedAt: '2026-11-02',
        verified: true,
        fileUrl: '#preview-deed',
      },
      {
        id: 'doc-3',
        name: 'SARS Good Standing Tax PIN Verification',
        type: 'SARS Tax Compliance',
        fileName: 'SARS_Tax_Clearance_2026.pdf',
        fileSize: '620 KB',
        uploadedAt: '2026-11-02',
        verified: true,
        fileUrl: '#preview-tax',
      },
      {
        id: 'doc-4',
        name: 'GlobalG.A.P Option 2 Group Certification',
        type: 'GAP / GlobalG.A.P Audit',
        fileName: 'GlobalGAP_Limpopo_Audit_2026.pdf',
        fileSize: '2.1 MB',
        uploadedAt: '2026-11-02',
        verified: true,
        fileUrl: '#preview-gap',
      },
      {
        id: 'doc-5',
        name: 'Certified Copy of Representative ID (Thabo Mokoena)',
        type: 'Representative ID',
        fileName: 'Director_Mokoena_Certified_ID.pdf',
        fileSize: '950 KB',
        uploadedAt: '2026-11-02',
        verified: true,
        fileUrl: '#preview-id',
      },
    ],
    checklist: {
      cipcVerified: true,
      taxCompliant: true,
      farmLocationInspected: false,
      directorIdMatched: true,
      foodSafetyAccredited: true,
    },
    notificationsSent: [],
  },
  {
    userId: 'seller-new-2',
    businessName: 'Highveld Golden Grain Producers (Pty) Ltd',
    representativeRole: 'Commercial Operations Manager',
    registrationNumber: '2020/583921/07',
    taxNumber: '9281923048',
    farmAddress: 'Plot 18, Bethal Silo Corridor, Mpumalanga',
    province: 'Mpumalanga',
    primarySector: 'Grains & Cereals (Yellow Maize, Soya, Milling Wheat)',
    farmSize: '1,450 Hectares Dryland Grain',
    status: 'Under Review',
    reason: null,
    submittedAt: '2026-11-01T14:15:00Z',
    reviewedAt: '2026-11-03T09:20:00Z',
    contactName: 'Johan van der Merwe',
    email: 'johan@highveld-grain.co.za',
    phone: '+27 (0)17 647 3211',
    emailVerifiedAt: '2026-11-01T14:20:00Z',
    hasOfficialBadge: false,
    documents: [
      {
        id: 'doc-6',
        name: 'CIPC Certificate of Incorporation (COR 14.3)',
        type: 'CIPC Registration',
        fileName: 'Highveld_Grain_COR14.3.pdf',
        fileSize: '1.2 MB',
        uploadedAt: '2026-11-01',
        verified: true,
        fileUrl: '#preview-cipc',
      },
      {
        id: 'doc-7',
        name: 'Grain SA Silo Inspection & Storage Accreditation',
        type: 'Proof of Farm Address',
        fileName: 'GrainSA_Bethal_Silo_Audit.pdf',
        fileSize: '2.5 MB',
        uploadedAt: '2026-11-01',
        verified: true,
        fileUrl: '#preview-silo',
      },
      {
        id: 'doc-8',
        name: 'SARS Tax Compliance Status PIN',
        type: 'SARS Tax Compliance',
        fileName: 'SARS_TCS_PIN_9281923048.pdf',
        fileSize: '410 KB',
        uploadedAt: '2026-11-01',
        verified: true,
        fileUrl: '#preview-tax',
      },
    ],
    checklist: {
      cipcVerified: true,
      taxCompliant: true,
      farmLocationInspected: true,
      directorIdMatched: true,
      foodSafetyAccredited: false,
    },
    notificationsSent: [
      {
        id: 'notif-1',
        message: 'Your seller application has entered Under Review status by the AgriMarket administration.',
        timestamp: '2026-11-03T09:20:00Z',
        type: 'review',
      },
    ],
  },
  {
    userId: 'seller-new-3',
    businessName: 'Valley Green Agri Cooperative',
    representativeRole: 'Chief Executive Officer',
    registrationNumber: '2018/492104/24',
    taxNumber: '9082341902',
    farmAddress: 'Plot 14, Levubu Subtropical Corridor, Limpopo',
    province: 'Limpopo',
    primarySector: 'Fresh Vegetables & Subtropical Commodities',
    farmSize: '420 Hectares Commercial Orchard',
    status: 'Verified',
    reason: null,
    submittedAt: '2026-10-15T10:00:00Z',
    reviewedAt: '2026-10-18T11:45:00Z',
    contactName: 'Tendai Ndlovu',
    email: 'orders@valleygreenagri.co.za',
    phone: '+27 (0)15 516 4320',
    emailVerifiedAt: '2026-10-15T10:05:00Z',
    hasOfficialBadge: true,
    documents: [
      {
        id: 'doc-9',
        name: 'CIPC Certified Registration & Shareholder Ledger',
        type: 'CIPC Registration',
        fileName: 'Valley_Green_CIPC_Verified.pdf',
        fileSize: '2.1 MB',
        uploadedAt: '2026-10-15',
        verified: true,
        fileUrl: '#preview-cipc',
      },
      {
        id: 'doc-10',
        name: 'GlobalG.A.P Food Safety Accreditation Certificate',
        type: 'GAP / GlobalG.A.P Audit',
        fileName: 'GlobalGAP_Levubu_Certified.pdf',
        fileSize: '3.4 MB',
        uploadedAt: '2026-10-15',
        verified: true,
        fileUrl: '#preview-gap',
      },
    ],
    checklist: {
      cipcVerified: true,
      taxCompliant: true,
      farmLocationInspected: true,
      directorIdMatched: true,
      foodSafetyAccredited: true,
    },
    notificationsSent: [
      {
        id: 'notif-2',
        message: 'Congratulations! Your seller verification application was approved. The official AgriMarket verification badge is now displayed on your store profile and listings.',
        timestamp: '2026-10-18T11:45:00Z',
        type: 'approval',
      },
    ],
  },
  {
    userId: 'seller-new-4',
    businessName: 'Karoo Organic Mutton & Wool Breeders',
    representativeRole: 'Stud Breeder & Owner',
    registrationNumber: '2019/302914/07',
    taxNumber: '9581920391',
    farmAddress: 'Weltevrede Farm, R63 Road, Graaff-Reinet District',
    province: 'Eastern Cape',
    primarySector: 'Livestock (Dorper Sheep, Stud Rams, Merino Wool)',
    farmSize: '5,200 Hectares Karoo Rangeland',
    status: 'Rejected',
    reason: 'Farm lease agreement provided has expired (ended August 2026). Please upload renewed tenure or letter of authority from the landowner.',
    submittedAt: '2026-10-20T16:00:00Z',
    reviewedAt: '2026-10-22T08:30:00Z',
    contactName: 'Pieter Marais',
    email: 'pieter@karoomutton.co.za',
    phone: '+27 (0)49 892 1104',
    emailVerifiedAt: '2026-10-20T16:10:00Z',
    hasOfficialBadge: false,
    documents: [
      {
        id: 'doc-11',
        name: 'Land Lease Contract (Expired August 2026)',
        type: 'Proof of Farm Address',
        fileName: 'Weltevrede_Lease_2023_2026.pdf',
        fileSize: '4.2 MB',
        uploadedAt: '2026-10-20',
        verified: false,
        fileUrl: '#preview-lease',
      },
    ],
    checklist: {
      cipcVerified: true,
      taxCompliant: true,
      farmLocationInspected: false,
      directorIdMatched: true,
      foodSafetyAccredited: false,
    },
    notificationsSent: [
      {
        id: 'notif-3',
        message: 'Your seller application was rejected. Reason: Farm lease agreement provided has expired (ended August 2026). Please upload renewed tenure or letter of authority from the landowner.',
        timestamp: '2026-10-22T08:30:00Z',
        type: 'rejection',
      },
    ],
  },
  {
    userId: 'seller-new-5',
    businessName: 'Durban Wholesale Agro Supplies (Suspended)',
    representativeRole: 'Director',
    registrationNumber: '2017/291039/07',
    taxNumber: '9381029341',
    farmAddress: 'Warehouse 8, Pinetown Industrial Park, Durban',
    province: 'KwaZulu-Natal',
    primarySector: 'Agricultural Supplies & Fertilizers',
    farmSize: 'Industrial Depot',
    status: 'Suspended',
    reason: 'Repeated non-fulfilment of commercial fertilizer orders and customer chargebacks under dispute resolution.',
    submittedAt: '2026-09-10T11:00:00Z',
    reviewedAt: '2026-10-29T15:20:00Z',
    contactName: 'Sanjay Maharaj',
    email: 'sanjay@durbanagro.co.za',
    phone: '+27 (0)31 701 4455',
    emailVerifiedAt: '2026-09-10T11:05:00Z',
    hasOfficialBadge: false,
    documents: [],
    checklist: {
      cipcVerified: true,
      taxCompliant: false,
      farmLocationInspected: false,
      directorIdMatched: true,
      foodSafetyAccredited: false,
    },
    notificationsSent: [
      {
        id: 'notif-4',
        message: 'Your seller account has been suspended by the administrator. Reason: Repeated non-fulfilment of commercial fertilizer orders and customer chargebacks under dispute resolution.',
        timestamp: '2026-10-29T15:20:00Z',
        type: 'suspension',
      },
    ],
  },
];

// In-memory runtime store for server lifecycle
let applicationsStore: SellerApplication[] = [...INITIAL_APPLICATIONS];

export function getApplications(): SellerApplication[] {
  return applicationsStore;
}

export function updateApplication(
  userId: string,
  updates: Partial<SellerApplication>
): SellerApplication | null {
  const index = applicationsStore.findIndex((app) => app.userId === userId);
  if (index === -1) return null;

  const current = applicationsStore[index];
  const updated = {
    ...current,
    ...updates,
    reviewedAt: new Date().toISOString(),
  };

  // If status changed to Verified, grant official badge
  if (updates.status === 'Verified') {
    updated.hasOfficialBadge = true;
    updated.reason = null;
    updated.notificationsSent = [
      {
        id: `notif-${Date.now()}`,
        message: 'Congratulations! Your seller verification application was approved. The official AgriMarket verification badge is now active on your store and products.',
        timestamp: new Date().toISOString(),
        type: 'approval',
      },
      ...current.notificationsSent,
    ];
  } else if (updates.status === 'Rejected') {
    updated.hasOfficialBadge = false;
    updated.notificationsSent = [
      {
        id: `notif-${Date.now()}`,
        message: `Your seller verification application was rejected. Reason: ${updates.reason || 'Missing compliance documents.'}`,
        timestamp: new Date().toISOString(),
        type: 'rejection',
      },
      ...current.notificationsSent,
    ];
  } else if (updates.status === 'Suspended') {
    updated.hasOfficialBadge = false;
    updated.notificationsSent = [
      {
        id: `notif-${Date.now()}`,
        message: `Your seller account has been suspended. Reason: ${updates.reason || 'Violation of terms.'}`,
        timestamp: new Date().toISOString(),
        type: 'suspension',
      },
      ...current.notificationsSent,
    ];
  } else if (updates.status === 'Under Review') {
    updated.hasOfficialBadge = false;
    updated.notificationsSent = [
      {
        id: `notif-${Date.now()}`,
        message: 'Your verification documents are now being reviewed by the Agricultural Verification Officer.',
        timestamp: new Date().toISOString(),
        type: 'review',
      },
      ...current.notificationsSent,
    ];
  }

  applicationsStore[index] = updated;
  return updated;
}
