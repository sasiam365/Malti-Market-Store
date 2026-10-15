import React, { useState } from 'react';
import { 
  MessageSquare, 
  LayoutDashboard, 
  ShieldCheck, 
  FileCode, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Package
} from 'lucide-react';
import { TelegramBotSimulator } from './components/telegram/TelegramBotSimulator';
import { AdminLayout } from './components/admin/AdminLayout';
import { TestRunnerSuite } from './components/tests/TestRunnerSuite';
import { ArchitectureDocs } from './components/docs/ArchitectureDocs';
import { storeService } from './services/storeService';

export default function App() {
  const [activeView, setActiveView] = useState<'TELEGRAM' | 'ADMIN' | 'TESTS' | 'DOCS'>('TELEGRAM');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const pendingDeposits = storeService.getDeposits().filter(d => d.status === 'PENDING').length;
  const pendingOrders = storeService.getOrders().filter(o => o.status === 'PROCESSING').length;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Header & Switcher */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow">
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">TeleStore Pro</span>
              <span className="text-[10px] text-sky-400 block font-mono -mt-0.5">84 Products Edition</span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-2 hidden sm:block"></div>

          {/* Navigation View Switcher */}
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveView('TELEGRAM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeView === 'TELEGRAM'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>📱 Telegram Bot (Customer)</span>
            </button>

            <button
              onClick={() => setActiveView('ADMIN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeView === 'ADMIN'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>🖥️ Admin Panel (84 Products)</span>
              {(pendingDeposits > 0 || pendingOrders > 0) && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px]">
                  {pendingDeposits + pendingOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView('TESTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeView === 'TESTS'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>🧪 10 Verification Tests</span>
            </button>

            <button
              onClick={() => setActiveView('DOCS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 hidden md:flex ${
                activeView === 'DOCS'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>📄 Python Import Script</span>
            </button>
          </nav>
        </div>

        {/* Right Badges */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded-full text-[11px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>84 Catalog Entries Synced</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden relative">
        {activeView === 'TELEGRAM' && (
          <div className="h-full w-full flex items-center justify-center p-0 sm:p-4 bg-slate-950">
            <div className="w-full h-full sm:max-w-md sm:h-[94%] bg-[#0e1621] sm:rounded-2xl sm:border sm:border-slate-800 sm:shadow-2xl overflow-hidden flex flex-col">
              <TelegramBotSimulator onNotify={showToast} />
            </div>
          </div>
        )}

        {activeView === 'ADMIN' && (
          <AdminLayout
            onNotify={showToast}
            onSwitchToTelegram={() => setActiveView('TELEGRAM')}
          />
        )}

        {activeView === 'TESTS' && (
          <div className="h-full overflow-y-auto p-6 bg-slate-950">
            <div className="max-w-5xl mx-auto">
              <TestRunnerSuite onNotify={showToast} />
            </div>
          </div>
        )}

        {activeView === 'DOCS' && (
          <div className="h-full overflow-y-auto p-6 bg-slate-950">
            <div className="max-w-5xl mx-auto">
              <ArchitectureDocs onNotify={showToast} />
            </div>
          </div>
        )}

        {/* Toast Popup */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50">
            <div className={`px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-600 text-white' :
              toast.type === 'error' ? 'bg-rose-900/90 border-rose-600 text-white' :
              'bg-slate-900/90 border-sky-600 text-white'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
