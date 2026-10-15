import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  BookOpen, 
  Shield, 
  ExternalLink
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { AdminProductCatalog84 } from './AdminProductCatalog84';
import { AdminOrders } from './AdminOrders';
import { AdminDeposits } from './AdminDeposits';
import { AdminLedger } from './AdminLedger';
import { storeService } from '../../services/storeService';

interface AdminLayoutProps {
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onSwitchToTelegram: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onNotify, onSwitchToTelegram }) => {
  const [currentPage, setCurrentPage] = useState<string>('catalog');

  const pendingDepositsCount = storeService.getDeposits().filter(d => d.status === 'PENDING').length;
  const pendingOrdersCount = storeService.getOrders().filter(o => o.status === 'PROCESSING').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: '84 Products Catalog', icon: Package, badge: '84' },
    { id: 'orders', label: 'Orders & Deliveries', icon: ShoppingBag, badge: pendingOrdersCount ? `${pendingOrdersCount}` : undefined },
    { id: 'deposits', label: 'Deposits & Payments', icon: DollarSign, badge: pendingDepositsCount ? `${pendingDepositsCount}` : undefined },
    { id: 'ledger', label: 'Financial Ledger', icon: BookOpen }
  ];

  return (
    <div className="flex h-full bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-wide text-white">TeleStore Pro</span>
                <div className="text-[10px] text-sky-400 font-mono">Admin Console</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-2 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span className="ml-3 truncate flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-sky-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Switcher */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            onClick={onSwitchToTelegram}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Switch to Telegram Bot View
          </button>

          <div className="flex items-center space-x-2 px-2 py-1">
            <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white">
              SA
            </div>
            <div className="text-[11px] truncate">
              <div className="font-semibold text-white">Siam (Admin)</div>
              <div className="text-slate-500 text-[10px]">admin@telestore.io</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-10 shrink-0">
          <h1 className="font-bold text-sm text-white capitalize">
            {navItems.find(i => i.id === currentPage)?.label || 'Console'}
          </h1>

          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={onSwitchToTelegram}
              className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow flex items-center gap-1.5"
            >
              <span>📱 Test in Telegram Bot</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && (
              <AdminDashboard onNavigate={page => setCurrentPage(page)} />
            )}
            {currentPage === 'catalog' && (
              <AdminProductCatalog84 onNotify={onNotify} />
            )}
            {currentPage === 'orders' && (
              <AdminOrders onNotify={onNotify} />
            )}
            {currentPage === 'deposits' && (
              <AdminDeposits onNotify={onNotify} />
            )}
            {currentPage === 'ledger' && (
              <AdminLedger onNotify={onNotify} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
