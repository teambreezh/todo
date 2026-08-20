import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Calendar, User, Sun, Moon, Cloud, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useSync } from '../hooks/useSync'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { format } from 'date-fns'
import TodayTab from './TodayTab'
import CalendarTab from './CalendarTab'
import ProfileTab from './ProfileTab'

const tabs = [
  { id: 'today', label: 'Today', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'profile', label: 'Profile', icon: User },
]

function SyncButton({ syncStatus, syncToCloud, lastSync }) {
  const icons = {
    idle: <Cloud size={15} />,
    syncing: <Loader2 size={15} className="animate-spin" />,
    success: <CheckCircle2 size={15} />,
    error: <XCircle size={15} />,
  }
  const labels = {
    idle: 'Sync to Cloud',
    syncing: 'Syncing...',
    success: 'Synced ✓',
    error: 'Sync Failed',
  }
  const colors = {
    idle: 'btn-primary',
    syncing: 'btn-primary opacity-70 cursor-not-allowed',
    success: 'px-4 py-2 rounded-xl font-medium text-sm bg-green-500 text-white',
    error: 'px-4 py-2 rounded-xl font-medium text-sm bg-red-500 text-white',
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={syncToCloud}
        disabled={syncStatus === 'syncing'}
        className={`flex items-center gap-2 ${colors[syncStatus]} transition-all`}
      >
        {icons[syncStatus]}
        <span>{labels[syncStatus]}</span>
      </button>
      {lastSync && (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Last sync: {format(lastSync, 'MMM d, h:mm a')}
        </span>
      )}
    </div>
  )
}

export default function Layout() {
  const { theme, toggleTheme, activeTab, setActiveTab } = useApp()
  const { syncStatus, syncToCloud, lastSync } = useSync()

  const unsyncedCount = useLiveQuery(() => db.tasks.where('synced').equals(0).count()) || 0

  const TabContent = {
    today: TodayTab,
    calendar: CalendarTab,
    profile: ProfileTab,
  }[activeTab]

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center">
              <CheckSquare size={16} className="text-white" />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
              TaskFlow
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-item w-full ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.id === 'today' && unsyncedCount > 0 && !isActive && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-mono">
                    {unsyncedCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
          <SyncButton syncStatus={syncStatus} syncToCloud={syncToCloud} lastSync={lastSync} />
          <button
            onClick={toggleTheme}
            className="btn-ghost w-full flex items-center gap-2"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <CheckSquare size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>TaskFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost p-2">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <SyncButton syncStatus={syncStatus} syncToCloud={syncToCloud} lastSync={lastSync} />
          </div>
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <TabContent />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex border-t"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative"
              style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.id === 'today' && unsyncedCount > 0 && (
                <span className="absolute top-2 right-[calc(50%-18px)] w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-mono">
                  {unsyncedCount > 9 ? '9+' : unsyncedCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
