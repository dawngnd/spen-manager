import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, LayoutDashboard, Wallet, AlertCircle } from 'lucide-react';
import { apiClient, type Transaction, type Category } from '@/lib/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#f46a9b'];

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const currentMonthTxns = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
    });
  }, [transactions, currentDate]);

  const { totalIncome, totalExpense, uncategorizedCount } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let uncat = 0;
    currentMonthTxns.forEach(t => {
      if (t.type.toLowerCase() === 'income') inc += t.amount;
      if (t.type.toLowerCase() === 'expense') exp += t.amount;
      if (!t.category_parent_id && !t.category_child_id) uncat += 1;
    });
    return { totalIncome: inc, totalExpense: exp, uncategorizedCount: uncat };
  }, [currentMonthTxns]);

  const categoryBreakdown = useMemo(() => {
    const expenses = currentMonthTxns.filter(t => t.type.toLowerCase() === 'expense' && t.category_parent_id);
    const grouped = expenses.reduce((acc, t) => {
      acc[t.category_parent_id] = (acc[t.category_parent_id] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        return {
          name: cat ? `${cat.icon || ''} ${cat.name}`.trim() : 'Unknown',
          amount,
          color: cat?.color || COLORS[Math.floor(Math.random() * COLORS.length)]
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthTxns, categories]);

  const monthlyTrend = useMemo(() => {
    const trend: Record<string, { month: string, income: number, expense: number }> = {};
    
    // Get last 6 months including current
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      trend[key] = { month: key, income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (trend[key]) {
        if (t.type.toLowerCase() === 'income') trend[key].income += t.amount;
        if (t.type.toLowerCase() === 'expense') trend[key].expense += t.amount;
      }
    });

    return Object.values(trend);
  }, [transactions]);

  const topMerchants = useMemo(() => {
    const expenses = currentMonthTxns.filter(t => t.type.toLowerCase() === 'expense');
    const grouped = expenses.reduce((acc, t) => {
      const merchant = t.merchant || 'Unknown';
      acc[merchant] = (acc[merchant] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [currentMonthTxns]);

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

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center space-x-2 text-green-500 mb-2">
            <ArrowDown size={20} />
            <h3 className="text-sm font-medium">Income</h3>
          </div>
          <p className="text-lg font-bold">{formatVND(totalIncome)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center space-x-2 text-destructive mb-2">
            <ArrowUp size={20} />
            <h3 className="text-sm font-medium">Expense</h3>
          </div>
          <p className="text-lg font-bold">{formatVND(totalExpense)}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center space-x-2 text-primary mb-2">
            <Wallet size={20} />
            <h3 className="text-sm font-medium">Net Flow</h3>
          </div>
          <p className={`text-lg font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-500' : 'text-destructive'}`}>
            {formatVND(totalIncome - totalExpense)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center space-x-2 text-orange-500 mb-2">
            <AlertCircle size={20} />
            <h3 className="text-sm font-medium">Uncategorized</h3>
          </div>
          <p className="text-lg font-bold">{uncategorizedCount}</p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <LayoutDashboard size={20} className="text-primary"/> 
          Category Breakdown
        </h3>
        {categoryBreakdown.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatVND(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No expenses this month</p>
        )}
      </div>

      <div className="bg-card p-4 rounded-xl border border-border">
        <h3 className="font-semibold mb-4">Monthly Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend}>
              <XAxis dataKey="month" tick={{fontSize: 12}} />
              <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} tick={{fontSize: 12}} width={50} />
              <Tooltip formatter={(value: any) => formatVND(Number(value))} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border">
        <h3 className="font-semibold mb-4">Top Merchants</h3>
        {topMerchants.length > 0 ? (
          <div className="space-y-3">
            {topMerchants.map((m, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm font-medium truncate flex-1 pr-4">{i + 1}. {m.name}</span>
                <span className="text-sm font-bold text-destructive">{formatVND(m.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">No data</p>
        )}
      </div>
    </div>
  );
}
