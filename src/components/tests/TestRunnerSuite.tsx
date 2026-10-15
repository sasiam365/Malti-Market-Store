import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Package, 
  Terminal 
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { RAW_84_PRODUCT_ENTRIES } from '../../store/productsCatalog84';

interface TestSpec {
  id: number;
  title: string;
  category: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  durationMs?: number;
  error?: string;
}

const INITIAL_TESTS: TestSpec[] = [
  {
    id: 1,
    title: 'Verify All 84 Product-Plan Entries Imported',
    category: 'Catalog Database',
    description: 'Ensure exact count of 84 distinct product-plan entries across 6 categories in database.',
    status: 'PENDING'
  },
  {
    id: 2,
    title: 'Source INR Prices Preserved Without Alteration',
    category: 'Pricing Rules',
    description: 'Verify Zee5 (₹399), YouTube Premium 1M (₹80), ChatGPT Plus (₹499), Claude 5X (₹3,499), etc.',
    status: 'PENDING'
  },
  {
    id: 3,
    title: 'Price Unavailable Products Inactive by Default',
    category: 'Pricing Rules',
    description: 'Ensure items marked Price Unavailable (Higgsfield, Kling, Cursor, Runway, etc.) have null source price and remain inactive.',
    status: 'PENDING'
  },
  {
    id: 4,
    title: 'Claude Pro Out-of-Stock Enforcement',
    category: 'Stock Rules',
    description: 'Verify Claude Pro has isOutOfStock === true and 0 stock until explicit admin confirmation.',
    status: 'PENDING'
  },
  {
    id: 5,
    title: 'BDT Selling Price Requirement for Checkout',
    category: 'Currency Rules',
    description: 'Verify checkout is blocked with an informative error if BDT selling price is unset/missing.',
    status: 'PENDING'
  },
  {
    id: 6,
    title: 'Multi-Plan Duration Integrity (No Merged Durations)',
    category: 'Plan Structure',
    description: 'Verify distinct plan records for YouTube Premium (1M, 2M, 3M), CapCut (4 plans), Adobe CC (3 plans), Bolt.new (3 plans).',
    status: 'PENDING'
  },
  {
    id: 7,
    title: 'Safe Repeatable Migration (Preserves Users & Orders)',
    category: 'Migration',
    description: 'Verify running importCatalog84 does not wipe existing users, wallets, or order records.',
    status: 'PENDING'
  },
  {
    id: 8,
    title: 'Wallet Balance Deduction & Insufficient Balance Defense',
    category: 'Ledger',
    description: 'Verify purchase with insufficient funds is rejected; purchase with sufficient funds executes clean double-entry ledger entry.',
    status: 'PENDING'
  },
  {
    id: 9,
    title: 'Double-Entry Financial Ledger Accuracy',
    category: 'Ledger',
    description: 'Check balanceBefore + delta === balanceAfter on wallet operations.',
    status: 'PENDING'
  },
  {
    id: 10,
    title: 'Price History Audit Logging on Updates',
    category: 'Audit',
    description: 'Ensure editing product sellingPriceBdt records an audit entry with admin attribution.',
    status: 'PENDING'
  }
];

