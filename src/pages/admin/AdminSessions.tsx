/**
 * Admin Sessions Page
 * View all monitoring sessions across all users. Delete sessions.
 */

import { useEffect, useState } from 'react'
import { adminApi, type SessionOut } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import LoadingSpinner from '@/components/Navbar'

const RISK_COLOR: Record<string, string> = {
  Low:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  Medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  High:   'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
}

export default function AdminSessions() {
  const { token } = useAuth()
  const [sessions, setSessions] = useState<SessionOut[]>([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [toast,    setToast]    = useState<{ text: string; ok: boolean } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async (p = page) => {
    if (!token) return
    setLoading(true)
    try { setSessions(await adminApi.listAllSessions(token, p)) }
    catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page])  // eslint-disable-line

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Delete this session and all its data?')) return
    setDeleting(id)
    try {
      await adminApi.deleteSession(token, id)
      setSessions(prev => prev.filter(s => s.id !== id))
      showToast('Session deleted', true)
    } catch (e: unknown) { showToast((e as Error).message, false) }
    finally { setDeleting(null) }
  }

  const duration = (s: SessionOut): string => {
    if (!s.ended_at) return 'Active'
    const ms = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()
    const mins = Math.round(ms / 60_000)
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${
          toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? '✅' : '❌'} {toast.text}
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">All Sessions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Monitor sessions across all users
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No sessions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {['Label', 'Started', 'Duration', 'Risk', 'Score', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold
                                           text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 max-w-[160px] truncate">
                      {s.label ?? 'Untitled'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                      {new Date(s.started_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                      {duration(s)}
                    </td>
                    <td className="px-4 py-3">
                      {s.final_risk_level ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLOR[s.final_risk_level]}`}>
                          {s.final_risk_level}
                        </span>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {s.final_risk_score != null ? (s.final_risk_score * 100).toFixed(1) + '%' : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50
                                   dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors
                                   disabled:opacity-40">
                        {deleting === s.id ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="text-sm text-indigo-600 dark:text-indigo-400 disabled:opacity-30 hover:underline">
            ← Previous
          </button>
          <span className="text-xs text-slate-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={sessions.length < 20}
            className="text-sm text-indigo-600 dark:text-indigo-400 disabled:opacity-30 hover:underline">
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
