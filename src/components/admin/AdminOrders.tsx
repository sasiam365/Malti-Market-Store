import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ShoppingBag, 
  User, 
  Eye, 
  RotateCcw, 
  CheckCircle2, 
  X,
  Send
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { Order, OrderStatus } from '../../types';

export const AdminOrders: React.FC<{
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}> = ({ onNotify }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const orders = storeService.getOrders();

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchUser = o.telegramId.toString().includes(q);
      const matchItem = o.items.some(i => i.productName.toLowerCase().includes(q));
      if (!matchNum && !matchUser && !matchItem) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 border border-slate-800 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order #, Telegram ID, Product..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-xs rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-2 text-white"
        >
          <option value="ALL">All Order Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PROCESSING">Processing (Needs Fulfillment)</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Purchased Product & Plan</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No orders found. Test checkout in the Telegram Bot tab to create live orders!
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const item = order.items[0];
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        #{order.telegramId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{item?.productName}</div>
                        <div className="text-[11px] text-sky-400 font-mono">
                          {item?.duration} &bull; Qty: {item?.quantity}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {order.totalAmount} BDT
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                          order.status === 'PROCESSING' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Order {selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-sky-300 whitespace-pre-wrap">
              {selectedOrder.deliveryData || 'No delivery payload'}
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
