'use client'

import { useEffect, useState, useCallback } from 'react'
import { syncPendingPhotos, getPendingCount } from '@/lib/offline/queue'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number
    failed: number
  } | null>(null)

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount()
    setPendingCount(count)
  }, [])

  const sync = useCallback(async () => {
    if (!isOnline || isSyncing) return
    setIsSyncing(true)
    try {
      const result = await syncPendingPhotos()
      setLastSyncResult(result)
      await refreshPendingCount()
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, refreshPendingCount])

  useEffect(() => {
    refreshPendingCount()

    const handleOnline = () => {
      setIsOnline(true)
      // Dispara sync automaticamente ao reconectar
      sync()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { isOnline, pendingCount, isSyncing, lastSyncResult, sync, refreshPendingCount }
}
