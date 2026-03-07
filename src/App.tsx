/**
 * CL-BEDS App Root — Premium Dark UI
 */
import { useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import { Navbar, Sidebar } from '@/components/Navbar'
import ChatWidget from '@/components/ChatWidget'
import LoadingSpinner from '@/components/LoadingSpinner'

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

function RootRedirect() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
}

function PageLoader() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#060612' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>??</div>
        <LoadingSpinner size="lg" />
      </div>
    </div>
  )
}

function UserShell() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/admin" replace />

  return (
    <div style={{ minHeight:'100vh', background:'#060612', color:'#fff', display:'flex', flexDirection:'column' }}>
      <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex:1, overflowY:'auto', position:'relative', zIndex:1 }}>
          <Outlet />
        </main>
      </div>
      <button
        onClick={() => setChatOpen(o => !o)}
        style={{
          position:'fixed', bottom:24, right:24, zIndex:40,
          background:'linear-gradient(135deg,#6366f1,#a855f7)',
          color:'#fff', borderRadius:'50%', width:52, height:52,
          border:'none', cursor:'pointer', fontSize:'1.4rem',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 8px 32px rgba(99,102,241,0.5)',
          transition:'transform 0.2s, box-shadow 0.2s'
        }}
        aria-label="Open AI coach"
      >??</button>
      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

function AdminShell() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div style={{ minHeight:'100vh', background:'#060612', color:'#fff', display:'flex', flexDirection:'column' }}>
      <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main style={{ flex:1, overflowY:'auto', position:'relative', zIndex:1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route index element={<RootRedirect />} />
            <Route element={<UserShell />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat"      element={<ChatPage />} />
              <Route path="/journal"   element={<JournalPage />} />
              <Route path="/profile"   element={<ProfilePage />} />
              <Route path="/settings"  element={<SettingsPage />} />
            </Route>
            <Route path="/admin" element={<AdminShell />}>
              <Route index           element={<AdminOverview />} />
              <Route path="users"    element={<AdminUsers />} />
              <Route path="sessions" element={<AdminSessions />} />
              <Route path="profile"  element={<AdminProfile />} />
            </Route>
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
