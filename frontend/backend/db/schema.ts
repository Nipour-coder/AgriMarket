import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const accountRole = pgEnum('account_role', ['buyer', 'seller', 'admin']);
export const sellerVerificationStatus = pgEnum('seller_verification_status', [
  'Pending Verification',
  'Under Review',
  'Verified',
  'Rejected',
  'Suspended',
]);
export const productStatus = pgEnum('product_status', ['draft', 'active', 'archived']);
export const disputeDirection = pgEnum('dispute_direction', ['buyer_to_seller', 'seller_to_buyer']);
export const disputeStatus = pgEnum('dispute_status', ['Open', 'Responded', 'Under Review', 'Resolved', 'Closed']);
export const disputeResolution = pgEnum('dispute_resolution', [
  'Buyer refund recommended',
  'Partial refund recommended',
  'Seller upheld',
  'No refund',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  email: varchar('email', { length: 320 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: accountRole('role').notNull().default('buyer'),
  phone: varchar('phone', { length: 40 }).notNull(),
  province: varchar('province', { length: 80 }).notNull(),
  city: varchar('city', { length: 120 }).notNull().default(''),
  companyName: varchar('company_name', { length: 200 }),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailUnique: uniqueIndex('users_email_unique').on(table.email),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tokenUnique: uniqueIndex('sessions_token_hash_unique').on(table.tokenHash),
  userIndex: index('sessions_user_id_idx').on(table.userId),
}));

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tokenUnique: uniqueIndex('email_verification_tokens_hash_unique').on(table.tokenHash),
  userIndex: index('email_verification_tokens_user_id_idx').on(table.userId),
}));

export const sellerProfiles = pgTable('seller_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  businessName: varchar('business_name', { length: 200 }).notNull(),
  representativeRole: varchar('representative_role', { length: 120 }).notNull().default('Owner'),
  registrationNumber: varchar('registration_number', { length: 120 }),
  farmAddress: text('farm_address').notNull(),
  province: varchar('province', { length: 80 }).notNull(),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  primarySector: varchar('primary_sector', { length: 120 }).notNull(),
  farmSize: varchar('farm_size', { length: 120 }),
  verificationStatus: sellerVerificationStatus('verification_status').notNull().default('Pending Verification'),
  verificationReason: text('verification_reason'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  documentChecklist: jsonb('document_checklist').$type<{
    identityFront?: boolean;
    identityBack?: boolean;
    proofOfAddress?: boolean;
    supportingDocuments?: boolean;
  }>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusIndex: index('seller_profiles_verification_status_idx').on(table.verificationStatus),
}));

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 240 }).notNull(),
  category: varchar('category', { length: 120 }).notNull(),
  subcategory: varchar('subcategory', { length: 120 }).notNull().default(''),
  province: varchar('province', { length: 80 }).notNull(),
  priceCents: integer('price_cents'),
  currency: varchar('currency', { length: 3 }).notNull().default('ZAR'),
  priceUnit: varchar('price_unit', { length: 80 }).notNull(),
  minimumQuantity: integer('minimum_quantity').notNull().default(1),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  stockStatus: varchar('stock_status', { length: 80 }).notNull().default('In Stock'),
  description: text('description').notNull().default(''),
  specifications: jsonb('specifications').$type<Record<string, string | boolean | string[]>>().notNull().default({}),
  image: text('image').notNull().default(''),
  gallery: jsonb('gallery').$type<string[]>().notNull().default([]),
  availableForDelivery: boolean('available_for_delivery').notNull().default(true),
  availableForCollection: boolean('available_for_collection').notNull().default(true),
  status: productStatus('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugUnique: uniqueIndex('products_slug_unique').on(table.slug),
  sellerIndex: index('products_seller_id_idx').on(table.sellerId),
  publicListingIndex: index('products_status_category_idx').on(table.status, table.category),
}));

