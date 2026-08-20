import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import toast from 'react-hot-toast'

export function useSync() {
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | success | error

  const lastSync = useLiveQuery(async () => {
    const meta = await db.syncMeta.where('key').equals('lastSync').first()
    return meta ? new Date(meta.value) : null
  })

  const syncToCloud = useCallback(async () => {
    if (syncStatus === 'syncing') {
      toast('Sync already in progress', { icon: '⏳' })
      return
    }

    setSyncStatus('syncing')

    try {
      const unsyncedTasks = await db.tasks.where('synced').equals(0).toArray()

      if (unsyncedTasks.length === 0) {
        const user = await db.user.toCollection().first()
        if (!user) {
          setSyncStatus('idle')
          toast('Nothing to sync', { icon: '✓' })
          return
        }
      }

      const user = await db.user.toCollection().first()
      if (!user) throw new Error('No user profile found')

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, tasks: unsyncedTasks }),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || `Server error: ${response.status}`)
      }

      const data = await response.json()

      // Mark tasks as synced
      const ids = unsyncedTasks.map(t => t.id)
      await db.tasks.bulkUpdate(ids.map(id => ({ key: id, changes: { synced: true } })))

      // Save last sync timestamp
      const existing = await db.syncMeta.where('key').equals('lastSync').first()
      const now = new Date().toISOString()
      if (existing) {
        await db.syncMeta.update(existing.id, { value: now, updatedAt: new Date() })
      } else {
        await db.syncMeta.add({ key: 'lastSync', value: now, updatedAt: new Date() })
      }

      setSyncStatus('success')
      toast.success(`Synced ${data.syncedCount ?? unsyncedTasks.length} tasks`)
      setTimeout(() => setSyncStatus('idle'), 3000)
    } catch (err) {
      setSyncStatus('error')
      if (err.name === 'TimeoutError' || err.message.includes('fetch')) {
        toast.error('Network unavailable. Data saved locally.')
      } else {
        toast.error(`Sync failed: ${err.message}`)
      }
      setTimeout(() => setSyncStatus('idle'), 4000)
    }
  }, [syncStatus])

  return { syncStatus, syncToCloud, lastSync }
}
