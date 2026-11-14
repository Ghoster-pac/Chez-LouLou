export type CategoryId = 'femme' | 'homme' | 'enfants' | 'jeunes' | 'cadeaux';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod =
  | 'wave'
  | 'orange_money'
  | 'mtn_momo'
  | 'card'
  | 'cash_on_delivery';

export type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid' | 'failed';

export type SizeGuideCategory = 'vetements' | 'enfants' | 'chaussures' | 'accessoires';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  title: string;
  category: CategoryId;
  description: string;
  priceXof: number;
  compareAtPriceXof?: number | null;
  imageUrl: string;
  galleryUrls?: string[];
  colors?: ProductColor[];
  sizeGuideCategory?: SizeGuideCategory | null;
  available: boolean;
  stock: number;
  sizes: string[];
  festiveTags: string[];
  featured: boolean;
  salesCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StoreSettings {
  festiveMode: 'auto' | 'manual';
  manualSeasonId: string;
  customBannerText: string;
  festiveDiscountPercent: number;
  freeDeliveryThresholdXof: number;
  standardDeliveryFeeXof: number;
  storePhone: string;
  whatsappPhone: string;
  whatsappAutoNotify: boolean;
  preferredPaymentGateway: 'wave_direct' | 'paystack' | 'cinetpay' | 'manual';
  loyaltyEarnStepXof: number;
  loyaltyPointValueXof: number;
  loyaltyMinRedeemPoints: number;
  loyaltyMinOrderXof: number;
  loyaltyMaxDiscountPercent: number;
  updatedAt?: unknown;
}

export interface CustomGiftBoxDetails {
  boxName: string;
  boxPriceXof: number;
  tissueColor: string;
  recipientName: string;
  giftMessage: string;
  includedItems: Array<{
    productId: string;
    title: string;
    priceXof: number;
  }>;
}

export interface OrderItem {
  productId: string;
  title: string;
  category: CategoryId;
  priceXof: number;
  quantity: number;
  size: string;
  color?: string | null;
  imageUrl: string;
  customGiftDetails?: CustomGiftBoxDetails | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  commune: string;
  addressDetails: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentReference?: string | null;
  paymentProvider?: string | null;
  items: OrderItem[];
  subtotalXof: number;
  deliveryFeeXof: number;
  discountXof: number;
  promoCode?: string | null;
  promoDiscountXof?: number;
  pointsRedeemed: number;
  pointsDiscountXof: number;
  pointsEarned: number;
  pointsCredited: boolean;
  referralCodeUsed?: string | null;
  referralRewarded?: boolean;
  totalXof: number;
  status: OrderStatus;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LoyaltyAccount {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  pointsBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  referralCode?: string | null;
  referredByCode?: string | null;
  lastOrderId?: string | null;
  updatedAt?: unknown;
}

export type LoyaltyTransactionType =
  | 'welcome'
  | 'earn'
  | 'redeem'
  | 'refund'
  | 'bonus'
  | 'referral';

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: LoyaltyTransactionType;
  pointsDelta: number;
  orderId?: string | null;
  orderNumber?: string | null;
  description: string;
  createdAt?: unknown;
}

export interface Referral {
  id: string;
  code: string;
  ownerId: string;
  ownerName: string;
  successfulCount: number;
  totalBonusPoints: number;
  createdAt?: unknown;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  partnerName: string;
  discountType: 'percent' | 'fixed_xof';
  discountValue: number;
  minOrderXof: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  seasonTag?: string | null;
  expiresAt?: string | null;
  lastOrderId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Review {
  id: string;
  productId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  photoUrl?: string | null;
  verifiedPurchase: boolean;
  createdAt?: unknown;
}

export interface NotificationLog {
  id: string;
  orderId?: string | null;
  orderNumber?: string | null;
  recipientRole: 'customer' | 'admin';
  recipientPhone: string;
  channel: 'whatsapp' | 'sms';
  event: string;
  message: string;
  status: 'queued' | 'sent' | 'manual_link';
  createdAt?: unknown;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastSenderRole: 'customer' | 'admin';
  unreadByAdmin: boolean;
  unreadByCustomer: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  text: string;
  productId?: string | null;
  productTitle?: string | null;
  productPriceXof?: number | null;
  createdAt?: unknown;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color?: string | null;
  customGiftDetails?: CustomGiftBoxDetails | null;
}

export interface FestiveSeason {
  id: string;
  name: string;
  kind: 'event' | 'season' | 'signature';
  periodLabel: string;
  bannerText: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtitle: string;
  ctaLabel: string;
  featuredCategories: CategoryId[];
  isDarkTheme?: boolean;
  canvasHex: string;
  surfaceHex: string;
  surfaceSubtleHex: string;
  inkHex: string;
  inkMutedHex: string;
  borderHex: string;
  accentHex: string;
  accentHoverHex: string;
  accentSoftHex: string;
  accentContrastHex: string;
  bannerBgHex: string;
  bannerInkHex: string;
  suggestedDiscountPercent: number;
}
