/**
 * Admin Overview Page
 * Platform-wide statistics and activity feed.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, type AdminStats, type SessionOut } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import LoadingSpinner from '@/components/Navbar'

export default function AdminOverview() {
  const { token } = useAuth()
  const [stats,    setStats]    = useState<AdminStats | null>(null)
  const [sessions, setSessions] = useState<SessionOut[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!token) return
    Promise.all([
      adminApi.getStats(token),
      adminApi.listAllSessions(token, 1),
    ]).then(([s, sess]) => {
      setStats(s)
      setSessions(sess.slice(0, 8))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  )

  const RISK_COLOR: Record<string, string> = {
    Low:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    Medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    High:   'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform health and user activity</p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon="👥" label="Total Users"       value={stats.total_users} />
          <StatCard icon="📋" label="Sessions Today"    value={stats.active_sessions_today} />
          <StatCard icon="🔴" label="High Risk Users"   value={stats.high_risk_users}
                    valueClass="text-red-600 dark:text-red-400" />
          <StatCard icon="📊" label="Total Sessions"    value={stats.total_sessions} />
          <StatCard icon="📝" label="Journal Entries"   value={stats.total_journal_entries} />
          <StatCard icon="💬" label="Chat Messages"     value={stats.total_chat_messages} />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/admin/users"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                     rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-400
                     dark:hover:border-indigo-600 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30
                          flex items-center justify-center text-2xl">👥</div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600
                          dark:group-hover:text-indigo-400 transition-colors">Manage Users</p>
            <p className="text-sm text-slate-500">Add, edit, or delete user accounts</p>
          </div>
          <span className="ml-auto text-slate-400">→</span>
        </Link>

        <Link to="/admin/sessions"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                     rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-400
                     dark:hover:border-indigo-600 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30
                          flex items-center justify-center text-2xl">📋</div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600
                          dark:group-hover:text-indigo-400 transition-colors">All Sessions</p>
            <p className="text-sm text-slate-500">View and manage monitoring sessions</p>
          </div>
          <span className="ml-auto text-slate-400">→</span>
        </Link>
      </div>

      {/* Recent sessions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Sessions</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sessions.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">No sessions yet.</p>
          )}
          {sessions.map(s => (
            <div key={s.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {s.label ?? 'Untitled Session'}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(s.started_at).toLocaleString()}
                </p>
              </div>
              {s.final_risk_level && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${RISK_COLOR[s.final_risk_level] ?? ''}`}>
                  {s.final_risk_level}
                </span>
              )}
            </div>
          ))}
        </div>
        {sessions.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
            <Link to="/admin/sessions" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              View all sessions →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, valueClass = 'text-slate-900 dark:text-white' }: {
  icon: string; label: string; value: number; valueClass?: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      </div>
      <p className={`text-3xl font-bold font-mono ${valueClass}`}>{value.toLocaleString()}</p>
    </div>
  )
}
