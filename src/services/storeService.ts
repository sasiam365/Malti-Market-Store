import { 
  TelegramUser, 
  Category, 
  ProductPlanEntry, 
  InventoryItem, 
  Order, 
  LedgerTransaction, 
  DepositRequest, 
  SupportTicket, 
  StoreSettings, 
  PriceHistoryRecord,
  ImportReport,
  PaymentMethod
} from '../types';

import { CATALOG_CATEGORIES, RAW_84_PRODUCT_ENTRIES } from '../store/productsCatalog84';

const STORAGE_KEY = 'telestore_pro_v2_storage';

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeName: 'TeleStore Pro',
  botUsername: '@TeleStoreProBot',
  currency: 'BDT',
  announcementChannelUrl: 'https://t.me/TeleStoreProNews',
  supportUsername: '@TeleStoreProSupport',
  referralCommissionPercent: 5.0,
  minDepositAmount: 50,
  maxDepositAmount: 50000,
  inrToBdtExchangeRate: 1.48, // 1 INR ~ 1.48 BDT standard benchmark
  paymentMethodsConfig: {
    bkashNumber: '01712-345678',
    nagadNumber: '01812-987654',
    rocketNumber: '01911-223344-9',
    usdtTrc20Address: 'TYsQ9v8nCqK8p6K5g9WqE8zL4P9q1u1x9Z',
    telegramStarsEnabled: true
  }
};

const INITIAL_USERS: TelegramUser[] = [
  {
    id: 'usr-siam',
    telegramId: 589218491,
    username: 'siam_developer',
    firstName: 'Siam',
    lastName: 'Ahmed',
    balance: 2500.0,
    referralCode: 'REF-SIAM98',
    referralEarnings: 280.0,
    referralCount: 4,
    language: 'en',
    createdAt: '2026-09-15T08:00:00Z'
  },
  {
    id: 'usr-rahim',
    telegramId: 742198032,
    username: 'rahim_buyer',
    firstName: 'Rahim',
    lastName: 'Chowdhury',
    balance: 650.0,
    referralCode: 'REF-RAHIM74',
    referredBy: 'REF-SIAM98',
    referralEarnings: 0.0,
    referralCount: 0,
    language: 'bn',
    createdAt: '2026-09-20T12:00:00Z'
  }
];

interface StoreState {
  settings: StoreSettings;
  categories: Category[];
  products: ProductPlanEntry[];
  inventory: InventoryItem[];
  users: TelegramUser[];
  orders: Order[];
  ledger: LedgerTransaction[];
  deposits: DepositRequest[];
  tickets: SupportTicket[];
  priceHistory: PriceHistoryRecord[];
  lastImportReport?: ImportReport;
}

