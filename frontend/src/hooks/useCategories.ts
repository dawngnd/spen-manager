import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { Category } from '@/lib/api'
import { useAppStore } from '@/store'

export function useGetCategories() {
  const initData = useAppStore(state => state.initData)
  
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<Category[]>('get_categories'),
    enabled: !!initData,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useUpsertCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { action: 'upsert_category'; id?: string; name: string; icon: string; color: string; parent_id?: string }) => 
      apiClient('upsert_category', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (category_id: string) => apiClient('delete_category', { action: 'delete_category', category_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