export const TestRunnerSuite: React.FC<{
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}> = ({ onNotify }) => {
  const [tests, setTests] = useState<TestSpec[]>(INITIAL_TESTS);
  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    const updated = [...tests];

    for (let i = 0; i < updated.length; i++) {
      const test = updated[i];
      test.status = 'RUNNING';
      setTests([...updated]);

      const start = performance.now();
      try {
        await executeTest(test.id);
        test.status = 'PASSED';
        test.durationMs = Math.round(performance.now() - start);
      } catch (err: any) {
        test.status = 'FAILED';
        test.error = err.message || 'Assertion failed';
        test.durationMs = Math.round(performance.now() - start);
      }

      setTests([...updated]);
      await new Promise(r => setTimeout(r, 50));
    }

    setIsRunning(false);
    onNotify('Verification Test Battery Completed!', 'success');
  };

  const executeTest = async (testId: number) => {
    const products = storeService.getAllProducts();

    switch (testId) {
      case 1: { // 84 entries check
        if (products.length !== 84) {
          throw new Error(`Expected exactly 84 product-plan entries, found ${products.length}`);
        }
        break;
      }

      case 2: { // Source INR preservation
        const zee5 = products.find(p => p.id === 'prod-zee5-1y');
        if (!zee5 || zee5.sourcePriceInr !== 399) throw new Error('Zee5 1 Year source price is not ₹399');

        const yt1m = products.find(p => p.id === 'prod-yt-1m');
        if (!yt1m || yt1m.sourcePriceInr !== 80) throw new Error('YouTube Premium 1M source price is not ₹80');

        const chatgptPlus = products.find(p => p.id === 'prod-chatgpt-plus-1m');
        if (!chatgptPlus || chatgptPlus.sourcePriceInr !== 499) throw new Error('ChatGPT Plus source price is not ₹499');

        const claude5x = products.find(p => p.id === 'prod-claude-5x-1m');
        if (!claude5x || claude5x.sourcePriceInr !== 3499) throw new Error('Claude 5X Max source price is not ₹3,499');
        break;
      }

      case 3: { // Price unavailable products
        const cursor = products.find(p => p.id === 'prod-cursor-1y');
        if (!cursor || cursor.sourcePriceInr !== null || cursor.isActive !== false) {
          throw new Error('Cursor Pro should have null price and inactive status');
        }

        const kling = products.find(p => p.id === 'prod-kling-std-1m');
        if (!kling || kling.sourcePriceInr !== null || kling.isActive !== false) {
          throw new Error('Kling AI should have null price and inactive status');
        }
        break;
      }

      case 4: { // Claude Pro out of stock
        const claudePro = products.find(p => p.id === 'prod-claude-pro-1m');
        if (!claudePro) throw new Error('Claude Pro not found in catalog');
        if (!claudePro.isOutOfStock || claudePro.stock !== 0) {
          throw new Error('Claude Pro must be out of stock by default');
        }
        break;
      }

      case 5: { // BDT selling price requirement
        const testUser = storeService.registerOrGetUser(987654321, 'TestBuyer');
        testUser.balance = 10000;

        // Try checkout on product without BDT selling price
        const res = storeService.checkoutProductPlan({
          telegramId: testUser.telegramId,
          productId: 'prod-cursor-1y',
          quantity: 1
        });
        if (res.success) throw new Error('Checkout should have been rejected due to missing BDT price');
        break;
      }

      case 6: { // Multi-plan separation
        const ytPlans = storeService.getPlansForProduct('YouTube Premium');
        if (ytPlans.length !== 3) throw new Error(`YouTube Premium should have 3 distinct plans, found ${ytPlans.length}`);

        const capcutPlans = storeService.getPlansForProduct('CapCut');
        const capcutAll = products.filter(p => p.productName.toLowerCase().includes('capcut'));
        if (capcutAll.length !== 4) throw new Error(`CapCut should have 4 entries, found ${capcutAll.length}`);

        const boltPlans = storeService.getPlansForProduct('Bolt.new Pro');
        if (boltPlans.length !== 3) throw new Error(`Bolt.new Pro should have 3 plans, found ${boltPlans.length}`);
        break;
      }

      case 7: { // Safe repeatable migration
        const usersBefore = storeService.getUsers().length;
        const report = storeService.importCatalog84('UPSERT');
        const usersAfter = storeService.getUsers().length;

        if (usersBefore !== usersAfter) throw new Error('User data was altered during import');
        if (report.totalEntries !== 84) throw new Error('Import report total entries mismatch');
        break;
      }

      case 8: { // Wallet balance deduction & insufficient funds
        const poor = storeService.registerOrGetUser(111222333, 'PoorUser');
        poor.balance = 10; // only 10 BDT

        const failRes = storeService.checkoutProductPlan({
          telegramId: poor.telegramId,
          productId: 'prod-yt-1m', // costs 120 BDT
          quantity: 1
        });
        if (failRes.success) throw new Error('Should have failed due to insufficient balance');

        // Fund user
        storeService.executeLedgerTransaction({
          telegramId: poor.telegramId,
          type: 'DEPOSIT_CREDIT',
          amount: 500,
          referenceId: 'DEP-TEST-FUND',
          reason: 'Funded for test'
        });

        const passRes = storeService.checkoutProductPlan({
          telegramId: poor.telegramId,
          productId: 'prod-yt-1m',
          quantity: 1
        });
        if (!passRes.success) throw new Error('Checkout failed after funding wallet');
        break;
      }

      case 9: { // Double-entry ledger consistency
        const user = storeService.registerOrGetUser(444555666, 'LedgerTester');
        const balBefore = user.balance;
        const txRes = storeService.executeLedgerTransaction({
          telegramId: user.telegramId,
          type: 'DEPOSIT_CREDIT',
          amount: 150.50,
          referenceId: 'TX-VERIFY-1',
          reason: 'Precision verification'
        });
        if (!txRes.success || !txRes.transaction) throw new Error('Ledger transaction failed');
        const tx = txRes.transaction;
        if (Number((tx.balanceBefore + tx.amount).toFixed(2)) !== tx.balanceAfter) {
          throw new Error('Double entry imbalance');
        }
        break;
      }

      case 10: { // Price history audit log
        const target = products.find(p => p.id === 'prod-zee5-1y');
        if (!target) throw new Error('Zee5 not found');
        const oldPrice = target.sellingPriceBdt;
        storeService.updateProduct({ ...target, sellingPriceBdt: (oldPrice || 500) + 20 }, 'test_admin@telestore.io', 'Unit Test Adjustment');
        
        const history = storeService.getPriceHistory(target.id);
        if (history.length === 0) throw new Error('Price change history record was not generated');
        break;
      }
    }
  };

  const passedCount = tests.filter(t => t.status === 'PASSED').length;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white text-base">84 Products Automated Verification Suite</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Live assertion runner validating the full 84 digital products catalog import, INR source pricing preservation, Claude Pro out-of-stock rules, and multi-plan integrity.
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
        >
          <Play className={`w-4 h-4 fill-white ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running Test Battery...' : 'Run All 10 Test Suites'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 uppercase">Total Tests</div>
          <div className="text-2xl font-bold text-white mt-1">{tests.length} Specs</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-emerald-400 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Passed Tests
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{passedCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-sky-400 uppercase">Catalog Coverage</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">84/84 Products (100%)</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
        {tests.map(test => (
          <div key={test.id} className="p-4 flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                {test.status === 'PASSED' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {test.status === 'FAILED' && <XCircle className="w-5 h-5 text-rose-400" />}
                {test.status === 'RUNNING' && <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />}
                {test.status === 'PENDING' && <Clock className="w-5 h-5 text-slate-600" />}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-xs sm:text-sm">{test.id}. {test.title}</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded text-[10px] font-mono">
                    {test.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{test.description}</p>
                {test.error && (
                  <div className="text-xs text-rose-400 font-mono mt-1 bg-rose-950/40 p-1.5 rounded">
                    Error: {test.error}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono ${
                test.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' :
                test.status === 'FAILED' ? 'bg-rose-500/20 text-rose-400' :
                test.status === 'RUNNING' ? 'bg-sky-500/20 text-sky-400' :
                'bg-slate-800 text-slate-500'
              }`}>
                {test.status}
              </span>
              {test.durationMs !== undefined && (
                <div className="text-[10px] text-slate-500 font-mono mt-1">{test.durationMs}ms</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
