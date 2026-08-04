import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useAppStore } from '@/store'

export function useGetTransactions() {
  const initData = useAppStore(state => state.initData)
  
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient('get_transactions'),
    enabled: !!initData, // Wait for initData
  })
}

export function useCategorizeTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { transaction_id: string; category_id: string }) => 
      apiClient('categorize_transaction', { action: 'categorize_transaction', ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
