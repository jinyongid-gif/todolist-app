import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { register, login } from '../../../api/auth.api'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useThemeStore } from '../../../stores/useThemeStore'

export function useRegisterMutation() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (payload: Parameters<typeof register>[0]) => register(payload),
    onSuccess: () => navigate('/login'),
  })
}

export function useLoginMutation() {
  const { setToken, setUser } = useAuthStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (payload: Parameters<typeof login>[0]) => login(payload),
    onSuccess: (data) => {
      setToken(data.access_token)
      setUser(data.user)
      useThemeStore.getState().loadForUser(data.user.id)
      navigate('/todos')
    },
  })
}
