export type DeliveryType = 'AUTOMATIC_CODE' | 'AUTOMATIC_FILE' | 'MANUAL';

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

export type TransactionType = 
  | 'DEPOSIT_CREDIT' 
  | 'PRODUCT_PURCHASE' 
  | 'REFUND' 
  | 'REFERRAL_COMMISSION' 
  | 'ADMIN_ADJUSTMENT' 
  | 'WITHDRAWAL';

export type PaymentMethod = 
  | 'BKASH' 
  | 'NAGAD' 
  | 'ROCKET' 
  | 'TELEGRAM_STARS' 
  | 'USDT_TRC20' 
  | 'CARD_GATEWAY';

export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type InventoryStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface TelegramUser {
  id: string;
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  balance: number; // in BDT
  referralCode: string;
  referredBy?: string;
  referralEarnings: number;
  referralCount: number;
  language: 'en' | 'bn';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameBn?: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  description?: string;
}

export interface ProductPlanEntry {
  id: string; // e.g., 'prod-zee5-1y'
  productName: string; // e.g., 'Zee5'
  category: string; // Category ID e.g., 'streaming'
  categoryName: string; // 'Streaming & Entertainment'
  planName: string; // e.g., '1 Year' or 'Standard'
  duration: string; // e.g., '1 Year', '1 Month', 'Lifetime'
  sourcePriceInr: number | null; // e.g., 399, null if unavailable
  sourceCurrency: 'INR';
  sellingPriceBdt: number | null; // Admin configured BDT selling price
  description: string;
  descriptionBn?: string;
  imageUrl: string;
  stock: number;
  deliveryType: DeliveryType;
  isActive: boolean;
  isPriceUnavailable: boolean; // Flag if source price was unavailable
  isOutOfStock: boolean; // Flag (e.g. Claude Pro)
  sourceReference: string; // 'Uploaded Catalog 2026'
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistoryRecord {
  id: string;
  productId: string;
  productName: string;
  planName: string;
  oldPriceBdt: number | null;
  newPriceBdt: number | null;
  oldPriceInr: number | null;
  newPriceInr: number | null;
  changedBy: string;
  reason: string;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  content: string;
  status: InventoryStatus;
  allocatedOrderId?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  planName: string;
  duration: string;
  quantity: number;
  unitPriceBdt: number;
  totalPriceBdt: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  telegramId: number;
  items: OrderItem[];
  totalAmount: number;
  currency: 'BDT';
  status: OrderStatus;
  deliveryType: DeliveryType;
  deliveryData?: string;
  fulfillmentNotes?: string;
  fulfilledBy?: string;
  fulfilledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerTransaction {
  id: string;
  userId: string;
  telegramId: number;
  type: TransactionType;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  reason: string;
  performedBy?: string;
  createdAt: string;
}

export interface DepositRequest {
  id: string;
  reference: string;
  userId: string;
  telegramId: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: DepositStatus;
  transactionHash?: string;
  processedBy?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  telegramId: number;
  subject: string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  messages: {
    id: string;
    sender: 'USER' | 'ADMIN';
    senderName: string;
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  botUsername: string;
  currency: string;
  announcementChannelUrl: string;
  supportUsername: string;
  referralCommissionPercent: number;
  minDepositAmount: number;
  maxDepositAmount: number;
  inrToBdtExchangeRate: number; // e.g. 1.45 default conversion suggestion
  paymentMethodsConfig: {
    bkashNumber: string;
    nagadNumber: string;
    rocketNumber: string;
    usdtTrc20Address: string;
    telegramStarsEnabled: boolean;
  };
}

export interface ImportReport {
  timestamp: string;
  totalEntries: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  details: {
    productId: string;
    productName: string;
    plan: string;
    action: 'INSERTED' | 'UPDATED' | 'SKIPPED' | 'FAILED';
    reason?: string;
  }[];
}
