import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Edit2, Check, X } from 'lucide-react';
import { useAppStore } from '@/store';
import { apiClient, type Transaction, type Category } from '@/lib/api';

export default function Budget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const { budgets, setBudget } = useAppStore();

  const { data: txnData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient<Transaction[]>('get_transactions'),
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<Category[]>('get_categories'),
  });

  const transactions = txnData?.data || [];
  const categories = catData?.data || [];
  
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthTxns = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
    });
  }, [transactions, currentDate]);

  const budgetProgress = useMemo(() => {
    const parentCategories = categories.filter(c => !c.parent_id);
    
    return parentCategories.map(cat => {
      const budget = budgets.find(b => b.category_id === cat.id && b.month === currentMonthKey);
      
      const spent = currentMonthTxns
        .filter(t => t.type.toLowerCase() === 'expense' && t.category_parent_id === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);

      const budgetAmount = budget?.amount || 0;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      const remaining = budgetAmount - spent;
      
      let colorClass = 'bg-primary/20';
      let progressColorClass = 'bg-primary';
      
      if (budgetAmount > 0) {
        if (percentage < 80) {
          colorClass = 'bg-green-100 dark:bg-green-900/30';
          progressColorClass = 'bg-green-500';
        } else if (percentage <= 100) {
          colorClass = 'bg-yellow-100 dark:bg-yellow-900/30';
          progressColorClass = 'bg-yellow-500';
        } else {
          colorClass = 'bg-red-100 dark:bg-red-900/30';
          progressColorClass = 'bg-red-500';
        }
      }

      return {
        category: cat,
        budgetAmount,
        spent,
        remaining,
        percentage: Math.min(percentage, 100),
        colorClass,
        progressColorClass
      };
    });
  }, [categories, budgets, currentMonthKey, currentMonthTxns]);

  const formatVND = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const prevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handleSaveBudget = (categoryId: string) => {
    const amount = parseInt(editValue.replace(/\D/g, ''), 10);
    if (!isNaN(amount)) {
      setBudget(categoryId, currentMonthKey, amount);
    }
    setEditingId(null);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <div className="flex items-center space-x-2 bg-card p-1 rounded-lg border border-border">
          <button onClick={prevMonth} className="p-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-sm w-32 text-center">{formatMonth(currentDate)}</span>
          <button onClick={nextMonth} className="p-1 text-muted-foreground hover:text-foreground">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {budgetProgress.map(bp => (
          <div key={bp.category.id} className="bg-card border border-border p-4 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{bp.category.icon}</span>
                <span className="font-medium">{bp.category.name}</span>
              </div>
              
              {editingId === bp.category.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 px-2 py-1 text-sm bg-background border border-border rounded"
                    autoFocus
                  />
                  <button onClick={() => handleSaveBudget(bp.category.id)} className="p-1 text-green-500">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => {
                    setEditingId(bp.category.id);
                    setEditValue(bp.budgetAmount ? bp.budgetAmount.toString() : '');
                  }}
                >
                  <span className="font-bold">
                    {bp.budgetAmount > 0 ? formatVND(bp.budgetAmount) : 'Not set'}
                  </span>
                  <Edit2 size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>

            {bp.budgetAmount > 0 ? (
              <>
                <div className={`h-2 rounded-full w-full overflow-hidden ${bp.colorClass} mb-2`}>
                  <div 
                    className={`h-full ${bp.progressColorClass}`} 
                    style={{ width: `${bp.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Spent: {formatVND(bp.spent)}</span>
                  <span className={bp.remaining < 0 ? 'text-destructive font-medium' : ''}>
                    {bp.remaining >= 0 ? `Left: ${formatVND(bp.remaining)}` : `Over: ${formatVND(Math.abs(bp.remaining))}`}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground mt-2">
                Tap the amount to set a budget for this category.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
