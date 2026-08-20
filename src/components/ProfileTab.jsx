import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Check, User, Mail, BarChart2 } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useUser } from '../hooks/useUser'
import { useSync } from '../hooks/useSync'
import { format, subDays, isSameDay, isToday, differenceInCalendarDays } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

function CircularProgress({ percentage, size = 120 }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="#3b82f6" strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: 'var(--text-primary)', fontSize: '18px', fontWeight: 700, fontFamily: 'Inter' }}>
        {Math.round(percentage)}%
      </text>
    </svg>
  )
}

function getStreak(tasks) {
  const completedDates = [...new Set(
    tasks
      .filter(t => t.completed && t.updatedAt)
      .map(t => format(new Date(t.updatedAt), 'yyyy-MM-dd'))
  )].sort().reverse()

  if (!completedDates.length) return 0

  let streak = 0
  let current = new Date()

  for (const dateStr of completedDates) {
    const date = new Date(dateStr)
    const diff = differenceInCalendarDays(current, date)
    if (diff <= 1) {
      streak++
      current = date
    } else {
      break
    }
  }

  return streak
}

export default function ProfileTab() {
  const { user, updateUser } = useUser()
  const { lastSync } = useSync()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const allTasks = useLiveQuery(() => db.tasks.toArray()) || []

  const total = allTasks.length
  const completed = allTasks.filter(t => t.completed).length
  const active = total - completed
  const percentage = total > 0 ? (completed / total) * 100 : 0
  const streak = getStreak(allTasks)

  // Last 7 days bar chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i)
    const count = allTasks.filter(t =>
      t.completed && t.updatedAt && isSameDay(new Date(t.updatedAt), day)
    ).length
    return { label: format(day, 'EEE'), count }
  })

  const barData = {
    labels: last7.map(d => d.label),
    datasets: [{
      label: 'Completed',
      data: last7.map(d => d.count),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
      borderRadius: 6,
    }],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-muted)', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'var(--border)' },
        ticks: { color: 'var(--text-muted)', font: { size: 11 }, stepSize: 1 },
        border: { display: false },
      },
    },
  }

  const startEdit = () => {
    setEditName(user?.name || '')
    setEditEmail(user?.email || '')
    setEditing(true)
  }

  const saveEdit = () => {
    updateUser({ name: editName, email: editEmail })
    setEditing(false)
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Profile</h1>

      {/* User card */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="input-base text-sm"
                />
                <input
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  className="input-base text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="btn-primary py-1.5 text-xs flex items-center gap-1">
                    <Check size={13} /> Save
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-ghost py-1.5 text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                    {user?.name || 'Your Name'}
                  </h2>
                  <button onClick={startEdit} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Pencil size={14} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {user?.email || 'Add your email'}
                </p>
                {lastSync && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Last synced: {format(lastSync, 'MMM d, h:mm a')}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, color: '#3b82f6' },
          { label: 'Completed', value: completed, color: '#22c55e' },
          { label: 'Active', value: active, color: '#f59e0b' },
          { label: 'Streak 🔥', value: `${streak}d`, color: '#ef4444' },
        ].map(stat => (
          <motion.div
            key={stat.label}
            className="card text-center"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-2xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Circular progress + bar chart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card flex flex-col items-center gap-3">
          <h3 className="font-semibold text-sm self-start" style={{ color: 'var(--text-secondary)' }}>
            Completion Rate
          </h3>
          <CircularProgress percentage={percentage} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {completed} of {total} tasks done
          </p>
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
            Last 7 Days
          </h3>
          <div style={{ height: '130px' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}
