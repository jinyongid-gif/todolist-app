import { describe, it, expect, vi, afterEach } from 'vitest'
import { isOverdue, formatDate } from './date.utils'

describe('isOverdue', () => {
  afterEach(() => vi.useRealTimers())

  it('due_date가 null이면 false', () => {
    expect(isOverdue(null)).toBe(false)
  })
  it('due_date가 undefined이면 false', () => {
    expect(isOverdue(undefined)).toBe(false)
  })
  it('isCompleted가 true이면 false', () => {
    expect(isOverdue('2020-01-01', true)).toBe(false)
  })
  it('오늘보다 이전 날짜이면 true', () => {
    vi.setSystemTime(new Date('2026-05-14'))
    expect(isOverdue('2026-05-13', false)).toBe(true)
  })
  it('오늘 날짜이면 false (오늘은 초과 아님)', () => {
    vi.setSystemTime(new Date('2026-05-14'))
    expect(isOverdue('2026-05-14', false)).toBe(false)
  })
  it('미래 날짜이면 false', () => {
    vi.setSystemTime(new Date('2026-05-14'))
    expect(isOverdue('2026-05-15', false)).toBe(false)
  })
})

describe('formatDate', () => {
  it('날짜 문자열을 한국어 형식으로 반환', () => {
    const result = formatDate('2026-05-14')
    expect(result).toContain('2026')
  })
})
