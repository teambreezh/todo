import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export function useTasks(filter = 'all') {
  const tasks = useLiveQuery(async () => {
    let query = db.tasks.orderBy('createdAt').reverse()
    const all = await query.toArray()
    if (filter === 'active') return all.filter(t => !t.completed)
    if (filter === 'completed') return all.filter(t => t.completed)
    return all
  }, [filter])

  const addTask = useCallback(async ({ title, priority = 'medium', dueDate = null }) => {
    if (!title?.trim()) {
      toast.error('Task title cannot be empty')
      return null
    }
    const now = new Date()
    const id = await db.tasks.add({
      title: title.trim(),
      completed: false,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: now,
      updatedAt: now,
      synced: false,
    })
    return id
  }, [])

  const toggleTask = useCallback(async (id) => {
    const task = await db.tasks.get(id)
    if (!task) return
    await db.tasks.update(id, {
      completed: !task.completed,
      updatedAt: new Date(),
      synced: false,
    })
  }, [])

  const updateTask = useCallback(async (id, updates) => {
    if (updates.title !== undefined && !updates.title?.trim()) {
      toast.error('Task title cannot be empty')
      return
    }
    await db.tasks.update(id, {
      ...updates,
      updatedAt: new Date(),
      synced: false,
    })
  }, [])

  const deleteTask = useCallback(async (id) => {
    await db.tasks.delete(id)
  }, [])

  return { tasks: tasks || [], addTask, toggleTask, updateTask, deleteTask }
}

export function useAllTasks() {
  return useLiveQuery(() => db.tasks.toArray()) || []
}
