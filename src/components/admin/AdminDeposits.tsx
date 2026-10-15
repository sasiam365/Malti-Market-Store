import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter, 
  DollarSign, 
  Terminal
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { DepositRequest, DepositStatus } from '../../types';

export const AdminDeposits: React.FC<{
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}> = ({ onNotify }) => {
  const [statusFilter, setStatusFilter] = useState<DepositStatus | 'ALL'>('ALL');
  const deposits = storeService.getDeposits();

  const filteredDeposits = deposits.filter(d => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    return true;
  });

  const handleApprove = (deposit: DepositRequest) => {
    if (!window.confirm(`Approve deposit ${deposit.reference} for ${deposit.amount} ${deposit.currency}?`)) return;
    storeService.approveDeposit(deposit.id, 'admin@telestore.io');
    onNotify(`Deposit ${deposit.reference} approved and wallet credited!`, 'success');
  };

  const handleReject = (deposit: DepositRequest) => {
    if (!window.confirm(`Reject deposit ${deposit.reference}?`)) return;
    storeService.rejectDeposit(deposit.id, 'admin@telestore.io');
    onNotify(`Deposit ${deposit.reference} rejected.`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-2 text-white"
          >
            <option value="ALL">All Deposit Statuses</option>
            <option value="PENDING">Pending Approval (Action Required)</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No deposits found. Use /deposit in Telegram Bot to test manual or gateway deposits!
                  </td>
                </tr>
              ) : (
                filteredDeposits.map(dep => (
                  <tr key={dep.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-white">{dep.reference}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">#{dep.telegramId}</td>
                    <td className="py-3 px-4 font-mono text-sky-400 font-semibold">{dep.method}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">+{dep.amount} {dep.currency}</td>
                    <td className="py-3 px-4 font-mono text-slate-200">{dep.transactionHash || 'Pending'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dep.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                        dep.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 animate-pulse' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {dep.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {dep.status === 'PENDING' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleApprove(dep)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(dep)}
                            className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-semibold text-xs rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-mono">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
