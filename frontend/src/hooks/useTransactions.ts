import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Transaction } from '@/lib/api'
import { useAppStore } from '@/store'

/**
 * Fetches only NEW (unfetched) transactions from server, merges into cache.
 * Cache has infinite TTL — only refetches on manual trigger.
 */
export function useGetTransactions() {
  const initData = useAppStore(state => state.initData)
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['transactions'],
    queryFn: async (): Promise<Transaction[]> => {
      const existing = queryClient.getQueryData<Transaction[]>(['transactions']) || []
      // Normalize: cache might have old format { success, data: [...] }
      const normalized = Array.isArray(existing) ? existing : ((existing as any)?.data || [])
      const response = await apiClient<Transaction[]>('get_transactions')
      const newItems = (response.data as Transaction[]) || []
      
      if (newItems.length === 0) return normalized
      
      // Merge: new items override existing by id
      const map = new Map<string, Transaction>()
      for (const t of normalized) map.set(t.id, t)
      for (const t of newItems) map.set(t.id, t)
      return Array.from(map.values())
    },
    enabled: !!initData,
    staleTime: Infinity,
    gcTime: Infinity,
    // Normalize data from persisted cache (might be object instead of array)
    select: (data) => Array.isArray(data) ? data : ((data as any)?.data || []),
  })
}

/**
 * Reload ALL transactions — clears cache, fetches everything from server.
 */
export function useReloadAllTransactions() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient<Transaction[]>('get_all_transactions')
      console.log('[ReloadAll] response:', response)
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.error || 'Failed to reload transactions')
      }
      return response.data as Transaction[]
    },
    onSuccess: (data) => {
      console.log('[ReloadAll] setting cache with', data.length, 'transactions')
      queryClient.setQueryData(['transactions'], data)
    },
  })
}

/**
 * Categorize a transaction. Server returns updated record → patch cache.
 */
export function useCategorizeTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { transaction_id: string; category_parent_id: string; category_child_id: string }) => {
      const response = await apiClient<Transaction>('categorize_transaction', {
        action: 'categorize_transaction',
        id: params.transaction_id,
        category_parent_id: params.category_parent_id,
        category_child_id: params.category_child_id,
      })
      return response
    },
    onSuccess: (response) => {
      if (!response.success || !response.data) return
      const updated = response.data as Transaction
      
      queryClient.setQueryData<Transaction[]>(['transactions'], (old) => {
        if (!old) return [updated]
        return old.map(t => t.id === updated.id ? updated : t)
      })
    },
  })
}
