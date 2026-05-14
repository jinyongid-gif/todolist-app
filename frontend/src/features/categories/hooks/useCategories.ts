import { useQuery } from '@tanstack/react-query'
import { getCategories } from '../../../api/categories.api'
import { useAuthStore } from '../../../stores/useAuthStore'

export function useCategories() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: !!token,
    select: (res) => res.data,
  })
}