export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 80 }).notNull().default('Main address'),
  recipientName: varchar('recipient_name', { length: 160 }).notNull(),
  phone: varchar('phone', { length: 40 }).notNull(),
  province: varchar('province', { length: 80 }).notNull(),
  city: varchar('city', { length: 120 }).notNull(),
  suburb: varchar('suburb', { length: 120 }).notNull().default(''),
  street: text('street').notNull(),
  postalCode: varchar('postal_code', { length: 20 }).notNull().default(''),
  instructions: text('instructions').notNull().default(''),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIndex: index('addresses_user_id_idx').on(table.userId),
}));

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  displayId: varchar('display_id', { length: 40 }).notNull(),
  buyerId: uuid('buyer_id').notNull().references(() => users.id),
  addressSnapshot: jsonb('address_snapshot').$type<Record<string, string>>().notNull(),
  deliveryMethod: varchar('delivery_method', { length: 40 }).notNull(),
  deliveryDate: varchar('delivery_date', { length: 40 }),
  paymentMethod: varchar('payment_method', { length: 80 }).notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  deliveryFeeCents: integer('delivery_fee_cents').notNull().default(0),
  status: varchar('status', { length: 80 }).notNull().default('Order Placed'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  displayIdUnique: uniqueIndex('orders_display_id_unique').on(table.displayId),
  buyerIndex: index('orders_buyer_id_idx').on(table.buyerId),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  sellerId: uuid('seller_id').notNull().references(() => users.id),
  productName: varchar('product_name', { length: 200 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  sellerStatus: varchar('seller_status', { length: 80 }).notNull().default('Pending'),
}, (table) => ({
  orderIndex: index('order_items_order_id_idx').on(table.orderId),
  sellerIndex: index('order_items_seller_id_idx').on(table.sellerId),
}));

export const orderEvents = pgTable('order_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 80 }).notNull(),
  message: text('message').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orderIndex: index('order_events_order_id_idx').on(table.orderId),
}));

export const disputes = pgTable('disputes', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id, { onDelete: 'cascade' }),
  buyerId: uuid('buyer_id').notNull().references(() => users.id),
  sellerId: uuid('seller_id').notNull().references(() => users.id),
  reporterId: uuid('reporter_id').notNull().references(() => users.id),
  respondentId: uuid('respondent_id').notNull().references(() => users.id),
  direction: disputeDirection('direction').notNull(),
  category: varchar('category', { length: 80 }).notNull(),
  description: text('description').notNull(),
  status: disputeStatus('status').notNull().default('Open'),
  resolution: disputeResolution('resolution'),
  resolutionReason: text('resolution_reason'),
  refundAmountCents: integer('refund_amount_cents'),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orderIndex: index('disputes_order_id_idx').on(table.orderId),
  orderItemIndex: index('disputes_order_item_id_idx').on(table.orderItemId),
  reporterIndex: index('disputes_reporter_id_idx').on(table.reporterId),
  respondentIndex: index('disputes_respondent_id_idx').on(table.respondentId),
  statusIndex: index('disputes_status_idx').on(table.status),
}));

export const disputeMessages = pgTable('dispute_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  disputeId: uuid('dispute_id').notNull().references(() => disputes.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  disputeIndex: index('dispute_messages_dispute_id_idx').on(table.disputeId),
}));

export const disputeEvidence = pgTable('dispute_evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  disputeId: uuid('dispute_id').notNull().references(() => disputes.id, { onDelete: 'cascade' }),
  uploaderId: uuid('uploader_id').notNull().references(() => users.id),
  storageKey: text('storage_key').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  contentType: varchar('content_type', { length: 120 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  disputeIndex: index('dispute_evidence_dispute_id_idx').on(table.disputeId),
  storageKeyUnique: uniqueIndex('dispute_evidence_storage_key_unique').on(table.storageKey),
}));

export const enquiries = pgTable('enquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  buyerId: uuid('buyer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sellerId: uuid('seller_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  quantityRequested: varchar('quantity_requested', { length: 120 }).notNull(),
  targetPrice: varchar('target_price', { length: 120 }),
  deliveryProvince: varchar('delivery_province', { length: 80 }).notNull(),
  deliveryAddress: text('delivery_address'),
  requiredByDate: varchar('required_by_date', { length: 40 }),
  status: varchar('status', { length: 40 }).notNull().default('Pending'),
  message: text('message').notNull(),
  quotePrice: varchar('quote_price', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  buyerIndex: index('enquiries_buyer_id_idx').on(table.buyerId),
  sellerIndex: index('enquiries_seller_id_idx').on(table.sellerId),
}));

export const enquiryMessages = pgTable('enquiry_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  enquiryId: uuid('enquiry_id').notNull().references(() => enquiries.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  quotePrice: varchar('quote_price', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  enquiryIndex: index('enquiry_messages_enquiry_id_idx').on(table.enquiryId),
}));

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIndex: index('notifications_user_id_idx').on(table.userId),
}));

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 160 }).notNull(),
  email: varchar('email', { length: 320 }).notNull(),
  subject: varchar('subject', { length: 200 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 40 }).notNull().default('Open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
