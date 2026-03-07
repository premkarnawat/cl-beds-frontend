/**
 * Admin Overview — Premium Glassmorphism UI
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, type AdminStats, type SessionOut } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { GlassCard, PageWrap, PageHeader, Badge, SectionTitle, Spinner } from '@/components/GlassUI'

export default function AdminOverview() {
  const { token } = useAuth()
  const [stats,    setStats]    = useState<AdminStats | null>(null)
  const [sessions, setSessions] = useState<SessionOut[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!token) return
    Promise.all([adminApi.getStats(token), adminApi.listAllSessions(token, 1)])
      .then(([s, sess]) => { setStats(s); setSessions(sess.slice(0, 8)) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
      <Spinner size={40} />
    </div>
  )

  const riskBadge = (r:string) => r==='High'?'red':r==='Medium'?'yellow':'green'

  return (
    <PageWrap>
      <PageHeader title="Admin Overview" subtitle="Platform health and user activity" />

      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:16 }}>
          {[
            { icon:'??', label:'Total Users',      value:stats.total_users,             color:undefined },
            { icon:'??', label:'Sessions Today',   value:stats.active_sessions_today,   color:undefined },
            { icon:'??', label:'High Risk Users',  value:stats.high_risk_users,         color:'#fca5a5' },
            { icon:'??', label:'Total Sessions',   value:stats.total_sessions,          color:undefined },
            { icon:'??', label:'Journal Entries',  value:stats.total_journal_entries,   color:undefined },
            { icon:'??', label:'Chat Messages',    value:stats.total_chat_messages,     color:undefined },
          ].map(s=>(
            <GlassCard key={s.label} style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:'1.2rem' }}>{s.icon}</span>
                <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>{s.label}</span>
              </div>
              <p style={{ fontFamily:'monospace', fontWeight:700, fontSize:'1.8rem', color: s.color ?? '#fff', letterSpacing:'-0.02em' }}>
                {s.value.toLocaleString()}
              </p>
            </GlassCard>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:12, marginBottom:16 }}>
        {[
          { to:'/admin/users',    icon:'??', label:'Manage Users',    desc:'Add, edit, or delete user accounts', color:'rgba(99,102,241,0.15)' },
          { to:'/admin/sessions', icon:'??', label:'All Sessions',    desc:'View and manage monitoring sessions', color:'rgba(168,85,247,0.15)' },
        ].map(item=>(
          <Link key={item.to} to={item.to} style={{ textDecoration:'none' }}>
            <GlassCard style={{ padding:20, display:'flex', alignItems:'center', gap:16, transition:'all 0.2s', cursor:'pointer' }}
              // @ts-ignore
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(99,102,241,0.4)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'}
            >
              <div style={{ width:48, height:48, borderRadius:14, background:item.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontWeight:700, color:'#fff', fontSize:'0.95rem', fontFamily:"'Syne',sans-serif" }}>{item.label}</p>
                <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.35)', marginTop:2 }}>{item.desc}</p>
              </div>
              <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.2)', fontSize:'1.1rem' }}>→</span>
            </GlassCard>
          </Link>
        ))}
      </div>

      <GlassCard>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <SectionTitle>Recent Sessions</SectionTitle>
        </div>
        {sessions.length===0 ? (
          <p style={{ textAlign:'center', color:'rgba(255,255,255,0.25)', padding:'3rem', fontSize:'0.875rem' }}>No sessions yet.</p>
        ) : (
          <div>
            {sessions.map((s,i)=>(
              <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom: i<sessions.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', gap:12 }}>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:'0.875rem', fontWeight:500, color:'rgba(255,255,255,0.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {s.label ?? 'Untitled Session'}
                  </p>
                  <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', marginTop:2 }}>
                    {new Date(s.started_at).toLocaleString()}
                  </p>
                </div>
                {s.final_risk_level && <Badge label={s.final_risk_level} color={riskBadge(s.final_risk_level) as any} />}
              </div>
            ))}
          </div>
        )}
        {sessions.length>0 && (
          <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <Link to="/admin/sessions" style={{ fontSize:'0.82rem', color:'#a78bfa', textDecoration:'none' }}>View all sessions →</Link>
          </div>
        )}
      </GlassCard>
    </PageWrap>
  )
}
