import { useState, useMemo } from 'react';
import { useGetTransactions } from '@/hooks/useTransactions';
import { useGetCategories } from '@/hooks/useCategories';
import { CategorizeDrawer } from '@/components/CategorizeDrawer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction, Category } from '@/lib/api';

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(key: string): string {
  const [y, m] = key.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

export default function Transactions() {
  const { data: txnResponse, isLoading: txnLoading } = useGetTransactions();
  const { data: catResponse } = useGetCategories();
  const transactions: Transaction[] = (txnResponse?.data as Transaction[]) || [];
  const categories: Category[] = catResponse?.data || [];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  // Build a category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  // Determine current month
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(now));

  // Filter & sort
  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return getMonthKey(d) === selectedMonth;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth]);

  // Available months for navigation


  const navigateMonth = (direction: -1 | 1) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + direction);
    setSelectedMonth(getMonthKey(d));
  };

  const handleTransactionClick = (id: string) => {
    setSelectedTxnId(id);
    setDrawerOpen(true);
  };

  const getCategoryLabel = (t: Transaction): string | null => {
    const child = t.category_child_id ? categoryMap.get(t.category_child_id) : null;
    const parent = t.category_parent_id ? categoryMap.get(t.category_parent_id) : null;
    if (child) return `${child.icon} ${child.name}`;
    if (parent) return `${parent.icon} ${parent.name}`;
    return null;
  };

  // Totals
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type.toLowerCase() === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense };
  }, [filtered]);

  if (txnLoading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold mb-4">Lịch sử</h1>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-4 p-4 border border-border rounded-lg bg-card">
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="w-16 h-4 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">Lịch sử giao dịch</h1>

      {/* Month navigator */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3 mb-4">
        <button onClick={() => navigateMonth(-1)} className="p-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-medium capitalize">{formatMonth(selectedMonth)}</span>
        <button onClick={() => navigateMonth(1)} className="p-1 text-muted-foreground hover:text-foreground">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Thu nhập</p>
          <p className="text-green-500 font-bold">
            +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totals.income)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Chi tiêu</p>
          <p className="text-destructive font-bold">
            -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totals.expense)}
          </p>
        </div>
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
          <p>Không có giao dịch trong tháng này</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} giao dịch
          </p>
          {filtered.map(t => {
            const catLabel = getCategoryLabel(t);
            return (
              <div
                key={t.id}
                onClick={() => handleTransactionClick(t.id)}
                className="p-4 border border-border rounded-lg bg-card cursor-pointer active:scale-[0.98] transition-transform hover:border-primary/50"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="font-semibold text-card-foreground line-clamp-1">{t.merchant || 'Unknown'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold ${t.type.toLowerCase() === 'expense' || t.type.toLowerCase() === 'transfer' ? 'text-destructive' : 'text-green-500'}`}>
                      {t.type.toLowerCase() === 'expense' || t.type.toLowerCase() === 'transfer' ? '-' : '+'}
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount)}
                    </p>
                  </div>
                </div>
                {catLabel ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{catLabel}</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Chưa phân loại</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CategorizeDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        transactionId={selectedTxnId}
      />
    </div>
  );
}
