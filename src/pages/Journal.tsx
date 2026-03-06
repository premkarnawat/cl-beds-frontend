/**
 * Journal Page – mood-aware daily journal with NLP emotion detection
 */

import { useEffect, useState } from 'react'
import { journalApi, type JournalEntry } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const MOOD_LABELS = ['', '😩', '😞', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🌟']

const EMOTION_BADGE: Record<string, string> = {
  Stress:             'bg-red-900/40 text-red-400',
  Fatigue:            'bg-orange-900/40 text-orange-400',
  Cognitive_Overload: 'bg-purple-900/40 text-purple-400',
  Neutral:            'bg-slate-700 text-slate-400',
}

export default function JournalPage() {
  const { token } = useAuth()
  const [entries, setEntries]     = useState<JournalEntry[]>([])
  const [content, setContent]     = useState('')
  const [moodScore, setMoodScore] = useState<number>(5)
  const [tags, setTags]           = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    journalApi.list(token).then(setEntries).catch(() => {})
  }, [token])

  const handleSubmit = async () => {
    if (!content.trim() || !token) return
    setIsSubmitting(true)
    setError(null)
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const entry = await journalApi.create(token, content.trim(), moodScore, tagList.length ? tagList : undefined)
      setEntries((prev) => [entry, ...prev])
      setContent('')
      setTags('')
      setMoodScore(5)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!token) return
    await journalApi.delete(token, id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">

      <div>
        <h1 className="text-xl font-bold text-white">Journal</h1>
        <p className="text-sm text-slate-400 mt-1">
          Write freely – AI emotion detection runs automatically.
        </p>
      </div>

      {/* Entry form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          New Entry
        </h2>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="How was your day? What's on your mind?"
          rows={5}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3
                     text-slate-100 placeholder-slate-500 text-sm resize-none
                     focus:outline-none focus:border-brand-500 transition-colors"
        />

        {/* Mood slider */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">
            Mood: {MOOD_LABELS[moodScore]} {moodScore}/10
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={moodScore}
            onChange={(e) => setMoodScore(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </div>

        {/* Tags */}
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated): work, stress, focus…"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2
                     text-slate-100 placeholder-slate-500 text-sm
                     focus:outline-none focus:border-brand-500 transition-colors"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white
                     px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {isSubmitting ? 'Saving…' : 'Save Entry'}
        </button>
      </div>

      {/* Entries list */}
      <div className="space-y-4">
        {entries.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">
            No journal entries yet. Write your first one above!
          </p>
        )}

        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3
                       animate-fade-in"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {entry.mood_score && (
                  <span className="text-lg">{MOOD_LABELS[entry.mood_score]}</span>
                )}
                {entry.detected_emotion && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      EMOTION_BADGE[entry.detected_emotion] ?? 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {entry.detected_emotion.replace('_', ' ')}
                  </span>
                )}
                {entry.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-600">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors text-sm"
                  aria-label="Delete entry"
                >
                  🗑
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
