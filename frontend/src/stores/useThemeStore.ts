import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggle: (userId: number) => void
  loadForUser: (userId: number) => void
  clearTheme: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  loadForUser: (userId) => {
    const stored = localStorage.getItem(`theme_${userId}`)
    const isDark = stored === 'dark'
    set({ isDark })
    document.documentElement.classList.toggle('dark', isDark)
  },
  toggle: (userId) => {
    set((state) => {
      const next = !state.isDark
      localStorage.setItem(`theme_${userId}`, next ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', next)
      return { isDark: next }
    })
  },
  clearTheme: () => {
    set({ isDark: false })
    document.documentElement.classList.remove('dark')
  },
}))
