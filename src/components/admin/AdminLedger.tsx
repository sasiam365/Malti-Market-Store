import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  PlusCircle, 
  DollarSign
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { LedgerTransaction } from '../../types';

export const AdminLedger: React.FC<{
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}> = ({ onNotify }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const ledger = storeService.getLedger();

  const filteredLedger = ledger.filter(tx => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser = tx.telegramId.toString().includes(q);
      const matchReason = tx.reason.toLowerCase().includes(q);
      const matchRef = tx.referenceId.toLowerCase().includes(q);
      if (!matchUser && !matchReason && !matchRef) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white text-base">Immutable Double-Entry Financial Ledger</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Auditable transaction records with balanceBefore + delta === balanceAfter precision.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 p-4 border border-slate-800 rounded-xl flex items-center space-x-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search ledger by Telegram ID, Reason, Reference..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Tx ID</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Balance After</th>
                <th className="py-3 px-4">Reference & Reason</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredLedger.map(tx => {
                const isCredit = tx.amount >= 0;
                return (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{tx.id}</td>
                    <td className="py-3 px-4 text-slate-200">#{tx.telegramId}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'DEPOSIT_CREDIT' ? 'bg-emerald-500/20 text-emerald-400' :
                        tx.type === 'PRODUCT_PURCHASE' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-sky-500/20 text-sky-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                        {isCredit ? '+' : ''}{tx.amount.toFixed(2)} {tx.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{tx.balanceAfter.toFixed(2)} {tx.currency}</td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      <span className="font-mono text-sky-400 text-xs">{tx.referenceId}</span> &bull; {tx.reason}
                    </td>
                    <td className="py-3 px-4 text-right font-sans text-slate-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
