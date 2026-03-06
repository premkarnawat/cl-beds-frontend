/**
 * User Profile Page
 * - View & edit display name / avatar
 * - Change password
 * - Theme & accent colour picker
 * - Danger zone: delete account
 */

import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ACCENT_COLORS, useTheme, type AccentColor } from '@/lib/theme'

export default function ProfilePage() {
  const { user, token, logout, refreshUser } = useAuth()
  const { theme, setTheme, accent, setAccent } = useTheme()
  const navigate = useNavigate()

  // Profile form
  const [fullName,   setFullName]   = useState(user?.full_name ?? '')
  const [avatarUrl,  setAvatarUrl]  = useState(user?.avatar_url ?? '')
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [pwMsg,      setPwMsg]      = useState<{ text: string; ok: boolean } | null>(null)
  const [savingPw,   setSavingPw]   = useState(false)

  // Delete account
  const [deletePw,    setDeletePw]    = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteMsg,   setDeleteMsg]   = useState<string | null>(null)
  const [deleting,    setDeleting]    = useState(false)
  const [showDelete,  setShowDelete]  = useState(false)

  if (!user || !token) return null

  // ── Save profile ──────────────────────────────────────────────────────
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      await profileApi.update(token, { full_name: fullName, avatar_url: avatarUrl || undefined })
      await refreshUser()
      setProfileMsg({ text: 'Profile updated successfully!', ok: true })
    } catch (err: unknown) {
      setProfileMsg({ text: (err as Error).message, ok: false })
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Change password ───────────────────────────────────────────────────
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPw !== confirmPw) { setPwMsg({ text: 'Passwords do not match', ok: false }); return }
    if (newPw.length < 8)   { setPwMsg({ text: 'Password must be at least 8 characters', ok: false }); return }
    setSavingPw(true)
    setPwMsg(null)
    try {
      await profileApi.changePassword(token, currentPw, newPw)
      setPwMsg({ text: 'Password changed successfully!', ok: true })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: unknown) {
      setPwMsg({ text: (err as Error).message, ok: false })
    } finally {
      setSavingPw(false)
    }
  }

  // ── Delete account ────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { setDeleteMsg('Type DELETE to confirm'); return }
    setDeleting(true)
    try {
      await profileApi.deleteAccount(token, deletePw)
      await logout()
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      setDeleteMsg((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  const initials = user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account details and preferences</p>
      </div>

      {/* ── Avatar + Profile form ──────────────────────────────────────── */}
      <Card title="Profile Information">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center
                            text-white text-xl font-bold flex-shrink-0 overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
                : initials}
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Avatar URL</label>
              <Input value={avatarUrl} onChange={setAvatarUrl} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
            <Input value={fullName} onChange={setFullName} placeholder="Your name" required />
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Email</label>
            <Input value={user.email} onChange={() => {}} disabled placeholder={user.email} />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed here.</p>
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Role</label>
            <span className="inline-block text-xs bg-slate-100 dark:bg-slate-800 text-slate-600
                             dark:text-slate-400 px-3 py-1 rounded-full capitalize">{user.role}</span>
          </div>

          {profileMsg && <Alert text={profileMsg.text} ok={profileMsg.ok} />}
          <SaveButton loading={savingProfile} label="Save Profile" />
        </form>
      </Card>

      {/* ── Appearance ────────────────────────────────────────────────── */}
      <Card title="Appearance">
        <div className="space-y-5">
          {/* Dark / Light toggle */}
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Theme Mode</p>
            <div className="flex gap-3">
              {(['dark', 'light'] as const).map(t => (
                <button key={t} onClick={() => setTheme(t)}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all
                              flex flex-col items-center gap-1 ${
                    theme === t
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}>
                  <span className="text-xl">{t === 'dark' ? '🌙' : '☀️'}</span>
                  <span className="capitalize">{t} Mode</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent colour */}
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Accent Colour</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(ACCENT_COLORS) as [AccentColor, typeof ACCENT_COLORS[AccentColor]][]).map(([key, val]) => (
                <button key={key} onClick={() => setAccent(key)}
                  title={val.name}
                  className={`w-9 h-9 rounded-full transition-all hover:scale-110
                              ${accent === key ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110' : ''}`}
                  style={{ background: val.hex, ringColor: val.hex }}
                  aria-label={val.name} />
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Current: <span className="font-medium">{ACCENT_COLORS[accent].name}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* ── Change Password ───────────────────────────────────────────── */}
      <Card title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Current Password</label>
            <Input type="password" value={currentPw} onChange={setCurrentPw} placeholder="••••••••" required />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">New Password</label>
            <Input type="password" value={newPw} onChange={setNewPw} placeholder="••••••••" required />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Confirm New Password</label>
            <Input type="password" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" required />
          </div>
          {pwMsg && <Alert text={pwMsg.text} ok={pwMsg.ok} />}
          <SaveButton loading={savingPw} label="Update Password" />
        </form>
      </Card>

      {/* ── Danger Zone ───────────────────────────────────────────────── */}
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">
          ⚠️ Danger Zone
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>

        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
            Delete My Account
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Enter your password</label>
              <Input type="password" value={deletePw} onChange={setDeletePw} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Type <strong>DELETE</strong> to confirm
              </label>
              <Input value={deleteConfirm} onChange={setDeleteConfirm} placeholder="DELETE" />
            </div>
            {deleteMsg && <p className="text-sm text-red-500">{deleteMsg}</p>}
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50
                           text-white rounded-lg text-sm font-medium transition-colors">
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
              <button onClick={() => { setShowDelete(false); setDeleteMsg(null) }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700
                           dark:text-slate-300 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', required = false, disabled = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  type?: string; required?: boolean; disabled?: boolean
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required} disabled={disabled}
      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100
                 placeholder-slate-400 focus:outline-none focus:border-indigo-500
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" />
  )
}

function Alert({ text, ok }: { text: string; ok: boolean }) {
  return (
    <div className={`px-3 py-2 rounded-lg text-sm ${
      ok ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
         : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
      {ok ? '✅' : '❌'} {text}
    </div>
  )
}

function SaveButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading}
      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50
                 text-white rounded-xl text-sm font-semibold transition-colors">
      {loading ? 'Saving…' : label}
    </button>
  )
}
