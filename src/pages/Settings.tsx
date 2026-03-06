/**
 * Settings Page – monitoring preferences + theme (links to Profile for account)
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme, ACCENT_COLORS, type AccentColor } from '@/lib/theme'
import { useAuth } from '@/lib/auth'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme, accent, setAccent } = useTheme()

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          App preferences and monitoring configuration
        </p>
      </div>

      {/* Quick profile link */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {user?.full_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate">{user?.full_name}</p>
          <p className="text-sm text-slate-500 truncate">{user?.email}</p>
        </div>
        <Link to="/profile"
          className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex-shrink-0">
          Edit Profile →
        </Link>
      </div>

      {/* Theme */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Appearance</h2>

        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Mode</p>
          <div className="flex gap-3">
            {(['dark', 'light'] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  theme === t
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                <span className="text-xl">{t === 'dark' ? '🌙' : '☀️'}</span>
                <span className="capitalize">{t} Mode</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Accent Colour</p>
          <div className="flex gap-3 flex-wrap">
            {(Object.entries(ACCENT_COLORS) as [AccentColor, typeof ACCENT_COLORS[AccentColor]][]).map(([key, val]) => (
              <button key={key} onClick={() => setAccent(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  accent === key
                    ? 'border-current'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
                style={accent === key ? { borderColor: val.hex, color: val.hex } : {}}>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: val.hex }} />
                {val.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Monitoring toggles */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Monitoring Sensors</h2>
        <SettingRow label="Keystroke Tracking"   desc="Typing dynamics for cognitive load analysis" defaultOn />
        <SettingRow label="Mouse Tracking"        desc="Mouse movement pattern analysis"             defaultOn />
        <SettingRow label="NLP Emotion Detection" desc="Analyse text for emotional signals"          defaultOn />
        <SettingRow label="rPPG Heart Rate"       desc="Webcam / front camera heart rate sensing"   defaultOn={false} />
        <SettingRow label="Auto-send to AI Coach" desc="Automatically share risk scores with coach" defaultOn />
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Notifications</h2>
        <SettingRow label="High-Risk Alerts"    desc="Notify when burnout risk reaches High"   defaultOn />
        <SettingRow label="Daily Summary"       desc="End-of-day wellbeing report"              defaultOn={false} />
        <SettingRow label="Coach Suggestions"   desc="Proactive tips from the AI coach"        defaultOn />
      </div>

      {/* About */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">About</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          CL-BEDS v1.0 — Research prototype for cognitive load and burnout monitoring.
          Not a medical device or diagnostic tool.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
          Stack: FastAPI · PyTorch · RoBERTa · React · Supabase
        </p>
      </div>
    </div>
  )
}

function SettingRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <label className="relative flex-shrink-0 inline-flex h-5 w-10 cursor-pointer items-center mt-0.5">
        <input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} className="sr-only peer" />
        <div className="h-5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 peer-checked:bg-indigo-600
                        after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4
                        after:rounded-full after:bg-white after:transition-all
                        peer-checked:after:translate-x-5 transition-colors" />
      </label>
    </div>
  )
}
