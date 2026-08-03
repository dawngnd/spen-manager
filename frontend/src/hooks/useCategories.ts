import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, type Category } from '@/lib/api'

export function useGetCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient('get_categories'),
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
