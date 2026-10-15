import React from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Clock, 
  Package, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { storeService } from '../../services/storeService';

export const AdminDashboard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const settings = storeService.getSettings();
  const products = storeService.getAllProducts();
  const orders = storeService.getOrders();
  const deposits = storeService.getDeposits();
  const users = storeService.getUsers();

  const totalRevenue = orders
    .filter(o => o.status === 'COMPLETED' || o.status === 'PROCESSING')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingDeposits = deposits.filter(d => d.status === 'PENDING');
  const pendingOrders = orders.filter(o => o.status === 'PROCESSING');
  const purchasableCount = products.filter(p => p.isActive && p.sellingPriceBdt !== null && !p.isOutOfStock).length;
  const priceUnsetCount = products.filter(p => p.sellingPriceBdt === null && !p.isPriceUnavailable).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Production Node
            </span>
            <span className="text-xs text-indigo-300">Bot: {settings.botUsername}</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">TeleStore Pro &bull; 84 Digital Products Marketplace</h1>
          <p className="text-sm text-indigo-200/80 mt-1 max-w-xl">
            Live catalog containing OTT subscriptions, AI & ChatGPT passes, design packages, and developer tools with automated dispatch.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('catalog')}
            className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            Manage 84 Products
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Catalog Entries</span>
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">84 Plans</span>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{purchasableCount} active & ready in bot</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Gross Sales (BDT)</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {totalRevenue.toLocaleString()} BDT
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Double-entry ledger audited</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Registered Users</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">{users.length}</span>
            <div className="flex items-center gap-1 mt-1 text-xs text-purple-400 font-medium">
              <span>{users.filter(u => u.referralCount > 0).length} active affiliate referrers</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Awaiting Verification</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {pendingDeposits.length + pendingOrders.length}
            </span>
            <div className="flex items-center gap-1 mt-1 text-xs text-amber-400 font-medium">
              <span>{pendingDeposits.length} deposits &bull; {pendingOrders.length} orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Price Configuration Notice */}
      {priceUnsetCount > 0 && (
        <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-4 flex items-start space-x-3 text-indigo-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-white text-sm">BDT Selling Price Attention</div>
            <p className="mt-0.5">
              {priceUnsetCount} product plans currently have their source INR price preserved, but their BDT selling price is unset. As required by store rules, purchasing is disabled in the bot until you configure selling prices.
            </p>
            <button
              onClick={() => onNavigate('catalog')}
              className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition"
            >
              Configure BDT Prices Now
            </button>
          </div>
        </div>
      )}

      {/* Category Breakdown Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-white text-sm mb-4">84 Digital Products — Category Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {[
            { name: 'Streaming & Entertainment', count: 8, icon: '🎬', examples: 'Zee5, Sony LIV, Hotstar, Netflix, Hoichoi' },
            { name: 'YouTube & Telegram', count: 4, icon: '⚡', examples: 'YouTube Premium 1M/2M/3M, Telegram Premium 1Y' },
            { name: 'AI & ChatGPT', count: 15, icon: '🤖', examples: 'Gemini, ChatGPT Plus/Biz, Claude 5X/20X, Perplexity' },
            { name: 'Design & Video Editing', count: 13, icon: '🎨', examples: 'Canva Pro, Figma, CapCut (4 plans), Adobe CC' },
            { name: 'Productivity & VPN', count: 7, icon: '🛡️', examples: 'Office 365, NordVPN, Surfshark, QuillBot, LinkedIn' },
            { name: 'Developer & AI Tools', count: 37, icon: '💻', examples: 'Bolt.new (3 plans), Replit, Supabase, Cursor, Lovable' },
          ].map((cat, i) => (
            <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-bold font-mono text-[11px]">
                    {cat.count} Products
                  </span>
                </div>
                <h4 className="font-bold text-white mt-2 text-sm">{cat.name}</h4>
                <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">{cat.examples}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
