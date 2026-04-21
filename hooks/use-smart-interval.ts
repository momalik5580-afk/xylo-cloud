'use client'

import { useEffect, useCallback } from 'react'

/**
 * useSmartInterval — a drop-in replacement for setInterval in React components.
 * Uses useCallback to stabilize the callback reference.
 */
export function useSmartInterval(callback: () => void, delayMs: number) {
  // Stabilize the callback
  const stableCallback = useCallback(callback, [callback])

  useEffect(() => {
    if (delayMs <= 0) return

    let intervalId: NodeJS.Timeout | null = null

    const start = () => {
      if (intervalId !== null) return
      intervalId = setInterval(() => {
        stableCallback()
      }, delayMs)
    }

    const stop = () => {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop()
      } else {
        stableCallback()
        start()
      }
    }

    // Start immediately if tab is visible
    if (!document.hidden) {
      start()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [delayMs, stableCallback])
}