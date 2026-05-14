import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useAuthStore } from './useAuthStore'

const mockUser = { id: 1, email: 'test@example.com', name: '테스트' }

beforeEach(() => {
  act(() => {
    useAuthStore.setState({ user: null, token: null, isLoading: false })
  })
})

describe('useAuthStore', () => {
  it('초기 상태가 올바르다', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isLoading).toBe(false)
  })

  it('setUser로 사용자를 설정한다', () => {
    act(() => { useAuthStore.getState().setUser(mockUser) })
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('setToken으로 토큰을 설정한다', () => {
    act(() => { useAuthStore.getState().setToken('test-token') })
    expect(useAuthStore.getState().token).toBe('test-token')
  })

  it('setLoading으로 로딩 상태를 설정한다', () => {
    act(() => { useAuthStore.getState().setLoading(true) })
    expect(useAuthStore.getState().isLoading).toBe(true)
  })

  it('logout 호출 시 user와 token이 null이 된다', () => {
    act(() => {
      useAuthStore.getState().setUser(mockUser)
      useAuthStore.getState().setToken('test-token')
      useAuthStore.getState().logout()
    })
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it('getState()로 컴포넌트 외부에서 token에 접근 가능하다', () => {
    act(() => { useAuthStore.getState().setToken('external-token') })
    expect(useAuthStore.getState().token).toBe('external-token')
  })

  it('token은 메모리에만 저장된다 (localStorage에 없다)', () => {
    act(() => { useAuthStore.getState().setToken('memory-token') })
    expect(localStorage.getItem('token')).toBeNull()
  })
})
