/**
 * Chat Page – full-screen AI coach interface
 */

import { useState } from 'react'
import ChatWidget from '@/components/ChatWidget'

export default function ChatPage() {
  const [open, setOpen] = useState(true)

  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">AI Wellbeing Coach</h1>
        <p className="text-sm text-slate-400 mt-1">
          Dr. BEDS – CBT-based cognitive load & burnout coach
        </p>
      </div>

      {/* Inline full-height chat on desktop, floating on mobile */}
      <div className="hidden lg:flex flex-col bg-slate-900 border border-slate-800
                      rounded-2xl overflow-hidden h-[calc(100vh-14rem)]">

        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-800/50">
          <span className="text-2xl">🧠</span>
          <div>
            <p className="font-semibold text-white">Dr. BEDS</p>
            <p className="text-xs text-slate-400">
              Powered by {import.meta.env.VITE_LLM_MODEL ?? 'AI'} · Not a medical service
            </p>
          </div>
          <div className="ml-auto">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1.5" />
            <span className="text-xs text-slate-400">Online</span>
          </div>
        </div>

        {/* Reuse ChatWidget in "embedded" mode */}
        <ChatWidget isOpen onClose={() => {}} />
      </div>

      {/* Mobile: floating button */}
      <div className="lg:hidden">
        <p className="text-slate-400 text-sm mb-4">
          Tap the button below to open the AI coach.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white rounded-full
                     px-6 py-3 font-medium flex items-center gap-2"
        >
          <span>🧠</span> Open Dr. BEDS
        </button>
        <ChatWidget isOpen={open} onClose={() => setOpen(false)} />
      </div>
    </div>
  )
}
