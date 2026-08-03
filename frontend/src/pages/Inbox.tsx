import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Inbox as InboxIcon } from 'lucide-react';
import { apiClient, type Transaction } from '@/lib/api';
import { CategorizeDrawer } from '@/components/CategorizeDrawer';

export default function Inbox() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient<Transaction[]>('get_transactions'),
  });

  const transactions = data?.data || [];
  const uncategorized = transactions.filter(t => !t.category_parent_id && !t.category_child_id);

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

  if (error) {
    return (
      <div className="p-4 text-destructive">
        Error loading transactions
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>
      
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
                  <p className={`font-bold ${t.type.toLowerCase() === 'expense' ? 'text-destructive' : 'text-green-500'}`}>
                    {t.type.toLowerCase() === 'expense' ? '-' : '+'}
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
