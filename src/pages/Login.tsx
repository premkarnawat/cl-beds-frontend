import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, fullName)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setError((err as Error).message ?? 'An error occurred')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#060612', fontFamily: "'DM Sans', sans-serif", padding: '1rem', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background orbs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', top:-150, left:-150, filter:'blur(60px)', animation:'orbDrift 14s ease-in-out infinite alternate' }} />
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)', bottom:-100, right:-100, filter:'blur(60px)', animation:'orbDrift 10s ease-in-out infinite alternate-reverse' }} />
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', top:'40%', left:'40%', filter:'blur(80px)', animation:'orbDrift 18s ease-in-out infinite alternate' }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes orbDrift { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(40px,-40px) scale(1.1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .login-card { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .field-input { width:100%; padding:0.75rem 1rem 0.75rem 2.75rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:#fff; font-family:'DM Sans',sans-serif; font-size:0.9rem; outline:none; transition:all 0.2s; box-sizing:border-box; }
        .field-input::placeholder { color:rgba(255,255,255,0.2); }
        .field-input:focus { border-color:rgba(99,102,241,0.7); background:rgba(255,255,255,0.08); box-shadow:0 0 0 3px rgba(99,102,241,0.15); }
        .spin { display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; vertical-align:middle; margin-right:8px; }
      `}</style>

      {/* Card */}
      <div className="login-card" style={{
        position:'relative', zIndex:10, width:'100%', maxWidth:420,
        background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:24, backdropFilter:'blur(28px) saturate(180%)',
        WebkitBackdropFilter:'blur(28px) saturate(180%)',
        boxShadow:'0 0 0 1px rgba(255,255,255,0.05) inset, 0 32px 80px rgba(0,0,0,0.6), 0 0 100px rgba(99,102,241,0.12)',
        padding:'2.5rem'
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{
            width:60, height:60, borderRadius:18, margin:'0 auto 1rem',
            background:'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.8rem', boxShadow:'0 8px 40px rgba(99,102,241,0.5)'
          }}>??</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.75rem', letterSpacing:'-0.02em', background:'linear-gradient(135deg,#fff,rgba(255,255,255,0.6))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            CL-BEDS
          </div>
          <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:4 }}>
            Cognitive Load & Burnout Detection
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:12, padding:4, marginBottom:'1.75rem', border:'1px solid rgba(255,255,255,0.07)' }}>
          {(['login','register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null) }} style={{
              flex:1, padding:'0.6rem', border:'none', cursor:'pointer', borderRadius:9, fontFamily:"'DM Sans',sans-serif",
              fontSize:'0.875rem', fontWeight:500, transition:'all 0.2s',
              background: mode===m ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: mode===m ? '#fff' : 'rgba(255,255,255,0.4)',
              boxShadow: mode===m ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
            }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:500, color:'rgba(255,255,255,0.45)', marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase' }}>Full Name</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:'1rem', pointerEvents:'none' }}>??</span>
                <input className="field-input" type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name" required />
              </div>
            </div>
          )}

          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:500, color:'rgba(255,255,255,0.45)', marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase' }}>Email</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:'1rem', pointerEvents:'none' }}>✉️</span>
              <input className="field-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
          </div>

          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ display:'block', fontSize:'0.72rem', fontWeight:500, color:'rgba(255,255,255,0.45)', marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase' }}>Password</label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:'1rem', pointerEvents:'none' }}>??</span>
              <input className="field-input" type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={{ paddingRight:'2.75rem' }} />
              <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'1rem', padding:4, transition:'color 0.2s' }}>
                {showPw ? '??' : '??️'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'0.65rem 0.9rem', color:'#fca5a5', fontSize:'0.82rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:8 }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'0.875rem', border:'none', borderRadius:12, cursor: loading ? 'not-allowed' : 'pointer',
            background:'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)', backgroundSize:'200% 200%',
            color:'#fff', fontFamily:"'Syne',sans-serif", fontSize:'0.95rem', fontWeight:700, letterSpacing:'0.03em',
            opacity: loading ? 0.7 : 1, boxShadow:'0 4px 24px rgba(99,102,241,0.4)',
            transition:'all 0.2s'
          }}>
            {loading && <span className="spin" />}
            {loading ? 'Please wait…' : mode==='login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop:'1.5rem', textAlign:'center', fontSize:'0.7rem', color:'rgba(255,255,255,0.18)', letterSpacing:'0.04em' }}>
          For wellbeing monitoring only · Not a medical service
        </div>
      </div>
    </div>
  )
}
