import { apiFetch } from './client'
import type { Category } from '../types/category.types'

export async function getCategories(): Promise<{ data: Category[] }> {
  return apiFetch('/api/categories')
}
