/**
 * ChatWidget – floating AI coach chatbot panel.
 */

import { useEffect, useRef, useState } from 'react'
import { chatApi, type ChatMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import LoadingSpinner from './LoadingSpinner'

interface Props {
  isOpen: boolean
  onClose: () => void
}

// Minimal markdown renderer (bold, italic, lists, line breaks)
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n/g, '<br />')
}

export default function ChatWidget({ isOpen, onClose }: Props) {
  const { token } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput]       = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load history on open
  useEffect(() => {
    if (!isOpen || !token) return
    chatApi.history(token)
      .then(setMessages)
      .catch(() => {})
  }, [isOpen, token])

  const handleSend = async () => {
    if (!input.trim() || isSending || !token) return

    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsSending(true)
    setError(null)

    try {
      const resp = await chatApi.send(token, userMsg.content)
      const assistantMsg: ChatMessage = { role: 'assistant', content: resp.reply }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-20 right-4 z-50 w-full max-w-sm sm:max-w-md flex flex-col
                    bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden
                    animate-slide-up h-[75vh] max-h-[600px]">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <div>
            <p className="text-sm font-semibold text-white">Dr. BEDS</p>
            <p className="text-xs text-slate-400">CBT Productivity Coach</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded"
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-sm mt-8">
            <p className="text-2xl mb-2">👋</p>
            <p>Hi! I'm Dr. BEDS, your AI wellbeing coach.</p>
            <p className="mt-1">How are you feeling today?</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <span className="mr-2 mt-1 text-base flex-shrink-0">🧠</span>
            )}
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-slate-800 text-slate-100 rounded-bl-sm'
              }`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <span className="mr-2 text-base">🧠</span>
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-2">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How are you feeling? Press Enter to send…"
            rows={2}
            className="flex-1 resize-none bg-slate-900 border border-slate-600 rounded-xl
                       px-3 py-2 text-sm text-slate-100 placeholder-slate-500
                       focus:outline-none focus:border-brand-500 transition-colors"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="flex-shrink-0 bg-brand-600 hover:bg-brand-700 disabled:opacity-40
                       text-white rounded-xl p-2.5 transition-colors"
            aria-label="Send message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-1 text-center">
          Not a medical diagnosis. For wellbeing support only.
        </p>
      </div>
    </div>
  )
}
