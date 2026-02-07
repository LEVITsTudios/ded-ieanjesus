import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  // Inicializar con un valor que no cause hidratación incorrecta
  const [theme, setTheme] = useState<Theme | undefined>(undefined)
  const [mounted, setMounted] = useState(false)

  // Cargar tema al iniciar (solo cliente)
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (stored) {
      setTheme(stored)
      applyTheme(stored)
    } else {
      const defaultTheme: Theme = systemDark ? 'dark' : 'light'
      setTheme(defaultTheme)
      applyTheme(defaultTheme)
    }

    setMounted(true)
  }, [])

  function applyTheme(t: Theme) {
    const html = document.documentElement
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    if (isDark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  function toggleTheme() {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  function setThemeValue(newTheme: Theme) {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  return {
    theme,
    toggleTheme,
    setTheme: setThemeValue,
    mounted,
  }
}