class StoreService {
  private state: StoreState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): StoreState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure 84 products are present or merged
        if (parsed.products && parsed.products.length >= 84) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return this.createDefaultState();
  }

  private createDefaultState(): StoreState {
    const products = JSON.parse(JSON.stringify(RAW_84_PRODUCT_ENTRIES));
    
    // Seed initial inventory codes for ready-to-sell products
    const initialInventory: InventoryItem[] = [];
    products.forEach((p: ProductPlanEntry) => {
      if (p.deliveryType === 'AUTOMATIC_CODE' && p.stock > 0 && p.isActive) {
        for (let i = 1; i <= Math.min(p.stock, 5); i++) {
          initialInventory.push({
            id: `inv-${p.id}-${i}`,
            productId: p.id,
            content: `${p.productName.toUpperCase().replace(/\s+/g, '')}-KEY-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            status: 'AVAILABLE',
            createdAt: new Date().toISOString()
          });
        }
      }
    });

    return {
      settings: INITIAL_STORE_SETTINGS,
      categories: CATALOG_CATEGORIES,
      products,
      inventory: initialInventory,
      users: INITIAL_USERS,
      orders: [],
      ledger: [
        {
          id: 'tx-seed-1',
          userId: 'usr-siam',
          telegramId: 589218491,
          type: 'DEPOSIT_CREDIT',
          amount: 2500,
          currency: 'BDT',
          balanceBefore: 0,
          balanceAfter: 2500,
          referenceId: 'DEP-SEED-01',
          reason: 'Initial Seed Balance',
          performedBy: 'SYSTEM',
          createdAt: '2026-09-15T08:00:00Z'
        }
      ],
      deposits: [],
      tickets: [],
      priceHistory: []
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('telestore-state-change'));
  }

  // --- SAFE MIGRATION & REPEATABLE IMPORT ---
  public importCatalog84(strategy: 'UPSERT' | 'INSERT_ONLY' = 'UPSERT'): ImportReport {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const details: ImportReport['details'] = [];

    RAW_84_PRODUCT_ENTRIES.forEach(seedItem => {
      try {
        const existingIdx = this.state.products.findIndex(p => p.id === seedItem.id);
        if (existingIdx >= 0) {
          if (strategy === 'UPSERT') {
            const existing = this.state.products[existingIdx];
            // Preserve any custom BDT price if admin already set one
            const preservedSellingPriceBdt = existing.sellingPriceBdt !== null ? existing.sellingPriceBdt : seedItem.sellingPriceBdt;
            const preservedStock = existing.stock;
            
            this.state.products[existingIdx] = {
              ...seedItem,
              sellingPriceBdt: preservedSellingPriceBdt,
              stock: preservedStock,
              updatedAt: new Date().toISOString()
            };
            updated++;
            details.push({
              productId: seedItem.id,
              productName: seedItem.productName,
              plan: seedItem.duration,
              action: 'UPDATED'
            });
          } else {
            skipped++;
            details.push({
              productId: seedItem.id,
              productName: seedItem.productName,
              plan: seedItem.duration,
              action: 'SKIPPED',
              reason: 'Already exists in database'
            });
          }
        } else {
          this.state.products.push({ ...seedItem });
          inserted++;
          details.push({
            productId: seedItem.id,
            productName: seedItem.productName,
            plan: seedItem.duration,
            action: 'INSERTED'
          });
        }
      } catch (err: any) {
        failed++;
        details.push({
          productId: seedItem.id,
          productName: seedItem.productName,
          plan: seedItem.duration,
          action: 'FAILED',
          reason: err.message
        });
      }
    });

    const report: ImportReport = {
      timestamp: new Date().toISOString(),
      totalEntries: RAW_84_PRODUCT_ENTRIES.length,
      inserted,
      updated,
      skipped,
      failed,
      details
    };

    this.state.lastImportReport = report;
    this.saveState();
    return report;
  }

  // --- GETTERS ---
  public getSettings(): StoreSettings {
    return this.state.settings;
  }

  public getCategories(): Category[] {
    return this.state.categories.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getAllProducts(): ProductPlanEntry[] {
    return this.state.products;
  }

  public getProductsByCategory(categoryId: string): ProductPlanEntry[] {
    return this.state.products.filter(p => p.category === categoryId);
  }

  public getProductById(id: string): ProductPlanEntry | undefined {
    return this.state.products.find(p => p.id === id);
  }

  // Grouped products for cleaner browsing in Telegram bot
  public getDistinctProductNames(categoryId: string): { productName: string; planCount: number; minPriceBdt: number | null; imageUrl: string }[] {
    const prods = this.getProductsByCategory(categoryId);
    const map = new Map<string, { count: number; minPrice: number | null; imageUrl: string }>();

    prods.forEach(p => {
      const current = map.get(p.productName);
      if (!current) {
        map.set(p.productName, {
          count: 1,
          minPrice: p.sellingPriceBdt,
          imageUrl: p.imageUrl
        });
      } else {
        current.count += 1;
        if (p.sellingPriceBdt !== null) {
          if (current.minPrice === null || p.sellingPriceBdt < current.minPrice) {
            current.minPrice = p.sellingPriceBdt;
          }
        }
      }
    });

    return Array.from(map.entries()).map(([productName, data]) => ({
      productName,
      planCount: data.count,
      minPriceBdt: data.minPrice,
      imageUrl: data.imageUrl
    }));
  }

  public getPlansForProduct(productName: string): ProductPlanEntry[] {
    return this.state.products.filter(p => p.productName.toLowerCase() === productName.toLowerCase());
  }

  public getUsers(): TelegramUser[] {
    return this.state.users;
  }

  public getUser(telegramId: number): TelegramUser | undefined {
    return this.state.users.find(u => u.telegramId === telegramId);
  }

  public getOrders(telegramId?: number): Order[] {
    if (telegramId) {
      return this.state.orders.filter(o => o.telegramId === telegramId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return [...this.state.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getLedger(telegramId?: number): LedgerTransaction[] {
    if (telegramId) {
      return this.state.ledger.filter(l => l.telegramId === telegramId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return [...this.state.ledger].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getDeposits(telegramId?: number): DepositRequest[] {
    if (telegramId) {
      return this.state.deposits.filter(d => d.telegramId === telegramId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return [...this.state.deposits].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getPriceHistory(productId?: string): PriceHistoryRecord[] {
    if (productId) {
      return this.state.priceHistory.filter(h => h.productId === productId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    return [...this.state.priceHistory].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  public getLastImportReport(): ImportReport | undefined {
    return this.state.lastImportReport;
  }

  // --- CATALOG MANAGEMENT & PRICE UPDATES ---
  public updateProduct(updated: ProductPlanEntry, adminEmail: string, reason?: string): boolean {
    const idx = this.state.products.findIndex(p => p.id === updated.id);
    if (idx < 0) return false;

    const current = this.state.products[idx];

    // Check if price changed to record in price_history
    if (current.sellingPriceBdt !== updated.sellingPriceBdt || current.sourcePriceInr !== updated.sourcePriceInr) {
      const historyRecord: PriceHistoryRecord = {
        id: `ph-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: updated.id,
        productName: updated.productName,
        planName: updated.duration,
        oldPriceBdt: current.sellingPriceBdt,
        newPriceBdt: updated.sellingPriceBdt,
        oldPriceInr: current.sourcePriceInr,
        newPriceInr: updated.sourcePriceInr,
        changedBy: adminEmail,
        reason: reason || 'Manual Admin Price Adjustment',
        timestamp: new Date().toISOString()
      };
      this.state.priceHistory.push(historyRecord);
    }

    this.state.products[idx] = {
      ...updated,
      updatedAt: new Date().toISOString()
    };
    this.saveState();
    return true;
  }

  public bulkUpdatePrices(params: {
    category?: string;
    productIds?: string[];
    action: 'AUTO_CALC_BDT' | 'SET_BDT_FIXED' | 'ACTIVATE_ALL' | 'DEACTIVATE_ALL';
    fixedBdtPrice?: number;
    exchangeRateMultiplier?: number;
    adminEmail: string;
  }): number {
    let affected = 0;
    const rate = params.exchangeRateMultiplier || this.state.settings.inrToBdtExchangeRate;

    this.state.products.forEach(p => {
      // Check filters
      if (params.category && p.category !== params.category) return;
      if (params.productIds && params.productIds.length > 0 && !params.productIds.includes(p.id)) return;

      if (params.action === 'AUTO_CALC_BDT') {
        if (p.sourcePriceInr !== null) {
          const oldBdt = p.sellingPriceBdt;
          const newBdt = Math.round(p.sourcePriceInr * rate);
          p.sellingPriceBdt = newBdt;
          p.isActive = true;
          p.updatedAt = new Date().toISOString();
          
          this.state.priceHistory.push({
            id: `ph-bulk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: p.id,
            productName: p.productName,
            planName: p.duration,
            oldPriceBdt: oldBdt,
            newPriceBdt: newBdt,
            oldPriceInr: p.sourcePriceInr,
            newPriceInr: p.sourcePriceInr,
            changedBy: params.adminEmail,
            reason: `Bulk Auto-Calc BDT (Exchange Rate x${rate})`,
            timestamp: new Date().toISOString()
          });
          affected++;
        }
      } else if (params.action === 'SET_BDT_FIXED') {
        if (params.fixedBdtPrice !== undefined && params.fixedBdtPrice > 0) {
          const oldBdt = p.sellingPriceBdt;
          p.sellingPriceBdt = params.fixedBdtPrice;
          p.isActive = true;
          p.updatedAt = new Date().toISOString();

          this.state.priceHistory.push({
            id: `ph-bulk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: p.id,
            productName: p.productName,
            planName: p.duration,
            oldPriceBdt: oldBdt,
            newPriceBdt: params.fixedBdtPrice,
            oldPriceInr: p.sourcePriceInr,
            newPriceInr: p.sourcePriceInr,
            changedBy: params.adminEmail,
            reason: `Bulk Set Fixed BDT to ${params.fixedBdtPrice}`,
            timestamp: new Date().toISOString()
          });
          affected++;
        }
      } else if (params.action === 'ACTIVATE_ALL') {
        // Only activate if not Claude Pro out-of-stock or price unavailable
        if (!p.isPriceUnavailable && p.sellingPriceBdt !== null) {
          p.isActive = true;
          p.updatedAt = new Date().toISOString();
          affected++;
        }
      } else if (params.action === 'DEACTIVATE_ALL') {
        p.isActive = false;
        p.updatedAt = new Date().toISOString();
        affected++;
      }
    });

    this.saveState();
    return affected;
  }

  // --- USER REGISTRATION & WALLET ---
  public registerOrGetUser(
    telegramId: number, 
    firstName: string, 
    lastName?: string, 
    username?: string, 
    referralCode?: string
  ): TelegramUser {
    let user = this.state.users.find(u => u.telegramId === telegramId);
    if (!user) {
      let validReferrerCode: string | undefined = undefined;
      if (referralCode) {
        const cleanRef = referralCode.trim().toUpperCase();
        const referrer = this.state.users.find(u => u.referralCode === cleanRef);
        if (referrer && referrer.telegramId !== telegramId) {
          validReferrerCode = cleanRef;
          referrer.referralCount += 1;
        }
      }

      user = {
        id: `usr-${Date.now()}`,
        telegramId,
        username,
        firstName,
        lastName,
        balance: 0.0,
        referralCode: `REF-${telegramId.toString().slice(-4)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        referredBy: validReferrerCode,
        referralEarnings: 0.0,
        referralCount: 0,
        language: 'en',
        createdAt: new Date().toISOString()
      };
      this.state.users.push(user);
      this.saveState();
    } else {
      user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (username !== undefined) user.username = username;
      this.saveState();
    }
    return user;
  }

  public setUserLanguage(telegramId: number, language: 'en' | 'bn'): void {
    const user = this.getUser(telegramId);
    if (user) {
      user.language = language;
      this.saveState();
    }
  }

  // --- DOUBLE ENTRY LEDGER ---
  public executeLedgerTransaction(params: {
    telegramId: number;
    type: LedgerTransaction['type'];
    amount: number;
    referenceId: string;
    reason: string;
    performedBy?: string;
  }): { success: boolean; transaction?: LedgerTransaction; error?: string } {
    const user = this.getUser(params.telegramId);
    if (!user) return { success: false, error: 'User not found' };

    const balanceBefore = Number(user.balance.toFixed(2));
    const delta = Number(params.amount.toFixed(2));
    const balanceAfter = Number((balanceBefore + delta).toFixed(2));

    if (delta < 0 && balanceAfter < 0) {
      return { 
        success: false, 
        error: `Insufficient balance. Required: ${Math.abs(delta).toFixed(2)} ${this.state.settings.currency}, Available: ${balanceBefore.toFixed(2)} ${this.state.settings.currency}` 
      };
    }

    user.balance = balanceAfter;

    const transaction: LedgerTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      userId: user.id,
      telegramId: user.telegramId,
      type: params.type,
      amount: delta,
      currency: this.state.settings.currency,
      balanceBefore,
      balanceAfter,
      referenceId: params.referenceId,
      reason: params.reason,
      performedBy: params.performedBy || 'SYSTEM',
      createdAt: new Date().toISOString()
    };

    this.state.ledger.push(transaction);
    this.saveState();
    return { success: true, transaction };
  }

  // --- CHECKOUT WITH CURRENCY & PLAN RULES ---
  public checkoutProductPlan(params: {
    telegramId: number;
    productId: string;
    quantity: number;
    notes?: string;
  }): { success: boolean; order?: Order; error?: string } {
    const user = this.getUser(params.telegramId);
    if (!user) return { success: false, error: 'User not registered.' };

    const product = this.getProductById(params.productId);
    if (!product) return { success: false, error: 'Product plan not found in database.' };

    // Price rules enforcement
    if (product.isPriceUnavailable || product.sourcePriceInr === null) {
      return { success: false, error: 'Price for this product is currently unavailable from supplier.' };
    }

    if (product.sellingPriceBdt === null || product.sellingPriceBdt <= 0) {
      return { success: false, error: 'BDT selling price has not yet been set by the store admin. Purchasing is temporarily disabled.' };
    }

    if (product.isOutOfStock || product.stock <= 0) {
      return { success: false, error: `${product.productName} (${product.duration}) is currently OUT OF STOCK. Please check back later!` };
    }

    if (!product.isActive) {
      return { success: false, error: 'This product plan is currently inactive.' };
    }

    const totalCost = product.sellingPriceBdt * params.quantity;

    if (user.balance < totalCost) {
      return { 
        success: false, 
        error: `Insufficient balance! Total required: ${totalCost} BDT. Your balance: ${user.balance.toFixed(2)} BDT. Please deposit funds.` 
      };
    }

    // Allocate inventory
    let deliveryContent = '';
    const nowIso = new Date().toISOString();
    const orderId = `ord-${Date.now()}`;
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    if (product.deliveryType === 'AUTOMATIC_CODE') {
      const availableCodes = this.state.inventory.filter(i => i.productId === product.id && i.status === 'AVAILABLE');
      if (availableCodes.length >= params.quantity) {
        const allocated = availableCodes.slice(0, params.quantity);
        allocated.forEach(c => {
          c.status = 'SOLD';
          c.allocatedOrderId = orderId;
        });
        product.stock = Math.max(0, product.stock - params.quantity);
        deliveryContent = `🔑 *Delivered Keys (${allocated.length}x):*\n` + allocated.map((c, idx) => `${idx + 1}. \`${c.content}\``).join('\n') + `\n\n📌 Plan: *${product.duration}* | Instant Activation.`;
      } else {
        // Fallback generated delivery key
        product.stock = Math.max(0, product.stock - params.quantity);
        deliveryContent = `🔑 *Delivered License (${product.duration}):*\n\`${product.productName.toUpperCase()}-VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}\`\n\n📌 Valid for: ${product.duration}`;
      }
    } else {
      product.stock = Math.max(0, product.stock - params.quantity);
      deliveryContent = `⏳ *Manual Order Queued for Staff*\n\nYour ${product.productName} (${product.duration}) order is being activated on our partner portal. Delivery takes 5-30 mins!`;
    }

    // Deduct via ledger
    const ledgerRes = this.executeLedgerTransaction({
      telegramId: user.telegramId,
      type: 'PRODUCT_PURCHASE',
      amount: -totalCost,
      referenceId: orderNumber,
      reason: `Purchased ${product.productName} (${product.duration}) x${params.quantity}`
    });

    if (!ledgerRes.success) return { success: false, error: ledgerRes.error };

    const order: Order = {
      id: orderId,
      orderNumber,
      userId: user.id,
      telegramId: user.telegramId,
      items: [
        {
          productId: product.id,
          productName: product.productName,
          planName: product.planName,
          duration: product.duration,
          quantity: params.quantity,
          unitPriceBdt: product.sellingPriceBdt,
          totalPriceBdt: totalCost
        }
      ],
      totalAmount: totalCost,
      currency: 'BDT',
      status: product.deliveryType === 'AUTOMATIC_CODE' ? 'COMPLETED' : 'PROCESSING',
      deliveryType: product.deliveryType,
      deliveryData: deliveryContent,
      fulfillmentNotes: params.notes,
      fulfilledBy: product.deliveryType === 'AUTOMATIC_CODE' ? 'SYSTEM_BOT' : undefined,
      fulfilledAt: product.deliveryType === 'AUTOMATIC_CODE' ? nowIso : undefined,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.state.orders.push(order);

    // Referral commission 5%
    if (user.referredBy) {
      const referrer = this.state.users.find(u => u.referralCode === user.referredBy);
      if (referrer && referrer.telegramId !== user.telegramId) {
        const commRate = this.state.settings.referralCommissionPercent / 100;
        const commAmount = Number((totalCost * commRate).toFixed(2));
        if (commAmount > 0) {
          referrer.referralEarnings = Number((referrer.referralEarnings + commAmount).toFixed(2));
          this.executeLedgerTransaction({
            telegramId: referrer.telegramId,
            type: 'REFERRAL_COMMISSION',
            amount: commAmount,
            referenceId: orderNumber,
            reason: `Referral commission (${this.state.settings.referralCommissionPercent}%) from ${user.firstName}'s order ${orderNumber}`
          });
        }
      }
    }

    this.saveState();
    return { success: true, order };
  }

  // --- DEPOSITS ---
  public createDepositRequest(params: {
    telegramId: number;
    method: PaymentMethod;
    amount: number;
    transactionHash?: string;
  }): { success: boolean; deposit?: DepositRequest; error?: string } {
    const user = this.getUser(params.telegramId);
    if (!user) return { success: false, error: 'User not registered' };

    const deposit: DepositRequest = {
      id: `dep-${Date.now()}`,
      reference: `DEP-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      telegramId: user.telegramId,
      amount: params.amount,
      currency: 'BDT',
      method: params.method,
      status: 'PENDING',
      transactionHash: params.transactionHash?.trim(),
      createdAt: new Date().toISOString()
    };

    this.state.deposits.push(deposit);
    this.saveState();
    return { success: true, deposit };
  }

  public approveDeposit(depositId: string, adminEmail: string): boolean {
    const dep = this.state.deposits.find(d => d.id === depositId);
    if (!dep || dep.status !== 'PENDING') return false;

    dep.status = 'APPROVED';
    dep.processedBy = adminEmail;

    this.executeLedgerTransaction({
      telegramId: dep.telegramId,
      type: 'DEPOSIT_CREDIT',
      amount: dep.amount,
      referenceId: dep.reference,
      reason: `Deposit approved via ${dep.method} (TxID: ${dep.transactionHash || 'N/A'})`,
      performedBy: adminEmail
    });

    this.saveState();
    return true;
  }

  public rejectDeposit(depositId: string, adminEmail: string): boolean {
    const dep = this.state.deposits.find(d => d.id === depositId);
    if (!dep || dep.status !== 'PENDING') return false;

    dep.status = 'REJECTED';
    dep.processedBy = adminEmail;
    this.saveState();
    return true;
  }

  public updateSettings(newSettings: StoreSettings): void {
    this.state.settings = newSettings;
    this.saveState();
  }
}

export const storeService = new StoreService();
