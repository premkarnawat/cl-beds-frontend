/**
 * Settings Page — Premium Glassmorphism UI
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { GlassCard, PageWrap, PageHeader, SectionTitle } from '@/components/GlassUI'

const ACCENT_COLORS = [
  { key:'indigo',  hex:'#6366f1', name:'Indigo'  },
  { key:'violet',  hex:'#7c3aed', name:'Violet'  },
  { key:'blue',    hex:'#2563eb', name:'Blue'    },
  { key:'emerald', hex:'#059669', name:'Emerald' },
  { key:'rose',    hex:'#e11d48', name:'Rose'    },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const [accent, setAccent] = useState('indigo')

  return (
    <PageWrap>
      <PageHeader title="Settings" subtitle="App preferences and monitoring configuration" />

      {/* Profile quick link */}
      <GlassCard style={{ padding:16, marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.1rem', color:'#fff', flexShrink:0 }}>
          {user?.full_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontWeight:600, color:'#fff', fontSize:'0.95rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.full_name}</p>
          <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
        </div>
        <Link to="/profile" style={{ fontSize:'0.82rem', color:'#a78bfa', textDecoration:'none', fontWeight:500, flexShrink:0, whiteSpace:'nowrap' }}>
          Edit Profile →
        </Link>
      </GlassCard>

      {/* Appearance */}
      <GlassCard style={{ padding:24, marginBottom:16 }}>
        <SectionTitle>Appearance</SectionTitle>
        <p style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.4)', marginBottom:12 }}>Accent Colour</p>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {ACCENT_COLORS.map(c=>(
            <button key={c.key} onClick={()=>setAccent(c.key)} title={c.name} style={{
              width:36, height:36, borderRadius:'50%', background:c.hex, border: accent===c.key ? `3px solid #fff` : '3px solid transparent',
              cursor:'pointer', transition:'all 0.2s', transform: accent===c.key ? 'scale(1.15)' : 'scale(1)',
              boxShadow: accent===c.key ? `0 0 16px ${c.hex}` : 'none'
            }} />
          ))}
        </div>
        <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.25)', marginTop:10 }}>
          Current: <span style={{ color:'rgba(255,255,255,0.5)' }}>{ACCENT_COLORS.find(c=>c.key===accent)?.name}</span>
        </p>
      </GlassCard>

      {/* Monitoring */}
      <GlassCard style={{ padding:24, marginBottom:16 }}>
        <SectionTitle>Monitoring Sensors</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <ToggleRow label="Keystroke Tracking"   desc="Typing dynamics for cognitive load analysis" defaultOn />
          <ToggleRow label="Mouse Tracking"        desc="Mouse movement pattern analysis"             defaultOn />
          <ToggleRow label="NLP Emotion Detection" desc="Analyse text for emotional signals"          defaultOn />
          <ToggleRow label="rPPG Heart Rate"       desc="Webcam / front camera heart rate sensing"   defaultOn={false} />
          <ToggleRow label="Auto-send to AI Coach" desc="Automatically share risk scores with coach" defaultOn />
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard style={{ padding:24, marginBottom:16 }}>
        <SectionTitle>Notifications</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <ToggleRow label="High-Risk Alerts"  desc="Notify when burnout risk reaches High"  defaultOn />
          <ToggleRow label="Daily Summary"     desc="End-of-day wellbeing report"             defaultOn={false} />
          <ToggleRow label="Coach Suggestions" desc="Proactive tips from the AI coach"       defaultOn />
        </div>
      </GlassCard>

      {/* About */}
      <GlassCard style={{ padding:24 }}>
        <SectionTitle>About</SectionTitle>
        <p style={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
          CL-BEDS v1.0 — Research prototype for cognitive load and burnout monitoring. Not a medical device or diagnostic tool.
        </p>
        <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.2)', marginTop:8 }}>
          Stack: FastAPI · PyTorch · RoBERTa · React · Supabase
        </p>
      </GlassCard>
    </PageWrap>
  )
}

function ToggleRow({ label, desc, defaultOn }: { label:string; desc:string; defaultOn:boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <p style={{ fontSize:'0.875rem', fontWeight:500, color:'rgba(255,255,255,0.8)' }}>{label}</p>
        <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', marginTop:2 }}>{desc}</p>
      </div>
      <label style={{ position:'relative', display:'inline-flex', height:24, width:44, cursor:'pointer', alignItems:'center', flexShrink:0, marginLeft:16 }}>
        <input type="checkbox" checked={on} onChange={e=>setOn(e.target.checked)} style={{ opacity:0, width:0, height:0, position:'absolute' }} />
        <div onClick={()=>setOn(!on)} style={{
          height:24, width:44, borderRadius:999, transition:'background 0.25s',
          background: on ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.1)',
          position:'relative', boxShadow: on ? '0 0 12px rgba(99,102,241,0.4)' : 'none'
        }}>
          <div style={{
            position:'absolute', top:3, left: on ? 22 : 3, width:18, height:18,
            borderRadius:'50%', background:'#fff', transition:'left 0.25s', boxShadow:'0 2px 4px rgba(0,0,0,0.3)'
          }} />
        </div>
      </label>
    </div>
  )
}
