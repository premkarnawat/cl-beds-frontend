/**
 * Navbar, Sidebar, LoadingSpinner – updated with theme toggle + user menu
 */

import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'

// ─── Navbar ───────────────────────────────────────────────────────────────

interface NavbarProps { onMenuToggle: () => void }

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout, isAdmin } = useAuth()
  const { theme, toggleTheme }    = useTheme()
  const [dropOpen, setDropOpen]   = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const initials = user?.full_name
    ?.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between
                        h-14 px-4 bg-white/80 dark:bg-slate-900/80
                        backdrop-blur border-b border-slate-200 dark:border-slate-800">

      {/* Hamburger */}
      <button onClick={onMenuToggle}
        className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900
                   dark:hover:text-white p-1 rounded"
        aria-label="Toggle sidebar">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <Link to={isAdmin ? '/admin' : '/dashboard'}
        className="flex items-center gap-2">
        <span className="text-xl">🧠</span>
        <span className="font-bold text-slate-900 dark:text-white hidden sm:block">CL-BEDS</span>
        {isAdmin && (
          <span className="hidden md:block text-xs bg-violet-100 dark:bg-violet-900/40
                           text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        )}
      </Link>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900
                     dark:text-slate-400 dark:hover:text-white
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* User avatar dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropOpen(o => !o)}
            className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500
                       flex items-center justify-center text-white text-xs font-bold
                       hover:ring-2 hover:ring-indigo-400 transition-all"
            aria-label="User menu"
          >
            {user?.avatar_url
              ? <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
              : initials}
          </button>

          {dropOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800
                            border border-slate-200 dark:border-slate-700 rounded-xl
                            shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <DropItem to={isAdmin ? '/admin/profile' : '/profile'} icon="👤"
                  label="My Profile" onClick={() => setDropOpen(false)} />
                <DropItem to={isAdmin ? '/admin/profile' : '/settings'} icon="⚙️"
                  label="Settings" onClick={() => setDropOpen(false)} />
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                <button
                  onClick={() => { setDropOpen(false); logout() }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm
                             text-red-600 dark:text-red-400 hover:bg-red-50
                             dark:hover:bg-red-900/20 transition-colors"
                >
                  <span>🚪</span> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function DropItem({ to, icon, label, onClick }: {
  to: string; icon: string; label: string; onClick: () => void
}) {
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm
                 text-slate-700 dark:text-slate-300
                 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <span>{icon}</span>{label}
    </Link>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────

interface SidebarProps { isOpen: boolean; onClose: () => void }

const USER_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/chat',      label: 'AI Coach',  icon: '🧠' },
  { path: '/journal',   label: 'Journal',   icon: '📝' },
  { path: '/profile',   label: 'Profile',   icon: '👤' },
  { path: '/settings',  label: 'Settings',  icon: '⚙️'  },
]

const ADMIN_NAV = [
  { path: '/admin',          label: 'Overview',  icon: '📊' },
  { path: '/admin/users',    label: 'Users',     icon: '👥' },
  { path: '/admin/sessions', label: 'Sessions',  icon: '📋' },
  { path: '/admin/profile',  label: 'My Profile',icon: '👤' },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const { isAdmin } = useAuth()
  const navItems = isAdmin ? ADMIN_NAV : USER_NAV

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] z-30 w-60
                         bg-white dark:bg-slate-900
                         border-r border-slate-200 dark:border-slate-800 flex flex-col
                         transform transition-transform duration-200
                         ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                         lg:translate-x-0 lg:static lg:h-full`}>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path)
            return (
              <Link key={item.path} to={item.path} onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                            font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}>
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-400 text-center">CL-BEDS v1.0</p>
        </div>
      </aside>
    </>
  )
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string }

export default function LoadingSpinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700
                     border-t-indigo-500 ${sizes[size]} ${className}`}
      role="status" aria-label="Loading" />
  )
}
