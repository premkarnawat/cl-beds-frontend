/**
 * CL-BEDS Shared Glass UI Components
 * Premium glassmorphism primitives used across all pages.
 */
import type { CSSProperties, ReactNode } from 'react'

// ── Design tokens ──────────────────────────────────────────────────────────
export const C = {
  glass:       'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.09)',
  glassHover:  'rgba(255,255,255,0.07)',
  accent:      'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)',
  text:        '#ffffff',
  textMuted:   'rgba(255,255,255,0.45)',
  textDim:     'rgba(255,255,255,0.25)',
  danger:      'rgba(239,68,68,0.85)',
  success:     'rgba(34,197,94,0.85)',
  warning:     'rgba(234,179,8,0.85)',
}

// ── Glass Card ─────────────────────────────────────────────────────────────
export function GlassCard({ children, style, className }: {
  children: ReactNode; style?: CSSProperties; className?: string
}) {
  return (
    <div className={className} style={{
      background: C.glass,
      border: `1px solid ${C.glassBorder}`,
      borderRadius: 20,
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      ...style
    }}>
      {children}
    </div>
  )
}

// ── Section Title ──────────────────────────────────────────────────────────
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize:'0.7rem', fontWeight:600, color:C.textDim, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.75rem' }}>
      {children}
    </p>
  )
}

// ── Glass Input ────────────────────────────────────────────────────────────
export function GlassInput({ label, icon, type='text', value, onChange, placeholder, disabled, required, minLength }: {
  label?: string; icon?: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string; disabled?: boolean; required?: boolean; minLength?: number
}) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      {label && <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600, color:C.textDim, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>{label}</label>}
      <div style={{ position:'relative' }}>
        {icon && <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:'0.95rem', pointerEvents:'none', opacity:0.5 }}>{icon}</span>}
        <input
          type={type} value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled} required={required} minLength={minLength}
          style={{
            width:'100%', padding: icon ? '0.75rem 1rem 0.75rem 2.6rem' : '0.75rem 1rem',
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:12, color:'#fff', fontFamily:"'DM Sans',sans-serif", fontSize:'0.875rem',
            outline:'none', transition:'all 0.2s', boxSizing:'border-box',
            opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text'
          }}
          onFocus={e => { e.currentTarget.style.borderColor='rgba(99,102,241,0.7)'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'; e.currentTarget.style.background='rgba(255,255,255,0.08)' }}
          onBlur={e  => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
        />
      </div>
    </div>
  )
}

// ── Primary Button ─────────────────────────────────────────────────────────
export function PrimaryBtn({ children, onClick, disabled, type='button', fullWidth, style }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button'|'submit'; fullWidth?: boolean; style?: CSSProperties
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      width: fullWidth ? '100%' : undefined,
      padding:'0.8rem 1.5rem', border:'none', borderRadius:12, cursor: disabled ? 'not-allowed' : 'pointer',
      background:'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)',
      color:'#fff', fontFamily:"'Syne',sans-serif", fontSize:'0.9rem', fontWeight:700,
      letterSpacing:'0.02em', opacity: disabled ? 0.6 : 1,
      boxShadow:'0 4px 24px rgba(99,102,241,0.35)', transition:'all 0.2s',
      ...style
    }}
    onMouseEnter={e => { if(!disabled) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(99,102,241,0.5)' } }}
    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 24px rgba(99,102,241,0.35)' }}
    >
      {children}
    </button>
  )
}

// ── Ghost Button ───────────────────────────────────────────────────────────
export function GhostBtn({ children, onClick, danger, style }: {
  children: ReactNode; onClick?: () => void; danger?: boolean; style?: CSSProperties
}) {
  return (
    <button onClick={onClick} style={{
      padding:'0.7rem 1.25rem', border:`1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius:12, background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
      color: danger ? '#fca5a5' : 'rgba(255,255,255,0.7)',
      fontFamily:"'DM Sans',sans-serif", fontSize:'0.875rem', cursor:'pointer', transition:'all 0.2s',
      ...style
    }}
    onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)' }}
    onMouseLeave={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)' }}
    >
      {children}
    </button>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ label, color }: { label: string; color?: 'green'|'yellow'|'red'|'purple'|'blue'|'dim' }) {
  const colors = {
    green:  { bg:'rgba(34,197,94,0.12)',  text:'#86efac', border:'rgba(34,197,94,0.25)'  },
    yellow: { bg:'rgba(234,179,8,0.12)',  text:'#fde047', border:'rgba(234,179,8,0.25)'  },
    red:    { bg:'rgba(239,68,68,0.12)',  text:'#fca5a5', border:'rgba(239,68,68,0.25)'  },
    purple: { bg:'rgba(168,85,247,0.12)', text:'#d8b4fe', border:'rgba(168,85,247,0.25)' },
    blue:   { bg:'rgba(59,130,246,0.12)', text:'#93c5fd', border:'rgba(59,130,246,0.25)' },
    dim:    { bg:'rgba(255,255,255,0.06)', text:'rgba(255,255,255,0.45)', border:'rgba(255,255,255,0.1)' },
  }
  const c = colors[color ?? 'dim']
  return (
    <span style={{ display:'inline-block', padding:'0.2rem 0.6rem', borderRadius:99, fontSize:'0.72rem', fontWeight:600, background:c.bg, color:c.text, border:`1px solid ${c.border}` }}>
      {label}
    </span>
  )
}

// ── Alert ──────────────────────────────────────────────────────────────────
export function Alert({ text, ok }: { text: string; ok: boolean }) {
  return (
    <div style={{
      background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
      borderRadius:10, padding:'0.65rem 0.9rem',
      color: ok ? '#86efac' : '#fca5a5', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:8
    }}>
      {ok ? '✅' : '⚠️'} {text}
    </div>
  )
}

// ── Page wrapper ───────────────────────────────────────────────────────────
export function PageWrap({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding:'1.5rem', maxWidth:1200, margin:'0 auto', animation:'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>
      {children}
    </div>
  )
}

// ── Page header ────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:'0.75rem' }}>
      <div>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', letterSpacing:'-0.02em', background:'linear-gradient(135deg,#fff,rgba(255,255,255,0.6))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{title}</h1>
        {subtitle && <p style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.4)', marginTop:4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }}>
      <div style={{ background:'rgba(15,15,30,0.95)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, width:'100%', maxWidth:460, boxShadow:'0 32px 80px rgba(0,0,0,0.6)', animation:'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
        <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1rem', color:'#fff' }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'1.2rem', lineHeight:1, padding:4, borderRadius:6, transition:'color 0.2s' }}>✕</button>
        </div>
        <div style={{ padding:'1.5rem' }}>{children}</div>
      </div>
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────
export function Toast({ text, ok }: { text: string; ok: boolean }) {
  return (
    <div style={{
      position:'fixed', top:24, right:24, zIndex:100,
      padding:'0.75rem 1.25rem', borderRadius:12, fontSize:'0.875rem', fontWeight:500,
      background: ok ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
      color:'#fff', boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
      backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
      border: `1px solid ${ok ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
      animation:'fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both'
    }}>
      {ok ? '✅' : '❌'} {text}
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ size=24 }: { size?: number }) {
  return (
    <div style={{ display:'inline-block', width:size, height:size, border:'2px solid rgba(255,255,255,0.15)', borderTopColor:'rgba(99,102,241,0.8)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
