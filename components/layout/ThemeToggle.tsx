'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // 挂载前渲染占位,避免 hydration 闪烁
    return <div className="size-9" />
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? '切换到浅色模式' : '切换到墨夜模式'}
      title={isDark ? '切换到浅色模式' : '切换到墨夜模式'}
      className="flex size-9 items-center justify-center rounded-full border border-stone-200 bg-white/60 text-stone-500 transition-colors hover:border-amber-300 hover:text-amber-700 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-400 dark:hover:border-amber-600 dark:hover:text-amber-300"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
