/**
 * Admin Users Page
 * Full CRUD: list, search, add, edit (name/role/status), reset password, delete.
 */

import { useEffect, useRef, useState } from 'react'
import { adminApi, type UserOut } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import LoadingSpinner from '@/components/Navbar'

type ModalMode = 'edit' | 'add' | 'reset-pw' | 'delete' | null

export default function AdminUsers() {
  const { token } = useAuth()
  const [users,   setUsers]   = useState<UserOut[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [modal,   setModal]   = useState<ModalMode>(null)
  const [selected, setSelected] = useState<UserOut | null>(null)
  const [toast,   setToast]   = useState<{ text: string; ok: boolean } | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const loadUsers = async (q = search, p = page) => {
    if (!token) return
    setLoading(true)
    try {
      const data = await adminApi.listUsers(token, p, q)
      setUsers(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [page])  // eslint-disable-line

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); loadUsers(search, 1) }, 400)
  }, [search])  // eslint-disable-line

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const openModal = (mode: ModalMode, user?: UserOut) => {
    setSelected(user ?? null)
    setModal(mode)
  }

  const closeModal = () => { setModal(null); setSelected(null) }

  const handleDeleteUser = async (userId: string) => {
    if (!token) return
    try {
      await adminApi.deleteUser(token, userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      showToast('User deleted successfully', true)
    } catch (e: unknown) { showToast((e as Error).message, false) }
    closeModal()
  }

  const handleUpdateUser = async (userId: string, data: Partial<UserOut>) => {
    if (!token) return
    try {
      const updated = await adminApi.updateUser(token, userId, data)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u))
      showToast('User updated', true)
    } catch (e: unknown) { showToast((e as Error).message, false) }
    closeModal()
  }

  const handleAddUser = async (email: string, password: string, full_name: string, role: string) => {
    if (!token) return
    // Admin creates user via the normal register endpoint
    try {
      const { authApi } = await import('@/lib/api')
      const newUser = await authApi.register(email, password, full_name)
      if (role === 'admin') await adminApi.updateUser(token, newUser.id, { role: 'admin' })
      showToast('User created successfully', true)
      loadUsers()
    } catch (e: unknown) { showToast((e as Error).message, false) }
    closeModal()
  }

  const handleResetPassword = async (userId: string, newPw: string) => {
    if (!token) return
    try {
      await adminApi.resetUserPassword(token, userId, newPw)
      showToast('Password reset successfully', true)
    } catch (e: unknown) { showToast((e as Error).message, false) }
    closeModal()
  }

  const ROLE_BADGE: Record<string, string> = {
    admin:   'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    student: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                         transition-all animate-fade-in ${toast.ok
          ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? '✅' : '❌'} {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Users</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage all user accounts
          </p>
        </div>
        <button onClick={() => openModal('add')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl
                     text-sm font-semibold transition-colors flex items-center gap-2">
          <span>+</span> Add User
        </button>
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍  Search by name or email…"
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                   rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100
                   placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors" />

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                      rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : users.length === 0 ? (
          <p className="text-center text-slate-500 py-12">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left">
                <tr>
                  {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500
                                           dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center
                                        text-white text-xs font-bold flex-shrink-0">
                          {u.full_name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{u.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role] ?? ''}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.is_active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ActionBtn label="Edit"     onClick={() => openModal('edit', u)} />
                        <ActionBtn label="Reset PW" onClick={() => openModal('reset-pw', u)} />
                        <ActionBtn label="Delete" danger onClick={() => openModal('delete', u)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t
                        border-slate-100 dark:border-slate-800">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="text-sm text-indigo-600 dark:text-indigo-400 disabled:opacity-30 hover:underline">
            ← Previous
          </button>
          <span className="text-xs text-slate-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20}
            className="text-sm text-indigo-600 dark:text-indigo-400 disabled:opacity-30 hover:underline">
            Next →
          </button>
        </div>
      </div>

      {/* Modals */}
      {modal === 'edit'     && selected && <EditUserModal user={selected} onSave={handleUpdateUser} onClose={closeModal} />}
      {modal === 'add'      && <AddUserModal onAdd={handleAddUser} onClose={closeModal} />}
      {modal === 'reset-pw' && selected && <ResetPwModal user={selected} onReset={handleResetPassword} onClose={closeModal} />}
      {modal === 'delete'   && selected && <DeleteModal user={selected} onConfirm={handleDeleteUser} onClose={closeModal} />}
    </div>
  )
}

// ─── Action button ─────────────────────────────────────────────────────────

function ActionBtn({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
        danger
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
      }`}>
      {label}
    </button>
  )
}

// ─── Modal base ───────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                      rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b
                        border-slate-100 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700
                                               dark:hover:text-slate-200 text-xl">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function MInput({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                   rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100
                   placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors" />
    </div>
  )
}

// ─── Edit User Modal ──────────────────────────────────────────────────────

function EditUserModal({ user, onSave, onClose }: {
  user: UserOut; onSave: (id: string, data: Partial<UserOut>) => void; onClose: () => void
}) {
  const [name,     setName]     = useState(user.full_name)
  const [role,     setRole]     = useState<'student' | 'admin'>(user.role)
  const [isActive, setIsActive] = useState(user.is_active)

  return (
    <Modal title="Edit User" onClose={onClose}>
      <MInput label="Full Name" value={name} onChange={setName} />
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Role</label>
        <select value={role} onChange={e => setRole(e.target.value as 'student' | 'admin')}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                     rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100
                     focus:outline-none focus:border-indigo-500">
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <label className="relative inline-flex h-5 w-10 cursor-pointer items-center">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="sr-only peer" />
          <div className="h-5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 peer-checked:bg-indigo-600
                          after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4
                          after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
        </label>
        <span className="text-sm text-slate-700 dark:text-slate-300">Account Active</span>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(user.id, { full_name: name, role, is_active: isActive })}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold">
          Save Changes
        </button>
        <button onClick={onClose}
          className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                     py-2.5 rounded-xl text-sm font-medium hover:opacity-80">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

// ─── Add User Modal ───────────────────────────────────────────────────────

function AddUserModal({ onAdd, onClose }: {
  onAdd: (email: string, password: string, name: string, role: string) => void; onClose: () => void
}) {
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [pw,    setPw]    = useState('')
  const [role,  setRole]  = useState('student')

  return (
    <Modal title="Add New User" onClose={onClose}>
      <MInput label="Full Name"    value={name}  onChange={setName}  placeholder="Jane Smith" />
      <MInput label="Email"        value={email} onChange={setEmail} placeholder="jane@example.com" />
      <MInput label="Password"     value={pw}    onChange={setPw}    type="password" placeholder="Min 8 chars" />
      <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Role</label>
        <select value={role} onChange={e => setRole(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                     rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100
                     focus:outline-none focus:border-indigo-500">
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={() => onAdd(email, pw, name, role)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold">
          Create User
        </button>
        <button onClick={onClose}
          className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                     py-2.5 rounded-xl text-sm font-medium hover:opacity-80">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

// ─── Reset Password Modal ─────────────────────────────────────────────────

function ResetPwModal({ user, onReset, onClose }: {
  user: UserOut; onReset: (id: string, pw: string) => void; onClose: () => void
}) {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')

  const submit = () => {
    if (pw.length < 8) { setErr('Min 8 characters'); return }
    if (pw !== confirm) { setErr('Passwords do not match'); return }
    onReset(user.id, pw)
  }

  return (
    <Modal title={`Reset Password — ${user.full_name}`} onClose={onClose}>
      <MInput label="New Password"     value={pw}      onChange={setPw}      type="password" placeholder="••••••••" />
      <MInput label="Confirm Password" value={confirm} onChange={setConfirm} type="password" placeholder="••••••••" />
      {err && <p className="text-sm text-red-500">{err}</p>}
      <div className="flex gap-2 pt-2">
        <button onClick={submit}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold">
          Reset Password
        </button>
        <button onClick={onClose}
          className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                     py-2.5 rounded-xl text-sm font-medium hover:opacity-80">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────

function DeleteModal({ user, onConfirm, onClose }: {
  user: UserOut; onConfirm: (id: string) => void; onClose: () => void
}) {
  const [confirm, setConfirm] = useState('')
  return (
    <Modal title="Delete User" onClose={onClose}>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Permanently delete <strong className="text-slate-900 dark:text-white">{user.full_name}</strong> and
        all their data (sessions, journal entries, chat logs)?
        <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">This cannot be undone.</span>
      </p>
      <MInput label={`Type "${user.email}" to confirm`} value={confirm} onChange={setConfirm} placeholder={user.email} />
      <div className="flex gap-2 pt-2">
        <button onClick={() => confirm === user.email && onConfirm(user.id)} disabled={confirm !== user.email}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold">
          Delete User
        </button>
        <button onClick={onClose}
          className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                     py-2.5 rounded-xl text-sm font-medium hover:opacity-80">
          Cancel
        </button>
      </div>
    </Modal>
  )
}
