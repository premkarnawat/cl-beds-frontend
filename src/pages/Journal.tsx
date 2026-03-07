// Journal.tsx — Premium Glassmorphism
import { useEffect, useState } from 'react'
import { journalApi, type JournalEntry } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { GlassCard, PageWrap, PageHeader, GlassInput, PrimaryBtn, Badge, SectionTitle } from '@/components/GlassUI'

const MOOD_LABELS = ['','??','??','??','??','??','??','??','??','??','??']
const EMOTION_COLOR: Record<string,string> = {
  Stress:'red', Fatigue:'yellow', Cognitive_Overload:'purple', Neutral:'dim'
}

export default function JournalPage() {
  const { token } = useAuth()
  const [entries, setEntries]     = useState<JournalEntry[]>([])
  const [content, setContent]     = useState('')
  const [moodScore, setMoodScore] = useState(5)
  const [tags, setTags]           = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]         = useState<string|null>(null)

  useEffect(() => { if(token) journalApi.list(token).then(setEntries).catch(()=>{}) }, [token])

  const handleSubmit = async () => {
    if (!content.trim() || !token) return
    setIsSubmitting(true); setError(null)
    try {
      const tagList = tags.split(',').map(t=>t.trim()).filter(Boolean)
      const entry = await journalApi.create(token, content.trim(), moodScore, tagList.length ? tagList : undefined)
      setEntries(prev=>[entry,...prev]); setContent(''); setTags(''); setMoodScore(5)
    } catch(e:unknown) { setError((e as Error).message) }
    finally { setIsSubmitting(false) }
  }

  const handleDelete = async (id:string) => {
    if (!token) return
    await journalApi.delete(token, id)
    setEntries(prev=>prev.filter(e=>e.id!==id))
  }

  return (
    <PageWrap>
      <PageHeader title="Journal" subtitle="Write freely – AI emotion detection runs automatically." />

      <GlassCard style={{ padding:24, marginBottom:16 }}>
        <SectionTitle>New Entry</SectionTitle>
        <textarea value={content} onChange={e=>setContent(e.target.value)}
          placeholder="How was your day? What's on your mind?"
          rows={5} style={{
            width:'100%', padding:'0.875rem 1rem',
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:12, color:'#fff', fontFamily:"'DM Sans',sans-serif", fontSize:'0.9rem',
            resize:'vertical', outline:'none', transition:'all 0.2s', boxSizing:'border-box', marginBottom:12
          }}
          onFocus={e=>{e.currentTarget.style.borderColor='rgba(99,102,241,0.6)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'}}
          onBlur={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';e.currentTarget.style.boxShadow='none'}}
        />

        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:8 }}>
            Mood: {MOOD_LABELS[moodScore]} {moodScore}/10
          </label>
          <input type="range" min={1} max={10} value={moodScore} onChange={e=>setMoodScore(Number(e.target.value))}
            style={{ width:'100%', accentColor:'#6366f1' }} />
        </div>

        <GlassInput value={tags} onChange={setTags} placeholder="Tags: work, stress, focus…" icon="??️" />

        {error && <div style={{ color:'#fca5a5', fontSize:'0.82rem', marginBottom:12 }}>⚠️ {error}</div>}

        <PrimaryBtn onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? 'Saving…' : 'Save Entry'}
        </PrimaryBtn>
      </GlassCard>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {entries.length===0 && (
          <div style={{ textAlign:'center', padding:'3rem 0', color:'rgba(255,255,255,0.25)', fontSize:'0.875rem' }}>
            No journal entries yet. Write your first one above!
          </div>
        )}
        {entries.map(entry=>(
          <GlassCard key={entry.id} style={{ padding:20 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                {entry.mood_score && <span style={{ fontSize:'1.2rem' }}>{MOOD_LABELS[entry.mood_score]}</span>}
                {entry.detected_emotion && <Badge label={entry.detected_emotion.replace('_',' ')} color={(EMOTION_COLOR[entry.detected_emotion]??'dim') as any} />}
                {entry.tags?.map(tag=>(
                  <Badge key={tag} label={`#${tag}`} color="dim" />
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.25)' }}>
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
                <button onClick={()=>handleDelete(entry.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', fontSize:'0.9rem', transition:'color 0.2s', padding:4 }}
                  onMouseEnter={e=>e.currentTarget.style.color='#fca5a5'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.2)'}>
                  ??
                </button>
              </div>
            </div>
            <p style={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.7)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{entry.content}</p>
          </GlassCard>
        ))}
      </div>
    </PageWrap>
  )
}
