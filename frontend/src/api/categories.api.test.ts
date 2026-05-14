import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCategories } from './categories.api'

vi.mock('./client', () => ({ apiFetch: vi.fn() }))
import { apiFetch } from './client'
const mockApiFetch = vi.mocked(apiFetch)

beforeEach(() => { mockApiFetch.mockReset() })

describe('getCategories', () => {
  it('/api/categories GET 호출', async () => {
    mockApiFetch.mockResolvedValue({ data: [] })
    await getCategories()
    expect(mockApiFetch).toHaveBeenCalledWith('/api/categories')
  })
  it('카테고리 목록 반환', async () => {
    const data = [{ id: 1, name: '업무', is_default: true }]
    mockApiFetch.mockResolvedValue({ data })
    const result = await getCategories()
    expect(result.data).toEqual(data)
  })
})
