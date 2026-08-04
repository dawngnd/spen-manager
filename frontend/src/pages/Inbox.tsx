import { useState } from 'react';
import { Inbox as InboxIcon, RefreshCw } from 'lucide-react';
import type { Transaction } from '@/lib/api';
import { useGetTransactions } from '@/hooks/useTransactions';
import { CategorizeDrawer } from '@/components/CategorizeDrawer';

export default function Inbox() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  const { data: transactions = [], isLoading, refetch, isFetching } = useGetTransactions();
  const uncategorized = transactions.filter((t: Transaction) => t.status !== 'categorized');

  const handleTransactionClick = (id: string) => {
    setSelectedTxnId(id);
    setDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold mb-4">Inbox</h1>
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Lấy giao dịch mới"
        >
          <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {uncategorized.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <InboxIcon size={48} className="mb-4 opacity-20" />
          <p>No uncategorized transactions</p>
          <p className="text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-2">
            {uncategorized.length} transaction{uncategorized.length > 1 ? 's' : ''} to categorize
          </p>
          {uncategorized.map(t => (
            <div 
              key={t.id} 
              onClick={() => handleTransactionClick(t.id)}
              className="p-4 border border-border rounded-lg bg-card cursor-pointer active:scale-[0.98] transition-transform hover:border-primary/50"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-card-foreground line-clamp-1">{t.merchant || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${t.type.toLowerCase() === 'expense' || t.type.toLowerCase() === 'transfer' ? 'text-destructive' : 'text-green-500'}`}>
                    {t.type.toLowerCase() === 'expense' || t.type.toLowerCase() === 'transfer' ? '-' : '+'}
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount)}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground uppercase font-medium">
                    {t.type}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{t.reference || t.merchant}</p>
            </div>
          ))}
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
