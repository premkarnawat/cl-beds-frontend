/**
 * Profile Page — Premium Glassmorphism UI
 */
import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { GlassCard, PageWrap, PageHeader, GlassInput, PrimaryBtn, GhostBtn, Alert } from '@/components/GlassUI'

export default function ProfilePage() {
  const { user, token, logout, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [fullName,   setFullName]   = useState(user?.full_name ?? '')
  const [avatarUrl,  setAvatarUrl]  = useState(user?.avatar_url ?? '')
  const [profileMsg, setProfileMsg] = useState<{text:string;ok:boolean}|null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg,     setPwMsg]     = useState<{text:string;ok:boolean}|null>(null)
  const [savingPw,  setSavingPw]  = useState(false)

  const [deletePw,      setDeletePw]      = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteMsg,     setDeleteMsg]     = useState<string|null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [showDelete,    setShowDelete]    = useState(false)

  if (!user || !token) return null

  const handleSaveProfile = async (e:FormEvent) => {
    e.preventDefault(); setSavingProfile(true); setProfileMsg(null)
    try { await profileApi.update(token,{full_name:fullName,avatar_url:avatarUrl||undefined}); await refreshUser(); setProfileMsg({text:'Profile updated!',ok:true}) }
    catch(err:unknown) { setProfileMsg({text:(err as Error).message,ok:false}) }
    finally { setSavingProfile(false) }
  }

  const handleChangePassword = async (e:FormEvent) => {
    e.preventDefault()
    if (newPw!==confirmPw) { setPwMsg({text:'Passwords do not match',ok:false}); return }
    if (newPw.length<8) { setPwMsg({text:'Min 8 characters',ok:false}); return }
    setSavingPw(true); setPwMsg(null)
    try { await profileApi.changePassword(token,currentPw,newPw); setPwMsg({text:'Password changed!',ok:true}); setCurrentPw(''); setNewPw(''); setConfirmPw('') }
    catch(err:unknown) { setPwMsg({text:(err as Error).message,ok:false}) }
    finally { setSavingPw(false) }
  }

  const handleDelete = async () => {
    if (deleteConfirm!=='DELETE') { setDeleteMsg('Type DELETE to confirm'); return }
    setDeleting(true)
    try { await profileApi.deleteAccount(token,deletePw); await logout(); navigate('/login',{replace:true}) }
    catch(err:unknown) { setDeleteMsg((err as Error).message) }
    finally { setDeleting(false) }
  }

  const initials = user.full_name.split(' ').map((w:string)=>w[0]).slice(0,2).join('').toUpperCase()

  return (
    <PageWrap>
      <PageHeader title="My Profile" subtitle="Manage your account details and preferences" />

      {/* Profile form */}
      <GlassCard style={{ padding:24, marginBottom:16 }}>
        <form onSubmit={handleSaveProfile}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', fontWeight:800, fontFamily:"'Syne',sans-serif", color:'#fff', flexShrink:0, overflow:'hidden', boxShadow:'0 8px 24px rgba(99,102,241,0.4)' }}>
              {avatarUrl ? <img src={avatarUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : initials}
            </div>
            <div style={{ flex:1 }}>
              <GlassInput label="Avatar URL" value={avatarUrl} onChange={setAvatarUrl} placeholder="https://..." icon="??️" />
            </div>
          </div>
          <GlassInput label="Full Name" value={fullName} onChange={setFullName} icon="??" placeholder="Your name" required />
          <GlassInput label="Email" value={user.email} onChange={()=>{}} icon="✉️" disabled />
          <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.25)', marginTop:-8, marginBottom:16 }}>Email cannot be changed here.</p>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.3)' }}>Role:</span>
            <span style={{ padding:'0.2rem 0.6rem', borderRadius:99, fontSize:'0.72rem', background:'rgba(168,85,247,0.12)', color:'#d8b4fe', border:'1px solid rgba(168,85,247,0.25)', textTransform:'capitalize' }}>{user.role}</span>
          </div>
          {profileMsg && <div style={{ marginBottom:12 }}><Alert text={profileMsg.text} ok={profileMsg.ok} /></div>}
          <PrimaryBtn type="submit" disabled={savingProfile}>{savingProfile?'Saving…':'Save Profile'}</PrimaryBtn>
        </form>
      </GlassCard>

      {/* Change password */}
      <GlassCard style={{ padding:24, marginBottom:16 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'1rem', color:'rgba(255,255,255,0.7)', marginBottom:16 }}>Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <GlassInput label="Current Password" value={currentPw} onChange={setCurrentPw} type="password" icon="??" placeholder="••••••••" required />
          <GlassInput label="New Password"     value={newPw}     onChange={setNewPw}     type="password" icon="??" placeholder="••••••••" required />
          <GlassInput label="Confirm Password" value={confirmPw} onChange={setConfirmPw} type="password" icon="??" placeholder="••••••••" required />
          {pwMsg && <div style={{ marginBottom:12 }}><Alert text={pwMsg.text} ok={pwMsg.ok} /></div>}
          <PrimaryBtn type="submit" disabled={savingPw}>{savingPw?'Saving…':'Update Password'}</PrimaryBtn>
        </form>
      </GlassCard>

      {/* Danger zone */}
      <GlassCard style={{ padding:24, border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.04)' }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.95rem', color:'#fca5a5', marginBottom:8 }}>⚠️ Danger Zone</h2>
        <p style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.4)', marginBottom:16, lineHeight:1.6 }}>
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        {!showDelete ? (
          <GhostBtn onClick={()=>setShowDelete(true)} danger>Delete My Account</GhostBtn>
        ) : (
          <div>
            <GlassInput label="Your password" value={deletePw} onChange={setDeletePw} type="password" icon="??" placeholder="••••••••" />
            <GlassInput label='Type "DELETE" to confirm' value={deleteConfirm} onChange={setDeleteConfirm} icon="⚠️" placeholder="DELETE" />
            {deleteMsg && <p style={{ color:'#fca5a5', fontSize:'0.82rem', marginBottom:12 }}>⚠️ {deleteMsg}</p>}
            <div style={{ display:'flex', gap:10 }}>
              <GhostBtn onClick={handleDelete} danger style={{ opacity:deleting?0.6:1 }}>{deleting?'Deleting…':'Confirm Delete'}</GhostBtn>
              <GhostBtn onClick={()=>{setShowDelete(false);setDeleteMsg(null)}}>Cancel</GhostBtn>
            </div>
          </div>
        )}
      </GlassCard>
    </PageWrap>
  )
}
