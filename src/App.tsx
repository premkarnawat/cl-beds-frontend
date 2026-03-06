/**
 * CL-BEDS App Root
 * - AuthProvider + ThemeProvider
 * - User routes: /dashboard, /chat, /journal, /profile, /settings
 * - Admin routes: /admin, /admin/users, /admin/sessions, /admin/profile
 * - Role-based redirect on login
 */

import { useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import { Navbar, Sidebar } from '@/components/Navbar'
import ChatWidget from '@/components/ChatWidget'
import LoadingSpinner from '@/components/Navbar'

// Pages — User
import LoginPage     from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
import ChatPage      from '@/pages/Chat'
import JournalPage   from '@/pages/Journal'
import ProfilePage   from '@/pages/Profile'
import SettingsPage  from '@/pages/Settings'

// Pages — Admin
import AdminOverview  from '@/pages/admin/AdminOverview'
import AdminUsers     from '@/pages/admin/AdminUsers'
import AdminSessions  from '@/pages/admin/AdminSessions'
import AdminProfile   from '@/pages/admin/AdminProfile'

// ─── Smart root redirect based on role ───────────────────────────────────

function RootRedirect() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
}

// ─── Protected shell for USER routes ─────────────────────────────────────

function UserShell() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen,    setChatOpen]    = useState(false)

  if (isLoading) return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-4xl">🧠</div>
        <LoadingSpinner size="lg" />
      </div>
    </div>
  )

  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Admins who land on /dashboard get pushed to /admin
  if (isAdmin) return <Navigate to="/admin" replace />

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col transition-colors">
      <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating AI coach button */}
      <button onClick={() => setChatOpen(o => !o)}
        className="fixed bottom-4 right-4 z-40 bg-indigo-600 hover:bg-indigo-700
                   text-white rounded-full w-12 h-12 flex items-center justify-center
                   shadow-lg transition-transform hover:scale-110 text-xl"
        aria-label="Open AI coach">
        🧠
      </button>
      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

// ─── Protected shell for ADMIN routes ────────────────────────────────────

function AdminShell() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isLoading) return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col transition-colors">
      <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Smart root */}
            <Route index element={<RootRedirect />} />

            {/* User routes */}
            <Route element={<UserShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat"      element={<ChatPage />} />
              <Route path="/journal"   element={<JournalPage />} />
              <Route path="/profile"   element={<ProfilePage />} />
              <Route path="/settings"  element={<SettingsPage />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<AdminShell />}>
              <Route index                  element={<AdminOverview />} />
              <Route path="users"           element={<AdminUsers />} />
              <Route path="sessions"        element={<AdminSessions />} />
              <Route path="profile"         element={<AdminProfile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
