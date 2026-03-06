/**
 * RPPGCamera Component
 *
 * Renders a camera toggle card that:
 *  - Shows a live video preview (small, top-right corner)
 *  - Displays real-time BPM and HRV signal quality
 *  - Shows a pulsing heart animation synced to detected BPM
 *  - Handles permission errors gracefully
 *  - Works on mobile (front camera) and desktop (webcam)
 */

import { useEffect, useRef, useState } from 'react'
import { useRPPG, type RPPGStatus } from '@/lib/rppg'
import type { RPPGMetric } from '@/lib/websocket'

interface Props {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  onMetric: (metric: RPPGMetric) => void
}

const STATUS_INFO: Record<RPPGStatus, { label: string; color: string; icon: string }> = {
  idle:                 { label: 'Off',               color: 'text-slate-500',  icon: '○' },
  requesting_permission:{ label: 'Requesting camera…', color: 'text-yellow-400', icon: '◌' },
  active:               { label: 'Measuring…',         color: 'text-green-400',  icon: '●' },
  error:                { label: 'Error',               color: 'text-red-400',    icon: '✕' },
  unsupported:          { label: 'Not supported',       color: 'text-slate-500',  icon: '✕' },
}

// Quality bar colour
function qualityColor(q: number): string {
  if (q >= 0.7) return '#22c55e'
  if (q >= 0.4) return '#f59e0b'
  return '#ef4444'
}

export default function RPPGCamera({ enabled, onToggle, onMetric }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pulseRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [heartPulse, setHeartPulse] = useState(false)

  const { status, statusMsg, latestBPM, signalQuality } = useRPPG({
    enabled,
    onMetric,
  })

  // ── Attach stream to visible preview video ───────────────────────────────
  useEffect(() => {
    if (!enabled || !videoRef.current) return

    // The RPPGProcessor creates its own hidden video internally.
    // For the visible preview we request a second (lightweight) stream,
    // OR we can just share by intercepting – here we open a fresh stream
    // for display only (audio:false, very low quality).
    let previewStream: MediaStream | null = null

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: 120, height: 90 }, audio: false })
      .then((stream) => {
        previewStream = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
      .catch(() => {
        // Preview failed – silent (rPPG still works via main processor)
      })

    return () => {
      previewStream?.getTracks().forEach((t) => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [enabled])

  // ── Heart pulse animation synced to BPM ──────────────────────────────────
  useEffect(() => {
    if (pulseRef.current) clearInterval(pulseRef.current)
    if (!latestBPM || status !== 'active') return

    const intervalMs = (60 / latestBPM) * 1000
    pulseRef.current = setInterval(() => {
      setHeartPulse(true)
      setTimeout(() => setHeartPulse(false), 150)
    }, intervalMs)

    return () => {
      if (pulseRef.current) clearInterval(pulseRef.current)
    }
  }, [latestBPM, status])

  const info = STATUS_INFO[status]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono transition-all duration-150 ${info.color} ${
              status === 'active' ? 'animate-pulse-slow' : ''
            }`}
          >
            {info.icon}
          </span>
          <span className="text-sm font-semibold text-slate-200">Heart Rate (rPPG)</span>
        </div>

        {/* Toggle switch */}
        <label className="relative inline-flex h-5 w-10 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="h-5 w-10 rounded-full bg-slate-700 peer-checked:bg-brand-600
                          after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4
                          after:rounded-full after:bg-white after:transition-all
                          peer-checked:after:translate-x-5 transition-colors" />
        </label>
      </div>

      {/* Content */}
      {!enabled ? (
        <p className="text-xs text-slate-600 text-center py-2">
          Enable to start heart rate monitoring via front camera
        </p>
      ) : (
        <>
          {/* Camera preview + BPM */}
          <div className="flex items-center gap-4">

            {/* Live video preview */}
            <div className="relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden
                            bg-slate-800 border border-slate-700">
              <video
                ref={videoRef}
                className="w-full h-full object-cover scale-x-[-1]"  // mirror for front cam
                playsInline
                muted
                autoPlay
              />
              {status !== 'active' && (
                <div className="absolute inset-0 flex items-center justify-center
                                bg-slate-800/80">
                  <span className="text-slate-500 text-lg">📷</span>
                </div>
              )}

              {/* ROI overlay: shows the sampling zone */}
              {status === 'active' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-8 border border-green-400/60 rounded-sm" />
                </div>
              )}
            </div>

            {/* BPM readout */}
            <div className="flex-1">
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-3xl font-bold font-mono transition-transform duration-150 ${
                    heartPulse ? 'scale-110' : 'scale-100'
                  } ${status === 'active' ? 'text-red-400' : 'text-slate-600'}`}
                >
                  {latestBPM ?? '—'}
                </span>
                <span className="text-xs text-slate-500">BPM</span>
                {status === 'active' && (
                  <span
                    className={`ml-1 text-base transition-transform duration-150 ${
                      heartPulse ? 'scale-125' : 'scale-100'
                    }`}
                  >
                    ❤️
                  </span>
                )}
              </div>

              {/* Status label */}
              <p className={`text-xs mt-0.5 ${info.color}`}>{info.label}</p>

              {/* Signal quality bar */}
              {status === 'active' && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-500">Signal quality</span>
                    <span className="text-xs font-mono text-slate-400">
                      {Math.round(signalQuality * 100)}%
                    </span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${signalQuality * 100}%`,
                        background: qualityColor(signalQuality),
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {(status === 'error' || status === 'unsupported') && (
            <div className="bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
              <p className="text-xs text-red-400">
                {statusMsg || 'Camera unavailable'}
              </p>
              {status === 'error' && (
                <p className="text-xs text-slate-500 mt-1">
                  On mobile: check camera permissions in browser/app settings.
                </p>
              )}
            </div>
          )}

          {/* Tips when active but no reading yet */}
          {status === 'active' && !latestBPM && (
            <p className="text-xs text-slate-600 text-center">
              Hold still and ensure your face is visible to the camera…
            </p>
          )}
        </>
      )}
    </div>
  )
}
