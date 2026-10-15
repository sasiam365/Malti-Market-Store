import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  RotateCcw, 
  User, 
  Globe, 
  ShoppingBag, 
  Wallet, 
  CheckCircle2, 
  Copy,
  Zap,
  ShieldCheck,
  Check,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { TelegramBotEngine, BotMessage, InlineKeyboardButton } from '../../services/telegramBotEngine';
import { storeService } from '../../services/storeService';
import { PaymentMethod, TelegramUser } from '../../types';

interface TelegramBotSimulatorProps {
  onNotify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const TelegramBotSimulator: React.FC<TelegramBotSimulatorProps> = ({ onNotify }) => {
  const [engine] = useState(() => new TelegramBotEngine(589218491));
  const [currentUser, setCurrentUser] = useState<TelegramUser>(() => engine.getActiveUser());
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [inputCommand, setInputCommand] = useState('');
  const [userSwitcherOpen, setUserSwitcherOpen] = useState(false);
  const [depositModal, setDepositModal] = useState<{ method: PaymentMethod; amount: number } | null>(null);
  const [trxInput, setTrxInput] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStateChange = () => {
      const u = storeService.getUser(currentUser.telegramId);
      if (u) setCurrentUser({ ...u });
    };

    window.addEventListener('telestore-state-change', handleStateChange);
    setMessages([engine.handleStart()]);

    return () => {
      window.removeEventListener('telestore-state-change', handleStateChange);
    };
  }, [engine]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const switchUser = (telegramId: number) => {
    engine.setActiveUser(telegramId);
    const u = engine.getActiveUser();
    setCurrentUser(u);
    setUserSwitcherOpen(false);
    setMessages(prev => [
      ...prev,
      {
        id: `switch-${Date.now()}`,
        sender: 'BOT',
        text: `🔄 Switched active Telegram account to *${u.firstName}* (\`${u.telegramId}\`).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      engine.handleStart()
    ]);
  };

  const createNewTestUser = () => {
    const randId = Math.floor(100000000 + Math.random() * 900000000);
    const names = ['Tanvir', 'Farhan', 'Nafis', 'Sabbir', 'Mehedi'];
    const name = names[Math.floor(Math.random() * names.length)];
    const u = storeService.registerOrGetUser(randId, name, 'Customer', `user_${randId.toString().slice(-4)}`);
    switchUser(u.telegramId);
    if (onNotify) onNotify(`Created test account for ${u.firstName}!`, 'info');
  };

  const handleCallbackClick = (btn: InlineKeyboardButton) => {
    const cb = btn.callback_data;
    if (!cb) return;

    const userEcho: BotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: btn.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let reply: BotMessage | null = null;

    if (cb === 'menu:main') {
      reply = engine.handleStart();
    } else if (cb === 'menu:products') {
      reply = engine.handleCategories();
    } else if (cb === 'menu:deposit') {
      reply = engine.handleDepositMenu();
    } else if (cb === 'menu:wallet') {
      reply = engine.handleWallet();
    } else if (cb === 'menu:transactions') {
      reply = engine.handleTransactions();
    } else if (cb === 'menu:orders') {
      reply = engine.handleOrders();
    } else if (cb === 'menu:referrals') {
      reply = engine.handleReferrals();
    } else if (cb === 'menu:support') {
      reply = {
        id: `bot-${Date.now()}`,
        sender: 'BOT',
        text: `💬 *Support & Assistance:*\n\nHave questions about delivery, plans, or payments? Contact our official support desk at ${storeService.getSettings().supportUsername} or view documentation.`,
        replyMarkup: { inline_keyboard: [[{ text: '🔙 Main Menu', callback_data: 'menu:main' }]] },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } else if (cb === 'toggle:lang') {
      const nextLang = currentUser.language === 'en' ? 'bn' : 'en';
      storeService.setUserLanguage(currentUser.telegramId, nextLang);
      setCurrentUser(prev => ({ ...prev, language: nextLang }));
      reply = engine.handleStart();
    } else if (cb.startsWith('cat:')) {
      const catId = cb.replace('cat:', '');
      reply = engine.handleCategoryProducts(catId, 0);
    } else if (cb.startsWith('catpage:')) {
      const [, catId, pageStr] = cb.split(':');
      reply = engine.handleCategoryProducts(catId, parseInt(pageStr, 10));
    } else if (cb.startsWith('prodname:')) {
      const prodName = decodeURIComponent(cb.replace('prodname:', ''));
      reply = engine.handleProductPlansSelection(prodName);
    } else if (cb.startsWith('plan:')) {
      const planId = cb.replace('plan:', '');
      reply = engine.handlePlanDetails(planId, 1);
    } else if (cb.startsWith('planqty:')) {
      const [, planId, qtyStr] = cb.split(':');
      reply = engine.handlePlanDetails(planId, parseInt(qtyStr, 10));
    } else if (cb.startsWith('order_confirm:')) {
      const [, planId, qtyStr] = cb.split(':');
      reply = engine.handleOrderCheckout(planId, parseInt(qtyStr, 10));
      if (onNotify) onNotify('Order processed successfully!', 'success');
    } else if (cb.startsWith('dep:')) {
      const method = cb.replace('dep:', '') as PaymentMethod;
      setDepositModal({ method, amount: 500 });
      return;
    } else if (cb === 'copylink') {
      const link = `https://t.me/${storeService.getSettings().botUsername.replace('@', '')}?start=${currentUser.referralCode}`;
      navigator.clipboard?.writeText(link);
      if (onNotify) onNotify('Referral link copied!', 'success');
      return;
    }

    if (reply) {
      setMessages(prev => [...prev, userEcho, reply as BotMessage]);
    }
  };

  const handleSendCommand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = inputCommand.trim();
    if (!cmd) return;

    setInputCommand('');
    const userMsg: BotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: cmd,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let reply: BotMessage;
    if (cmd === '/start' || cmd.startsWith('/start')) {
      const parts = cmd.split(' ');
      const ref = parts.length > 1 ? parts[1].replace('ref_', '') : undefined;
      reply = engine.handleStart(ref);
    } else if (cmd === '/products' || cmd === '/catalog') {
      reply = engine.handleCategories();
    } else if (cmd === '/wallet') {
      reply = engine.handleWallet();
    } else if (cmd === '/orders') {
      reply = engine.handleOrders();
    } else if (cmd === '/deposit') {
      reply = engine.handleDepositMenu();
    } else if (cmd === '/referrals') {
      reply = engine.handleReferrals();
    } else {
      reply = {
        id: `bot-${Date.now()}`,
        sender: 'BOT',
        text: `❓ Unrecognized command: \`${cmd}\`. Use /start to explore the catalog!`,
        replyMarkup: { inline_keyboard: [[{ text: '🔙 Main Menu', callback_data: 'menu:main' }]] },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    setMessages(prev => [...prev, userMsg, reply]);
  };

  const handleDepositSubmit = () => {
    if (!depositModal || !trxInput.trim()) {
      if (onNotify) onNotify('Please enter a Transaction ID', 'error');
      return;
    }

    const res = storeService.createDepositRequest({
      telegramId: currentUser.telegramId,
      method: depositModal.method,
      amount: depositModal.amount,
      transactionHash: trxInput.trim()
    });

    const dep = res.deposit;
    if (res.success && dep) {
      setMessages(prev => [
        ...prev,
        {
          id: `usr-${Date.now()}`,
          sender: 'USER',
          text: `Submitted TrxID: ${trxInput.trim()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: `bot-dep-${Date.now()}`,
          sender: 'BOT',
          text: `✅ *Deposit Request Submitted!*\n\n• Ref: \`${dep.reference}\`\n• Method: ${dep.method}\n• Amount: *${dep.amount} BDT*\n• Status: 🟡 *PENDING VERIFICATION*\n\nGo to the Web Admin Panel > Deposits & Payments to verify and credit funds.`,
          replyMarkup: { inline_keyboard: [[{ text: '💰 View Wallet', callback_data: 'menu:wallet' }]] },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setDepositModal(null);
      setTrxInput('');
      if (onNotify) onNotify('Deposit submitted! Approve it in the Admin Panel to credit balance.', 'info');
    }
  };

  const allUsers = storeService.getUsers();

  return (
    <div className="flex flex-col h-full bg-[#0e1621] text-gray-100 font-sans antialiased select-none overflow-hidden">
      {/* Telegram Chat Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#17212b] border-b border-[#242f3d] z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#17212b] rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-sm text-white tracking-wide">TeleStore Pro Bot</span>
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-xs text-sky-400/90 font-medium">84 digital products &bull; automated 24/7</p>
          </div>
        </div>

        {/* User Account Switcher */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setUserSwitcherOpen(!userSwitcherOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#242f3d] hover:bg-[#2b5278] text-xs transition border border-[#2e3b4b]"
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-medium max-w-[90px] truncate">{currentUser.firstName}</span>
              <span className="text-emerald-400 font-semibold">{currentUser.balance.toFixed(0)} ৳</span>
            </button>

            {userSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#17212b] border border-[#2b5278] rounded-xl shadow-2xl py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-[#242f3d] flex items-center justify-between">
                  <span className="font-semibold text-gray-300">Switch Customer:</span>
                  <button onClick={createNewTestUser} className="text-sky-400 hover:text-sky-300 font-semibold">
                    + New User
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {allUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => switchUser(u.telegramId)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#242f3d] transition ${
                        u.telegramId === currentUser.telegramId ? 'bg-[#242f3d]/60 font-bold text-sky-400' : 'text-gray-300'
                      }`}
                    >
                      <div>
                        <div>{u.firstName} {u.lastName || ''}</div>
                        <div className="text-[10px] text-gray-500">ID: {u.telegramId}</div>
                      </div>
                      <span className="text-emerald-400 font-medium">{u.balance.toFixed(0)} BDT</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setMessages(prev => [...prev, engine.handleStart()])}
            className="p-1.5 rounded-lg bg-[#242f3d] hover:bg-[#2b5278] text-amber-400 transition"
            title="Restart /start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundImage: `radial-gradient(circle at 50% 50%, rgba(24, 37, 51, 0.4) 0%, rgba(14, 22, 33, 0.95) 100%)` }}
      >
        <div className="text-center my-2">
          <span className="px-3 py-1 bg-[#17212b]/80 border border-[#242f3d] text-gray-400 text-xs rounded-full">
            Today &bull; 84 Digital Products Catalog Active
          </span>
        </div>

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[78%] rounded-2xl shadow-md overflow-hidden ${
                msg.sender === 'USER'
                  ? 'bg-[#2b5278] text-white rounded-br-sm'
                  : 'bg-[#182533] text-gray-100 rounded-bl-sm border border-[#242f3d]/60'
              }`}
            >
              {msg.photoUrl && (
                <div className="relative w-full h-40 bg-slate-900 overflow-hidden">
                  <img src={msg.photoUrl} alt="Product" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#182533] via-transparent to-transparent"></div>
                </div>
              )}

              <div className="p-3.5 space-y-1.5 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed font-normal select-text">
                {msg.text.split('\n').map((line, idx) => {
                  const rendered = line
                    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                    .replace(/_(.*?)_/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code class="bg-[#101921] px-1 py-0.5 rounded text-sky-300 font-mono text-xs border border-[#2b3a4c]">$1</code>');
                  return <div key={idx} dangerouslySetInnerHTML={{ __html: rendered }} />;
                })}
              </div>

              <div className="flex items-center justify-end px-3 pb-2 pt-0.5 space-x-1 text-[11px] text-gray-400">
                <span>{msg.timestamp}</span>
                {msg.sender === 'USER' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
              </div>
            </div>

            {/* Inline Keyboards */}
            {msg.replyMarkup && msg.replyMarkup.inline_keyboard && (
              <div className="w-full max-w-[88%] sm:max-w-[78%] mt-2 space-y-1.5">
                {msg.replyMarkup.inline_keyboard.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-1.5 w-full">
                    {row.map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => handleCallbackClick(btn)}
                        className="flex-1 py-2 px-3 bg-[#242f3d] hover:bg-[#2b5278] active:bg-[#1f3f61] text-gray-100 font-medium text-xs sm:text-sm rounded-lg transition border border-[#2e3e50] shadow-sm flex items-center justify-center text-center cursor-pointer active:scale-[0.98]"
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Navigation Chips */}
      <div className="px-3 py-1.5 bg-[#17212b] border-t border-[#242f3d] flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar shrink-0">
        <button
          onClick={() => { setInputCommand('/start'); setTimeout(() => handleSendCommand(), 50); }}
          className="px-2.5 py-1 bg-[#242f3d] hover:bg-[#2b5278] rounded-md text-sky-300 font-medium shrink-0"
        >
          /start
        </button>
        <button
          onClick={() => { setInputCommand('/products'); setTimeout(() => handleSendCommand(), 50); }}
          className="px-2.5 py-1 bg-[#242f3d] hover:bg-[#2b5278] rounded-md text-emerald-300 font-medium shrink-0"
        >
          🛍️ /products (84 Items)
        </button>
        <button
          onClick={() => { setInputCommand('/deposit'); setTimeout(() => handleSendCommand(), 50); }}
          className="px-2.5 py-1 bg-[#242f3d] hover:bg-[#2b5278] rounded-md text-purple-300 font-medium shrink-0"
        >
          💳 /deposit
        </button>
        <button
          onClick={() => { setInputCommand('/wallet'); setTimeout(() => handleSendCommand(), 50); }}
          className="px-2.5 py-1 bg-[#242f3d] hover:bg-[#2b5278] rounded-md text-amber-300 font-medium shrink-0"
        >
          💰 /wallet
        </button>
        <button
          onClick={() => { setInputCommand('/orders'); setTimeout(() => handleSendCommand(), 50); }}
          className="px-2.5 py-1 bg-[#242f3d] hover:bg-[#2b5278] rounded-md text-rose-300 font-medium shrink-0"
        >
          📦 /orders
        </button>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSendCommand} className="flex items-center px-3 py-2 bg-[#17212b] border-t border-[#242f3d] space-x-2 shrink-0">
        <input
          type="text"
          value={inputCommand}
          onChange={e => setInputCommand(e.target.value)}
          placeholder="Send a message or command (e.g. /products, /start)..."
          className="flex-1 bg-[#242f3d] text-white placeholder-gray-400 text-xs sm:text-sm px-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={!inputCommand.trim()}
          className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Deposit Modal */}
      {depositModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-[#17212b] border border-[#2b5278] rounded-2xl w-full max-w-md p-5 shadow-2xl text-gray-200">
            <h3 className="font-semibold text-white text-base mb-1">
              Deposit via {depositModal.method}
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Amount: *{depositModal.amount} BDT*. Paste your mobile financial transaction ID below:
            </p>
            <input
              type="text"
              placeholder="e.g. 9X8A1K2P"
              value={trxInput}
              onChange={e => setTrxInput(e.target.value)}
              className="w-full bg-[#242f3d] border border-[#2e3e50] rounded-lg px-3 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-sky-500 mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setDepositModal(null)}
                className="flex-1 py-2 bg-[#242f3d] hover:bg-[#2b3a4a] rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDepositSubmit}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold"
              >
                Submit Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
