import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'

export default function CalendarTab() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const allTasks = useLiveQuery(() => db.tasks.toArray()) || []

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const tasksOnDate = (date) =>
    allTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date))

  const selectedTasks = tasksOnDate(selectedDate)

  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Calendar</h1>

      <div className="card space-y-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="btn-ghost p-2">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button onClick={nextMonth} className="btn-ghost p-2">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'var(--text-muted)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dayTasks = tasksOnDate(day)
            const isSelected = isSameDay(day, selectedDate)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isTodayDate = isToday(day)
            const hasCompleted = dayTasks.some(t => t.completed)
            const hasPending = dayTasks.some(t => !t.completed)

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className="relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all"
                style={{
                  color: !isCurrentMonth ? 'var(--text-muted)' :
                    isSelected ? '#ffffff' :
                      isTodayDate ? 'var(--accent)' : 'var(--text-primary)',
                  background: isSelected ? 'var(--accent)' :
                    isTodayDate && !isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                  opacity: !isCurrentMonth ? 0.35 : 1,
                }}
              >
                {format(day, 'd')}
                {/* Task dots */}
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasPending && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{
                        background: isSelected ? 'rgba(255,255,255,0.7)' : '#f59e0b'
                      }} />
                    )}
                    {hasCompleted && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{
                        background: isSelected ? 'rgba(255,255,255,0.7)' : '#22c55e'
                      }} />
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day tasks */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
          {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMMM d, yyyy')} — {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
        </h3>

        <AnimatePresence>
          {selectedTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
              style={{ color: 'var(--text-muted)' }}
            >
              <p className="text-sm">No tasks scheduled for this day</p>
            </motion.div>
          ) : (
            selectedTasks.map(task => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{
                    borderColor: task.completed ? '#22c55e' : 'var(--text-muted)',
                    background: task.completed ? '#22c55e' : 'transparent',
                  }}
                >
                  {task.completed && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{
                      color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: task.completed ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </p>
                </div>
                <span className={`priority-${task.priority}`}>{task.priority}</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
