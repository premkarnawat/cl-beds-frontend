/**
 * CL-BEDS API Client
 * Covers: auth, profile, dashboard, chat, journal, admin
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ─── Types ────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string; refresh_token: string; token_type: string; expires_in: number
}
export interface UserOut {
  id: string; email: string; full_name: string; role: 'student' | 'admin'
  avatar_url?: string | null; is_active: boolean; created_at?: string
}
export interface SessionOut {
  id: string; user_id: string; label: string | null; started_at: string
  ended_at: string | null; final_risk_level: 'Low' | 'Medium' | 'High' | null
  final_risk_score: number | null
}
export interface RiskTrendPoint {
  timestamp: string; risk_score: number; risk_level: string
  cmes_index: number; hrv_stress: number; backspace_ratio: number
}
export interface SHAPDriver   { feature: string; impact: number }
export interface SHAPReport   { risk_level: string; confidence: number; top_drivers: SHAPDriver[]; session_id: string | null }
export interface ChatResponse { reply: string; session_id: string | null; tokens_used: number | null }
export interface ChatMessage  { role: 'user' | 'assistant'; content: string; timestamp?: string }
export interface JournalEntry {
  id: string; user_id: string; content: string; mood_score: number | null
  tags: string[] | null; detected_emotion: string | null; created_at: string
}
export interface AdminStats {
  total_users: number; active_sessions_today: number; high_risk_users: number
  total_sessions: number; total_journal_entries: number; total_chat_messages: number
}

// ─── HTTP helper ──────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(err.detail ?? `HTTP ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, password: string, full_name: string) =>
    request<UserOut>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, full_name }) }),
  login: (email: string, password: string) =>
    request<TokenResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  refresh: (refresh_token: string) =>
    request<TokenResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token }) }),
  me: (token: string) => request<UserOut>('/auth/me', {}, token),
  logout: (token: string) => request<void>('/auth/logout', { method: 'POST' }, token),
}

// ─── Profile ──────────────────────────────────────────────────────────────

export const profileApi = {
  update: (token: string, data: { full_name?: string; avatar_url?: string }) =>
    request<UserOut>('/profile/me', { method: 'PATCH', body: JSON.stringify(data) }, token),
  changePassword: (token: string, current_password: string, new_password: string) =>
    request<void>('/profile/change-password', {
      method: 'POST', body: JSON.stringify({ current_password, new_password }),
    }, token),
  deleteAccount: (token: string, password: string) =>
    request<void>('/profile/delete-account', {
      method: 'DELETE', body: JSON.stringify({ password }),
    }, token),
}

// ─── Dashboard ────────────────────────────────────────────────────────────

export const dashboardApi = {
  createSession: (token: string, label?: string) =>
    request<SessionOut>('/dashboard/sessions', { method: 'POST', body: JSON.stringify({ user_id: 'placeholder', label }) }, token),
  listSessions: (token: string, page = 1) =>
    request<SessionOut[]>(`/dashboard/sessions?page=${page}`, {}, token),
  getRiskTrend: (token: string, limit = 50) =>
    request<RiskTrendPoint[]>(`/dashboard/risk-trend?limit=${limit}`, {}, token),
  getLatestSHAP: (token: string) =>
    request<SHAPReport>('/dashboard/latest-shap', {}, token),
}

// ─── Chat ─────────────────────────────────────────────────────────────────

export const chatApi = {
  send: (token: string, content: string, session_id?: string) =>
    request<ChatResponse>('/chat', { method: 'POST', body: JSON.stringify({ content, session_id }) }, token),
  history: (token: string, page = 1) =>
    request<ChatMessage[]>(`/chat/history?page=${page}`, {}, token),
}

// ─── Journal ──────────────────────────────────────────────────────────────

export const journalApi = {
  create: (token: string, content: string, mood_score?: number, tags?: string[]) =>
    request<JournalEntry>('/journal', { method: 'POST', body: JSON.stringify({ content, mood_score, tags }) }, token),
  list: (token: string, page = 1) =>
    request<JournalEntry[]>(`/journal?page=${page}`, {}, token),
  delete: (token: string, id: string) =>
    request<void>(`/journal/${id}`, { method: 'DELETE' }, token),
}

// ─── Admin ────────────────────────────────────────────────────────────────

export const adminApi = {
  getStats: (token: string) =>
    request<AdminStats>('/admin/stats', {}, token),
  listUsers: (token: string, page = 1, search = '') =>
    request<UserOut[]>(`/admin/users?page=${page}&search=${encodeURIComponent(search)}`, {}, token),
  getUser: (token: string, userId: string) =>
    request<UserOut>(`/admin/users/${userId}`, {}, token),
  updateUser: (token: string, userId: string, data: Partial<Pick<UserOut, 'full_name' | 'role' | 'is_active'>>) =>
    request<UserOut>(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  resetUserPassword: (token: string, userId: string, new_password: string) =>
    request<void>(`/admin/users/${userId}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) }, token),
  deleteUser: (token: string, userId: string) =>
    request<void>(`/admin/users/${userId}`, { method: 'DELETE' }, token),
  listAllSessions: (token: string, page = 1) =>
    request<SessionOut[]>(`/admin/sessions?page=${page}`, {}, token),
  deleteSession: (token: string, sessionId: string) =>
    request<void>(`/admin/sessions/${sessionId}`, { method: 'DELETE' }, token),
}
