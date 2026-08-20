import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Pencil, Check, X, Calendar, CheckSquare } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { format, isToday, isPast } from 'date-fns'

const PRIORITY_OPTIONS = ['low', 'medium', 'high']

function PriorityBadge({ priority }) {
  return <span className={`priority-${priority}`}>{priority}</span>
}

function TaskItem({ task, onToggle, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editPriority, setEditPriority] = useState(task.priority)
  const [editDue, setEditDue] = useState(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '')
  const inputRef = useRef(null)

  const startEdit = () => {
    setEditTitle(task.title)
    setEditPriority(task.priority)
    setEditDue(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const saveEdit = () => {
    onUpdate(task.id, {
      title: editTitle,
      priority: editPriority,
      dueDate: editDue ? new Date(editDue) : null,
    })
    setEditing(false)
  }

  const cancelEdit = () => setEditing(false)

  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = dueDateObj && !task.completed && isPast(dueDateObj) && !isToday(dueDateObj)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
      className="group flex items-start gap-3 p-4 rounded-xl border transition-all"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
        style={{
          borderColor: task.completed ? 'var(--accent)' : 'var(--text-muted)',
          background: task.completed ? 'var(--accent)' : 'transparent',
        }}
      >
        {task.completed && <Check size={11} className="text-white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <input
              ref={inputRef}
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
              className="input-base text-sm"
            />
            <div className="flex gap-2 flex-wrap">
              <select
                value={editPriority}
                onChange={e => setEditPriority(e.target.value)}
                className="input-base text-xs py-1.5 w-auto"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
              <input
                type="date"
                value={editDue}
                onChange={e => setEditDue(e.target.value)}
                className="input-base text-xs py-1.5 w-auto"
              />
              <button onClick={saveEdit} className="btn-primary py-1.5 text-xs flex items-center gap-1">
                <Check size={13} /> Save
              </button>
              <button onClick={cancelEdit} className="btn-ghost py-1.5 text-xs flex items-center gap-1">
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p
              className="text-sm font-medium leading-snug"
              style={{
                color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: task.completed ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <PriorityBadge priority={task.priority} />
              {dueDateObj && (
                <span
                  className="text-xs flex items-center gap-1"
                  style={{ color: isOverdue ? '#ef4444' : 'var(--text-muted)' }}
                >
                  <Calendar size={11} />
                  {format(dueDateObj, 'MMM d')}
                  {isOverdue && ' • Overdue'}
                </span>
              )}
              {!task.synced && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>• unsaved</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={startEdit} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
            <Pencil size={14} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
            <Trash2 size={14} style={{ color: '#ef4444' }} />
          </button>
        </div>
      )}
    </motion.li>
  )
}

export default function TodayTab() {
  const [filter, setFilter] = useState('all')
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDue, setNewDue] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { tasks, addTask, toggleTask, updateTask, deleteTask } = useTasks(filter)

  const handleAdd = async (e) => {
    e.preventDefault()
    const id = await addTask({ title: newTitle, priority: newPriority, dueDate: newDue || null })
    if (id) {
      setNewTitle('')
      setNewPriority('medium')
      setNewDue('')
      setShowForm(false)
    }
  }

  const today = format(new Date(), 'EEEE, MMMM d')
  const completedCount = tasks.filter(t => t.completed).length
  const totalCount = tasks.length

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{today}</p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Today</h1>
        {totalCount > 0 && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {completedCount} of {totalCount} tasks completed
          </p>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <motion.div
            className="h-full rounded-full bg-blue-500"
            animate={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Add Task */}
      <div className="card">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-3 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
              <Plus size={16} className="text-white" />
            </div>
            Add a new task...
          </button>
        ) : (
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              autoFocus
              type="text"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="input-base"
            />
            <div className="flex gap-2 flex-wrap">
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                className="input-base w-auto text-sm py-2"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)} Priority</option>
                ))}
              </select>
              <input
                type="date"
                value={newDue}
                onChange={e => setNewDue(e.target.value)}
                className="input-base w-auto text-sm py-2"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Plus size={15} /> Add Task
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
        {['all', 'active', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              background: filter === f ? 'var(--bg-card)' : 'transparent',
              color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      <ul className="space-y-2">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <motion.li
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
              style={{ color: 'var(--text-muted)' }}
            >
              <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {filter === 'completed' ? 'No completed tasks yet' :
                  filter === 'active' ? 'No active tasks' : 'No tasks yet — add one above'}
              </p>
            </motion.li>
          ) : (
            tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onUpdate={updateTask}
                onDelete={deleteTask}
              />
            ))
          )}
        </AnimatePresence>
      </ul>
    </div>
  )
}


