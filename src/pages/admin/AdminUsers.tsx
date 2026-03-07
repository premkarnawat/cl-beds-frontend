/**
 * Admin Users — Premium Glassmorphism UI
 */
import { useEffect, useRef, useState } from 'react'
import { adminApi, type UserOut } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { GlassCard, PageWrap, PageHeader, GlassInput, PrimaryBtn, GhostBtn, Badge, Modal, Toast, Spinner } from '@/components/GlassUI'

type ModalMode = 'edit'|'add'|'reset-pw'|'delete'|null

export default function AdminUsers() {
  const { token } = useAuth()
  const [users,    setUsers]    = useState<UserOut[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)
  const [modal,    setModal]    = useState<ModalMode>(null)
  const [selected, setSelected] = useState<UserOut|null>(null)
  const [toast,    setToast]    = useState<{text:string;ok:boolean}|null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const loadUsers = async (q=search, p=page) => {
    if (!token) return
    setLoading(true)
    try { setUsers(await adminApi.listUsers(token, p, q)) } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { loadUsers() }, [page])
  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); loadUsers(search, 1) }, 400)
  }, [search])

  const showToast = (text:string, ok:boolean) => { setToast({text,ok}); setTimeout(()=>setToast(null),3000) }
  const openModal = (mode:ModalMode, user?:UserOut) => { setSelected(user??null); setModal(mode) }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleDelete = async (id:string) => {
    if (!token) return
    try { await adminApi.deleteUser(token,id); setUsers(p=>p.filter(u=>u.id!==id)); showToast('User deleted',true) }
    catch(e:unknown) { showToast((e as Error).message,false) }
    closeModal()
  }

  const handleUpdate = async (id:string, data:Partial<UserOut>) => {
    if (!token) return
    try { const u=await adminApi.updateUser(token,id,data); setUsers(p=>p.map(x=>x.id===id?{...x,...u}:x)); showToast('User updated',true) }
    catch(e:unknown) { showToast((e as Error).message,false) }
    closeModal()
  }

  const handleAdd = async (email:string, password:string, full_name:string, role:string) => {
    if (!token) return
    try {
      const {authApi} = await import('@/lib/api')
      const u = await authApi.register(email,password,full_name)
      if (role==='admin') await adminApi.updateUser(token,u.id,{role:'admin'})
      showToast('User created',true); loadUsers()
    } catch(e:unknown) { showToast((e as Error).message,false) }
    closeModal()
  }

  const handleResetPw = async (id:string, pw:string) => {
    if (!token) return
    try { await adminApi.resetUserPassword(token,id,pw); showToast('Password reset',true) }
    catch(e:unknown) { showToast((e as Error).message,false) }
    closeModal()
  }

  return (
    <PageWrap>
      {toast && <Toast text={toast.text} ok={toast.ok} />}

      <PageHeader
        title="Users"
        subtitle="Manage all user accounts"
        action={
          <PrimaryBtn onClick={()=>openModal('add')}>+ Add User</PrimaryBtn>
        }
      />

      <div style={{ marginBottom:16 }}>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', opacity:0.4 }}>??</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{ width:'100%', padding:'0.75rem 1rem 0.75rem 2.6rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'#fff', fontFamily:"'DM Sans',sans-serif", fontSize:'0.875rem', outline:'none', boxSizing:'border-box', transition:'all 0.2s' }}
            onFocus={e=>{e.currentTarget.style.borderColor='rgba(99,102,241,0.6)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'}}
            onBlur={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';e.currentTarget.style.boxShadow='none'}}
          />
        </div>
      </div>

      <GlassCard>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><Spinner size={36} /></div>
        ) : users.length===0 ? (
          <p style={{ textAlign:'center', color:'rgba(255,255,255,0.25)', padding:'3rem', fontSize:'0.875rem' }}>No users found.</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                  {['User','Role','Status','Joined','Actions'].map(h=>(
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.68rem', fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u,i)=>(
                  <tr key={u.id} style={{ borderBottom: i<users.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'0.85rem', fontWeight:700, flexShrink:0 }}>
                          {u.full_name[0]?.toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontWeight:500, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.full_name}</p>
                          <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <Badge label={u.role} color={u.role==='admin'?'purple':'blue'} />
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <Badge label={u.is_active?'Active':'Inactive'} color={u.is_active?'green':'dim'} />
                    </td>
                    <td style={{ padding:'14px 16px', fontSize:'0.78rem', color:'rgba(255,255,255,0.3)', whiteSpace:'nowrap' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        {[
                          { label:'Edit',     action:()=>openModal('edit',u),       danger:false },
                          { label:'Reset PW', action:()=>openModal('reset-pw',u),   danger:false },
                          { label:'Delete',   action:()=>openModal('delete',u),     danger:true  },
                        ].map(btn=>(
                          <button key={btn.label} onClick={btn.action} style={{
                            padding:'4px 10px', borderRadius:7, border:'none', cursor:'pointer', fontSize:'0.75rem', fontWeight:500, transition:'all 0.15s',
                            background: btn.danger ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                            color: btn.danger ? '#fca5a5' : '#a78bfa'
                          }}
                          onMouseEnter={e=>e.currentTarget.style.background=btn.danger?'rgba(239,68,68,0.2)':'rgba(99,102,241,0.2)'}
                          onMouseLeave={e=>e.currentTarget.style.background=btn.danger?'rgba(239,68,68,0.1)':'rgba(99,102,241,0.1)'}
                          >{btn.label}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ background:'none', border:'none', color: page===1?'rgba(255,255,255,0.2)':'#a78bfa', cursor: page===1?'not-allowed':'pointer', fontSize:'0.82rem' }}>← Previous</button>
          <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)' }}>Page {page}</span>
          <button onClick={()=>setPage(p=>p+1)} disabled={users.length<20} style={{ background:'none', border:'none', color: users.length<20?'rgba(255,255,255,0.2)':'#a78bfa', cursor: users.length<20?'not-allowed':'pointer', fontSize:'0.82rem' }}>Next →</button>
        </div>
      </GlassCard>

      {modal==='edit'     && selected && <EditModal     user={selected} onSave={handleUpdate}   onClose={closeModal} />}
      {modal==='add'                  && <AddModal                      onAdd={handleAdd}        onClose={closeModal} />}
      {modal==='reset-pw' && selected && <ResetPwModal  user={selected} onReset={handleResetPw} onClose={closeModal} />}
      {modal==='delete'   && selected && <DeleteModal   user={selected} onConfirm={handleDelete} onClose={closeModal} />}
    </PageWrap>
  )
}

function EditModal({ user, onSave, onClose }:{user:UserOut;onSave:(id:string,d:Partial<UserOut>)=>void;onClose:()=>void}) {
  const [name,setName]=useState(user.full_name)
  const [role,setRole]=useState<'student'|'admin'>(user.role)
  const [active,setActive]=useState(user.is_active)
  return (
    <Modal title="Edit User" onClose={onClose}>
      <GlassInput label="Full Name" value={name} onChange={setName} icon="??" />
      <div style={{ marginBottom:12 }}>
        <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Role</label>
        <select value={role} onChange={e=>setRole(e.target.value as any)} style={{ width:'100%', padding:'0.75rem 1rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'#fff', fontSize:'0.875rem', outline:'none' }}>
          <option value="student">Student</option><option value="admin">Admin</option>
        </select>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <div onClick={()=>setActive(!active)} style={{ width:44, height:24, borderRadius:999, background:active?'linear-gradient(135deg,#6366f1,#a855f7)':'rgba(255,255,255,0.1)', cursor:'pointer', position:'relative', transition:'all 0.25s', flexShrink:0 }}>
          <div style={{ position:'absolute', top:3, left:active?22:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.25s' }} />
        </div>
        <span style={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.6)' }}>Account Active</span>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <PrimaryBtn onClick={()=>onSave(user.id,{full_name:name,role,is_active:active})} style={{ flex:1 }}>Save</PrimaryBtn>
        <GhostBtn onClick={onClose} style={{ flex:1 }}>Cancel</GhostBtn>
      </div>
    </Modal>
  )
}

function AddModal({onAdd,onClose}:{onAdd:(e:string,p:string,n:string,r:string)=>void;onClose:()=>void}) {
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [pw,setPw]=useState(''); const [role,setRole]=useState('student')
  return (
    <Modal title="Add New User" onClose={onClose}>
      <GlassInput label="Full Name" value={name}  onChange={setName}  icon="??" placeholder="Jane Smith" />
      <GlassInput label="Email"     value={email} onChange={setEmail} icon="✉️" placeholder="jane@example.com" />
      <GlassInput label="Password"  value={pw}    onChange={setPw}    icon="??" type="password" placeholder="Min 8 chars" />
      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Role</label>
        <select value={role} onChange={e=>setRole(e.target.value)} style={{ width:'100%', padding:'0.75rem 1rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'#fff', fontSize:'0.875rem', outline:'none' }}>
          <option value="student">Student</option><option value="admin">Admin</option>
        </select>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <PrimaryBtn onClick={()=>onAdd(email,pw,name,role)} style={{ flex:1 }}>Create User</PrimaryBtn>
        <GhostBtn onClick={onClose} style={{ flex:1 }}>Cancel</GhostBtn>
      </div>
    </Modal>
  )
}

function ResetPwModal({user,onReset,onClose}:{user:UserOut;onReset:(id:string,pw:string)=>void;onClose:()=>void}) {
  const [pw,setPw]=useState(''); const [confirm,setConfirm]=useState(''); const [err,setErr]=useState('')
  const submit=()=>{ if(pw.length<8){setErr('Min 8 chars');return} if(pw!==confirm){setErr('Passwords do not match');return} onReset(user.id,pw) }
  return (
    <Modal title={`Reset Password — ${user.full_name}`} onClose={onClose}>
      <GlassInput label="New Password"     value={pw}      onChange={setPw}      type="password" icon="??" placeholder="••••••••" />
      <GlassInput label="Confirm Password" value={confirm} onChange={setConfirm} type="password" icon="??" placeholder="••••••••" />
      {err && <p style={{ color:'#fca5a5', fontSize:'0.82rem', marginBottom:12 }}>⚠️ {err}</p>}
      <div style={{ display:'flex', gap:10 }}>
        <PrimaryBtn onClick={submit} style={{ flex:1 }}>Reset Password</PrimaryBtn>
        <GhostBtn onClick={onClose} style={{ flex:1 }}>Cancel</GhostBtn>
      </div>
    </Modal>
  )
}

function DeleteModal({user,onConfirm,onClose}:{user:UserOut;onConfirm:(id:string)=>void;onClose:()=>void}) {
  const [confirm,setConfirm]=useState('')
  return (
    <Modal title="Delete User" onClose={onClose}>
      <p style={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.5)', marginBottom:16, lineHeight:1.6 }}>
        Permanently delete <strong style={{ color:'#fca5a5' }}>{user.full_name}</strong> and all their data?
        <span style={{ display:'block', marginTop:8, color:'#fca5a5', fontWeight:500 }}>This cannot be undone.</span>
      </p>
      <GlassInput label={`Type "${user.email}" to confirm`} value={confirm} onChange={setConfirm} placeholder={user.email} icon="⚠️" />
      <div style={{ display:'flex', gap:10, marginTop:4 }}>
        <GhostBtn onClick={()=>confirm===user.email && onConfirm(user.id)} danger style={{ flex:1, opacity:confirm!==user.email?0.5:1 }}>Delete User</GhostBtn>
        <GhostBtn onClick={onClose} style={{ flex:1 }}>Cancel</GhostBtn>
      </div>
    </Modal>
  )
}
