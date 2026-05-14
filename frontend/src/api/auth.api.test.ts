import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { register, login } from './auth.api'

describe('auth.api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('register', () => {
    it('POST /api/auth/register를 호출하고 user를 반환한다', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: '홍길동' }
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockUser,
      } as Response)

      const result = await register({ email: 'test@example.com', password: '1234', name: '홍길동' })
      expect(result).toEqual(mockUser)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('이미 가입된 이메일이면 에러를 throw한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: '이미 사용 중인 이메일입니다.' }),
      } as Response)

      await expect(
        register({ email: 'dup@example.com', password: '1234', name: '홍길동' })
      ).rejects.toThrow('이미 사용 중인 이메일입니다.')
    })

    it('서버 오류 시 에러를 throw한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: '서버 오류' }),
      } as Response)

      await expect(
        register({ email: 'test@example.com', password: '1234', name: '홍길동' })
      ).rejects.toThrow('서버 오류')
    })
  })

  describe('login', () => {
    it('POST /api/auth/login을 호출하고 access_token과 user를 반환한다', async () => {
      const mockResponse = {
        access_token: 'jwt-token',
        user: { id: 1, email: 'test@example.com', name: '홍길동' },
      }
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response)

      const result = await login({ email: 'test@example.com', password: '1234' })
      expect(result.access_token).toBe('jwt-token')
      expect(result.user.email).toBe('test@example.com')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('비밀번호 불일치 시 에러를 throw한다', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' }),
      } as Response)

      await expect(
        login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('이메일 또는 비밀번호가 올바르지 않습니다.')
    })
  })
})
