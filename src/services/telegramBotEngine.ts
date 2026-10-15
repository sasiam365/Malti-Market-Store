import { storeService } from './storeService';
import { TelegramUser, PaymentMethod, ProductPlanEntry } from '../types';

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface BotMessage {
  id: string;
  sender: 'BOT' | 'USER';
  text: string;
  photoUrl?: string;
  replyMarkup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
  timestamp: string;
}

export class TelegramBotEngine {
  private activeUserId: number;

  constructor(activeUserId: number = 589218491) {
    this.activeUserId = activeUserId;
  }

  public setActiveUser(telegramId: number) {
    this.activeUserId = telegramId;
  }

  public getActiveUser(): TelegramUser {
    let user = storeService.getUser(this.activeUserId);
    if (!user) {
      user = storeService.registerOrGetUser(this.activeUserId, 'Siam', 'Ahmed', 'siam_developer');
    }
    return user;
  }

  // --- /start ---
  public handleStart(referralCode?: string): BotMessage {
    const user = this.getActiveUser();
    const settings = storeService.getSettings();
    const isBn = user.language === 'bn';

    const text = isBn
      ? `👋 *টেলি-স্টোর প্রো-তে স্বাগতম!*\n\n` +
        `৮৪টি ডিজিটাল পণ্য ও সাবস্ক্রিপশন প্ল্যানের বিশ্বস্ত হাব। ওটিটি, এআই, ভিডিও এডিটিং, এবং ডেভেলপার টুলসের অটোমেটিক ইনস্ট্যান্ট ডেলিভারি!\n\n` +
        `👤 *আপনার প্রোফাইল:*\n` +
        `• আইডি: \`${user.telegramId}\`\n` +
        `• নাম: ${user.firstName} ${user.lastName || ''}\n` +
        `• ব্যালেন্স: *${user.balance.toFixed(2)} ${settings.currency}*\n` +
        `• রেফারেল আয়: ${user.referralEarnings.toFixed(2)} ${settings.currency}\n\n` +
        `🔻 নিচের মেন্যু থেকে অপশন বেছে নিন:`
      : `👋 *Welcome to TeleStore Pro!*\n\n` +
        `Your premium destination for 84 curated digital products, AI tools, OTT subscriptions, and developer platforms with instant delivery.\n\n` +
        `👤 *Your Account Profile:*\n` +
        `• *Telegram ID:* \`${user.telegramId}\`\n` +
        `• *Account Name:* ${user.firstName} ${user.lastName || ''}\n` +
        `• *Wallet Balance:* *${user.balance.toFixed(2)} ${settings.currency}*\n` +
        `• *Referral Earnings:* ${user.referralEarnings.toFixed(2)} ${settings.currency}\n\n` +
        `🔻 Choose an option from the menu below:`;

    return {
      id: `msg-${Date.now()}`,
      sender: 'BOT',
      text,
      replyMarkup: {
        inline_keyboard: [
          [
            { text: isBn ? '🛍️ পণ্য ক্যাটালগ (৮৪টি পণ্য)' : '🛍️ Products Catalog (84 Items)', callback_data: 'menu:products' },
            { text: isBn ? '💳 ওয়ালেট ডিপোজিট' : '💳 Deposit Funds', callback_data: 'menu:deposit' }
          ],
          [
            { text: isBn ? '🎁 রেফারেল প্রোগ্রাম' : '🎁 Referrals', callback_data: 'menu:referrals' },
            { text: isBn ? '📦 আমার অর্ডারসমূহ' : '📦 My Orders', callback_data: 'menu:orders' }
          ],
          [
            { text: isBn ? '💰 ওয়ালেট বিবরণী' : '💰 Wallet Balance', callback_data: 'menu:wallet' },
            { text: isBn ? '📜 লেনদেন ইতিহাস' : '📜 Transactions', callback_data: 'menu:transactions' }
          ],
          [
            { text: isBn ? '💬 হেল্প ও সাপোর্ট' : '💬 Support Desk', callback_data: 'menu:support' },
            { text: isBn ? '🌐 Switch to English 🇺🇸' : '🌐 বাংলায় দেখুন 🇧🇩', callback_data: 'toggle:lang' }
          ]
        ]
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // --- CATEGORIES (2-Column Grid) ---
  public handleCategories(): BotMessage {
    const user = this.getActiveUser();
    const categories = storeService.getCategories().filter(c => c.isActive);
    const isBn = user.language === 'bn';

    const text = isBn
      ? `🛍️ *প্রোডাক্ট ক্যাটাগরি বেছে নিন:*\n\n৮৪টি প্রিমিয়াম ডিজিটাল পণ্যের তালিকা নিচে রয়েছে:`
      : `🛍️ *Browse Product Categories:*\n\nExplore our catalog of 84 verified digital products:`;

    const keyboard: InlineKeyboardButton[][] = [];
    for (let i = 0; i < categories.length; i += 2) {
      const row: InlineKeyboardButton[] = [];
      const cat1 = categories[i];
      const count1 = storeService.getProductsByCategory(cat1.id).length;
      row.push({
        text: `${cat1.icon} ${cat1.name} (${count1})`,
        callback_data: `cat:${cat1.id}`
      });

      if (i + 1 < categories.length) {
        const cat2 = categories[i + 1];
        const count2 = storeService.getProductsByCategory(cat2.id).length;
        row.push({
          text: `${cat2.icon} ${cat2.name} (${count2})`,
          callback_data: `cat:${cat2.id}`
        });
      }
      keyboard.push(row);
    }

    keyboard.push([{ text: isBn ? '🔙 প্রধান মেনু' : '🔙 Main Menu', callback_data: 'menu:main' }]);

    return {
      id: `msg-${Date.now()}`,
      sender: 'BOT',
      text,
      replyMarkup: { inline_keyboard: keyboard },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // --- PRODUCT LIST (Grouped by product name with plan counts) ---
  public handleCategoryProducts(categoryId: string, page: number = 0): BotMessage {
    const category = storeService.getCategories().find(c => c.id === categoryId);
    const distinctProducts = storeService.getDistinctProductNames(categoryId);
    const pageSize = 8;
    const totalPages = Math.ceil(distinctProducts.length / pageSize) || 1;
    const pagedItems = distinctProducts.slice(page * pageSize, (page + 1) * pageSize);

    const text = `📂 *Category: ${category?.name || 'Products'}*\n\n` +
      `Showing ${distinctProducts.length} unique products (Page ${page + 1}/${totalPages}):\n` +
      `_Select a product to view available plans & durations:_`;

    const keyboard: InlineKeyboardButton[][] = [];

    pagedItems.forEach(item => {
      const priceText = item.minPriceBdt !== null ? `from ${item.minPriceBdt} BDT` : `[Price Unset]`;
      const planBadge = item.planCount > 1 ? `(${item.planCount} plans)` : `(1 plan)`;
      keyboard.push([
        {
          text: `${item.productName} ${planBadge} — ${priceText}`,
          callback_data: `prodname:${encodeURIComponent(item.productName)}`
        }
      ]);
    });

    // Pagination row
    const navRow: InlineKeyboardButton[] = [];
    if (page > 0) {
      navRow.push({ text: '⬅️ Prev', callback_data: `catpage:${categoryId}:${page - 1}` });
    }
    if (page < totalPages - 1) {
      navRow.push({ text: 'Next ➡️', callback_data: `catpage:${categoryId}:${page + 1}` });
    }
    if (navRow.length > 0) keyboard.push(navRow);

    keyboard.push([
      { text: '🔙 All Categories', callback_data: 'menu:products' },
      { text: '🏠 Home', callback_data: 'menu:main' }
    ]);

    return {
      id: `msg-${Date.now()}`,
      sender: 'BOT',
      text,
      replyMarkup: { inline_keyboard: keyboard },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // --- PRODUCT DETAILS & PLAN SELECTION ---
  public handleProductPlansSelection(productName: string): BotMessage {
    const plans = storeService.getPlansForProduct(productName);
    if (plans.length === 0) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'BOT',
        text: `❌ Product "${productName}" not found.`,
        replyMarkup: { inline_keyboard: [[{ text: '🔙 Catalog', callback_data: 'menu:products' }]] },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    const first = plans[0];
    let text = `📦 *${first.productName}*\n\n` +
      `📂 *Category:* ${first.categoryName}\n` +
      `📝 *Description:* ${first.description}\n\n` +
      `⚡ *Available Plans & Durations:* (${plans.length} options)\n\n`;

    const keyboard: InlineKeyboardButton[][] = [];

    plans.forEach((plan, idx) => {
      const isAvailable = !plan.isPriceUnavailable && !plan.isOutOfStock && plan.sellingPriceBdt !== null && plan.isActive;
      
      let priceLabel = '';
      if (plan.isOutOfStock) {
        priceLabel = '🔴 OUT OF STOCK';
      } else if (plan.isPriceUnavailable) {
        priceLabel = '⚠️ Price Unavailable';
      } else if (plan.sellingPriceBdt === null) {
        priceLabel = '⏳ BDT Price Unset (Admin)';
      } else {
        priceLabel = `✅ ${plan.sellingPriceBdt} BDT (₹${plan.sourcePriceInr})`;
      }

      text += `${idx + 1}. *${plan.duration}* (${plan.planName})\n` +
              `   ↳ Status: ${priceLabel}\n` +
              `   ↳ Delivery: ${plan.deliveryType === 'AUTOMATIC_CODE' ? 'Instant Code' : 'Manual Support'}\n\n`;

      keyboard.push([
        {
          text: `${plan.duration} — ${plan.sellingPriceBdt !== null ? `${plan.sellingPriceBdt} BDT` : 'Unavailable'} ${!isAvailable ? '🔒' : '🛒'}`,
          callback_data: `plan:${plan.id}`
        }
      ]);
    });

    keyboard.push([
      { text: `🔙 Back to ${first.categoryName}`, callback_data: `cat:${first.category}` },
      { text: '🏠 Home', callback_data: 'menu:main' }
    ]);

    return {
      id: `msg-${Date.now()}`,
      sender: 'BOT',
      text,
      photoUrl: first.imageUrl,
      replyMarkup: { inline_keyboard: keyboard },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // --- PLAN DETAIL & QUANTITY SELECTION ---
  public handlePlanDetails(planId: string, selectedQty: number = 1): BotMessage {
    const plan = storeService.getProductById(planId);
    const user = this.getActiveUser();

    if (!plan) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'BOT',
        text: '❌ Product plan not found.',
        replyMarkup: { inline_keyboard: [[{ text: '🔙 Catalog', callback_data: 'menu:products' }]] },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    const isPurchasable = !plan.isPriceUnavailable && !plan.isOutOfStock && plan.sellingPriceBdt !== null && plan.isActive;
    const totalCost = (plan.sellingPriceBdt || 0) * selectedQty;
    const hasBalance = user.balance >= totalCost;

    let text = `📦 *${plan.productName} — ${plan.duration}*\n\n` +
      `📋 *Plan Name:* ${plan.planName}\n` +
      `⏱️ *Duration:* ${plan.duration}\n` +
      `🇮🇳 *Source Price:* ${plan.sourcePriceInr !== null ? `₹${plan.sourcePriceInr} INR` : 'Unavailable'}\n` +
      `🇧🇩 *Approved Selling Price:* ${plan.sellingPriceBdt !== null ? `*${plan.sellingPriceBdt} BDT*` : 'Not Set by Admin'}\n` +
      `📊 *Available Stock:* ${plan.stock > 0 ? `${plan.stock} units` : 'Out of Stock'}\n` +
      `🚀 *Delivery Mode:* ${plan.deliveryType === 'AUTOMATIC_CODE' ? '⚡ Instant Auto Code' : '🛠️ Manual Staff'}\n\n`;

    if (plan.isOutOfStock) {
      text += `⚠️ *Notice:* This product (e.g. Claude Pro) is currently *OUT OF STOCK* until the store admin verifies supplier availability.\n`;
    } else if (plan.isPriceUnavailable) {
      text += `⚠️ *Notice:* Source price is currently unavailable from distributor.\n`;
    } else if (plan.sellingPriceBdt === null) {
      text += `⚠️ *Notice:* The admin has not yet configured the BDT selling price for this plan. Purchasing is disabled.\n`;
    } else {
      text += `🔢 *Selected Quantity:* *${selectedQty}*\n` +
              `💰 *Total Amount:* *${totalCost} BDT*\n` +
              `💳 *Your Balance:* ${user.balance.toFixed(2)} BDT\n\n`;
      if (!hasBalance) {
        text += `⚠️ *Insufficient Balance!* You need ${totalCost - user.balance} BDT more.\n`;
      }
    }

    const keyboard: InlineKeyboardButton[][] = [];

    // Quantity selectors if purchasable
    if (isPurchasable) {
      const qtyRow = [1, 2, 3, 5, 10].map(q => ({
        text: selectedQty === q ? `• ${q} •` : `${q}`,
        callback_data: `planqty:${plan.id}:${q}`
      }));
      keyboard.push(qtyRow);

      if (hasBalance && plan.stock >= selectedQty) {
        keyboard.push([
          {
            text: `✅ Buy Now — ${totalCost} BDT`,
            callback_data: `order_confirm:${plan.id}:${selectedQty}`
          }
        ]);
      } else if (!hasBalance) {
        keyboard.push([
          { text: '💳 Deposit Funds to Wallet', callback_data: 'menu:deposit' }
        ]);
      }
    }

    keyboard.push([
      { text: `🔙 All ${plan.productName} Plans`, callback_data: `prodname:${encodeURIComponent(plan.productName)}` },
      { text: '🏠 Home', callback_data: 'menu:main' }
    ]);

    return {
      id: `msg-${Date.now()}`,
      sender: 'BOT',
      text,
      photoUrl: plan.imageUrl,
      replyMarkup: { inline_keyboard: keyboard },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // --- ORDER CHECKOUT CONFIRMATION ---
  public handleOrderCheckout(planId: string, quantity: number): BotMessage {
    const user = this.getActiveUser();
    const result = storeService.checkoutProductPlan({
      telegramId: user.telegramId,
      productId: planId,
      quantity
    });

    if (!result.success || !result.order) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'BOT',
        text: `❌ *Checkout Failed*\n\n${result.error}`,
        replyMarkup: {
          inline_keyboard: [
            [{ text: '💳 Deposit Funds', callback_data: 'menu:deposit' }],
            [{ text: '🔙 Back to Catalog', callback_data: 'menu:products' }]
          ]
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    const order = result.order;
    const item = order.items[0];

    const text = `🎉 *Order Placed Successfully!*\n\n` +
      `🧾 *Order ID:* \`${order.orderNumber}\`\n` +
      `📦 *Item:* ${item.productName} (${item.duration})\n` +
      `🔢 *Quantity:* ${item.quantity}\n` +
      `💵 *Total Deducted:* *${order.totalAmount} BDT*\n` +
      `💳 *Remaining Balance:* *${storeService.getUser(user.telegramId)?.balance.toFixed(2)} BDT*\n\n` +
      `${order.deliveryData}\n\n` +
      `_Saved to your immutable double-entry ledger. View anytime with /orders._`;

    return {
      id: `msg-${Date.now()}`,
      sender: 'BOT',
      text,
      replyMarkup: {
        inline_keyboard: [
          [{ text: '📦 View My Orders', callback_data: 'menu:orders' }],
          [{ text: '🛍️ Browse More Products', callback_data: 'menu:products' }]
        ]
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // --- WALLET & DEPOSIT ---
  public handleWallet(): BotMessage {
    const user = this.getActiveUser();
    const settings = storeService.getSettings();

    const text = `💰 *Your Digital Wallet Balance:*\n\n` +
      `• *Current Balance:* *${user.balance.toFixed(2)} ${settings.currency}*\n` +
      `• *Referral Affiliate Balance:* ${user.referralEarnings.toFixed(2)} ${settings.currency}\n` +
      `• *Telegram ID:* \`${user.telegramId}\`\n\n` +
      `All transactions use strict double-entry ledger auditing.`;

    return {
      id: `msg-${Date.now()}`,
      sender: 'BOT',
      text,
      replyMarkup: {
        inline_keyboard: [
          [
            { text: '➕ Deposit Funds', callback_data: 'menu:deposit' },
            { text: '📜 Transactions', callback_data: 'menu:transactions' }
          ],
          [{ text: '🔙 Main Menu', callback_data: 'menu:main' }]
        ]
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  public handleTransactions(): BotMessage {
    const user = this.getActiveUser();
    const ledger = storeService.getLedger(user.telegramId);

    let text = `📜 *Transaction History (User #${user.telegramId}):*\n\n`;
    if (ledger.length === 0) {
      text += `No transactions found.`;
    } else {
      ledger.slice(0, 5).forEach((tx, idx) => {
        const sign = tx.amount >= 0 ? '+' : '';
        const emoji = tx.amount >= 0 ? '🟢' : '🔴';
        text += `${idx + 1}. ${emoji} *${sign}${tx.amount.toFixed(2)} ${tx.currency}*\n` +
                `   ↳ ${tx.reason}\n` +
                `   ↳ Balance After: ${tx.balanceAfter.toFixed(2)} BDT\n\n`;
      });
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'BOT',
      text,
      replyMarkup: {
        inline_keyboard: [
          [{ text: '💳 Deposit Funds', callback_data: 'menu:deposit' }],
          [{ text: '🔙 Wallet', callback_data: 'menu:wallet' }]
        ]
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  public handleDepositMenu(): BotMessage {
    const settings = storeService.getSettings();
    const text = `💳 *Deposit Funds into Wallet:*\n\n` +
      `Select your preferred payment channel:\n` +
      `• Min Deposit: ${settings.minDepositAmount} BDT\n` +
      `• Max Deposit: ${settings.maxDepositAmount} BDT\n` +
      `Instant credit upon verification.`;

    return {
      id: `msg-${Date.now()}`,
      sender: 'BOT',
      text,
      replyMarkup: {
        inline_keyboard: [
          [
            { text: '🌸 bKash (বিকাশ)', callback_data: 'dep:BKASH' },
            { text: '🟠 Nagad (নগদ)', callback_data: 'dep:NAGAD' }
          ],
          [
            { text: '🚀 Rocket (রকেট)', callback_data: 'dep:ROCKET' },
            { text: '⭐ Telegram Stars', callback_data: 'dep:TELEGRAM_STARS' }
          ],
          [
            { text: '₮ USDT (TRC20)', callback_data: 'dep:USDT_TRC20' },
            { text: '💳 Cards / Online', callback_data: 'dep:CARD_GATEWAY' }
          ],
          [{ text: '🔙 Main Menu', callback_data: 'menu:main' }]
        ]
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  public handleOrders(): BotMessage {
    const user = this.getActiveUser();
    const orders = storeService.getOrders(user.telegramId);

    let text = `📦 *Your Order History:*\n\n`;
    if (orders.length === 0) {
      text += `You have not placed any orders yet. Tap '🛍️ Products' to explore our 84 digital goods!`;
    } else {
      orders.slice(0, 5).forEach((o, idx) => {
        const item = o.items[0];
        text += `${idx + 1}. *${o.orderNumber}* (${o.status})\n` +
                `   ↳ ${item?.productName} (${item?.duration}) x${item?.quantity}\n` +
                `   ↳ Total: ${o.totalAmount} BDT | ${new Date(o.createdAt).toLocaleDateString()}\n\n`;
      });
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'BOT',
      text,
      replyMarkup: {
        inline_keyboard: [
          [{ text: '🛍️ Browse Products', callback_data: 'menu:products' }],
          [{ text: '🔙 Main Menu', callback_data: 'menu:main' }]
        ]
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  public handleReferrals(): BotMessage {
    const user = this.getActiveUser();
    const settings = storeService.getSettings();
    const link = `https://t.me/${settings.botUsername.replace('@', '')}?start=${user.referralCode}`;

    const text = `🎁 *Affiliate Referral Program:*\n\n` +
      `Earn *${settings.referralCommissionPercent}% instant commission* on every digital product your invited friends buy!\n\n` +
      `🔗 *Your Shareable Link:*\n\`${link}\`\n\n` +
      `🔑 *Referral Code:* \`${user.referralCode}\`\n` +
      `👥 *Invited Friends:* *${user.referralCount} users*\n` +
      `💰 *Total Earned:* *${user.referralEarnings.toFixed(2)} BDT*`;

    return {
      id: `msg-${Date.now()}`,
      sender: 'BOT',
      text,
      replyMarkup: {
        inline_keyboard: [
          [{ text: '📋 Copy Link', callback_data: 'copylink' }],
          [{ text: '🔙 Main Menu', callback_data: 'menu:main' }]
        ]
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
}
