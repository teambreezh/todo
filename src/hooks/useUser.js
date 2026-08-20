import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useCallback } from 'react'
import toast from 'react-hot-toast'

export function useUser() {
  const user = useLiveQuery(() => db.user.toCollection().first())

  const updateUser = useCallback(async (updates) => {
    const u = await db.user.toCollection().first()
    if (!u) return
    await db.user.update(u.id, updates)
    toast.success('Profile updated')
  }, [])

  return { user, updateUser }
}
