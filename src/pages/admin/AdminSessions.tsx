/**
 * Admin Sessions — Premium Glassmorphism UI
 */
import { useEffect, useState } from 'react'
import { adminApi, type SessionOut } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { GlassCard, PageWrap, PageHeader, Badge, Toast, Spinner } from '@/components/GlassUI'

export default function AdminSessions() {
  const { token } = useAuth()
  const [sessions, setSessions] = useState<SessionOut[]>([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [toast,    setToast]    = useState<{text:string;ok:boolean}|null>(null)
  const [deleting, setDeleting] = useState<string|null>(null)

  const load = async (p=page) => {
    if (!token) return
    setLoading(true)
    try { setSessions(await adminApi.listAllSessions(token, p)) } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page])

  const showToast = (text:string,ok:boolean) => { setToast({text,ok}); setTimeout(()=>setToast(null),3000) }

  const handleDelete = async (id:string) => {
    if (!token || !confirm('Delete this session and all its data?')) return
    setDeleting(id)
    try { await adminApi.deleteSession(token,id); setSessions(p=>p.filter(s=>s.id!==id)); showToast('Session deleted',true) }
    catch(e:unknown) { showToast((e as Error).message,false) }
    finally { setDeleting(null) }
  }

  const duration = (s:SessionOut) => {
    if (!s.ended_at) return 'Active'
    const ms = new Date(s.ended_at).getTime()-new Date(s.started_at).getTime()
    const mins = Math.round(ms/60_000)
    return mins<60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`
  }

  const riskBadge = (r:string) => r==='High'?'red':r==='Medium'?'yellow':'green'

  return (
    <PageWrap>
      {toast && <Toast text={toast.text} ok={toast.ok} />}
      <PageHeader title="All Sessions" subtitle="Monitor sessions across all users" />

      <GlassCard>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><Spinner size={36} /></div>
        ) : sessions.length===0 ? (
          <p style={{ textAlign:'center', color:'rgba(255,255,255,0.25)', padding:'3rem', fontSize:'0.875rem' }}>No sessions found.</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                  {['Label','Started','Duration','Risk','Score','Actions'].map(h=>(
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.68rem', fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s,i)=>(
                  <tr key={s.id} style={{ borderBottom:i<sessions.length-1?'1px solid rgba(255,255,255,0.05)':'none', transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <td style={{ padding:'14px 16px', fontWeight:500, color:'rgba(255,255,255,0.8)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {s.label ?? 'Untitled'}
                    </td>
                    <td style={{ padding:'14px 16px', fontSize:'0.75rem', color:'rgba(255,255,255,0.35)', whiteSpace:'nowrap' }}>
                      {new Date(s.started_at).toLocaleString()}
                    </td>
                    <td style={{ padding:'14px 16px', fontSize:'0.75rem', color:'rgba(255,255,255,0.35)' }}>
                      {duration(s)}
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      {s.final_risk_level
                        ? <Badge label={s.final_risk_level} color={riskBadge(s.final_risk_level) as any} />
                        : <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.8rem' }}>—</span>}
                    </td>
                    <td style={{ padding:'14px 16px', fontFamily:'monospace', fontSize:'0.78rem', color:'rgba(255,255,255,0.4)' }}>
                      {s.final_risk_score!=null ? (s.final_risk_score*100).toFixed(1)+'%' : '—'}
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <button onClick={()=>handleDelete(s.id)} disabled={deleting===s.id} style={{
                        padding:'4px 10px', borderRadius:7, border:'none', cursor: deleting===s.id?'not-allowed':'pointer',
                        background:'rgba(239,68,68,0.1)', color:'#fca5a5', fontSize:'0.75rem', fontWeight:500, transition:'all 0.15s',
                        opacity: deleting===s.id?0.5:1
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.2)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                      >{deleting===s.id?'…':'Delete'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ background:'none', border:'none', color:page===1?'rgba(255,255,255,0.2)':'#a78bfa', cursor:page===1?'not-allowed':'pointer', fontSize:'0.82rem' }}>← Previous</button>
          <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)' }}>Page {page}</span>
          <button onClick={()=>setPage(p=>p+1)} disabled={sessions.length<20} style={{ background:'none', border:'none', color:sessions.length<20?'rgba(255,255,255,0.2)':'#a78bfa', cursor:sessions.length<20?'not-allowed':'pointer', fontSize:'0.82rem' }}>Next →</button>
        </div>
      </GlassCard>
    </PageWrap>
  )
}
