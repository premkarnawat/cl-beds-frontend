/**
 * CL-BEDS WebSocket Client
 * Manages the real-time metrics WebSocket connection with:
 *  - Auto-reconnect with exponential backoff
 *  - Typed message handling
 *  - React hook interface
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'

// ─── Types ────────────────────────────────────────────────────────────────

export interface KeystrokeEvent {
  timestamp: number
  key: string
  event_type: 'keydown' | 'keyup'
  hold_time_ms?: number
  flight_time_ms?: number
}

export interface MouseEvent {
  timestamp: number
  event_type: 'move' | 'click' | 'scroll'
  x: number
  y: number
  velocity?: number
}

export interface RPPGMetric {
  timestamp: number
  bpm: number
  hrv_sdnn?: number
  hrv_rmssd?: number
  signal_quality?: number
}

export interface MetricsBatch {
  type: 'metrics_batch'
  session_id?: string
  keystrokes?: KeystrokeEvent[]
  mouse_events?: MouseEvent[]
  rppg?: RPPGMetric
  text_snippet?: string
}

export interface FusionResult {
  risk_level: 'Low' | 'Medium' | 'High'
  risk_score: number
  confidence: number
}

export interface SHAPDriver {
  feature: string
  impact: number
}

export interface SHAPReport {
  risk_level: string
  confidence: number
  top_drivers: SHAPDriver[]
  session_id?: string
}

export interface LiveRiskResponse {
  type: 'risk_update'
  session_id: string
  timestamp: number
  keystroke_features?: Record<string, number>
  mouse_features?: Record<string, number>
  cmes?: Record<string, number>
  emotion?: string
  fusion: FusionResult
  shap: SHAPReport
}

type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseMetricsWSOptions {
  token: string | null
  sessionId?: string
  onRiskUpdate?: (data: LiveRiskResponse) => void
  autoConnect?: boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useMetricsWS({
  token,
  sessionId,
  onRiskUpdate,
  autoConnect = true,
}: UseMetricsWSOptions) {
  const wsRef           = useRef<WebSocket | null>(null)
  const reconnectTimer  = useRef<ReturnType<typeof setTimeout>>()
  const backoffMs       = useRef(1000)
  const isMountedRef    = useRef(true)

  const [status, setStatus] = useState<WSStatus>('disconnected')
  const [lastUpdate, setLastUpdate] = useState<LiveRiskResponse | null>(null)

  const connect = useCallback(() => {
    if (!token || !isMountedRef.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const params = new URLSearchParams({ token })
    if (sessionId) params.set('session_id', sessionId)
    const url = `${WS_BASE}/ws/metrics?${params.toString()}`

    setStatus('connecting')
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      backoffMs.current = 1000  // reset backoff
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string)
        if (data.type === 'risk_update') {
          setLastUpdate(data as LiveRiskResponse)
          onRiskUpdate?.(data as LiveRiskResponse)
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onerror = () => setStatus('error')

    ws.onclose = (event) => {
      wsRef.current = null
      if (!isMountedRef.current) return
      setStatus('disconnected')

      // Exponential backoff reconnect (up to 30s)
      if (event.code !== 4001) {  // 4001 = auth error, don't retry
        const delay = Math.min(backoffMs.current, 30_000)
        backoffMs.current = delay * 2
        reconnectTimer.current = setTimeout(connect, delay)
      }
    }
  }, [token, sessionId, onRiskUpdate])

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current)
    wsRef.current?.close()
    wsRef.current = null
    setStatus('disconnected')
  }, [])

  const sendBatch = useCallback((batch: MetricsBatch) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(batch))
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    if (autoConnect) connect()
    return () => {
      isMountedRef.current = false
      disconnect()
    }
  }, [connect, disconnect, autoConnect])

  return { status, lastUpdate, connect, disconnect, sendBatch }
}

// ─── Collector helpers ────────────────────────────────────────────────────

/** Attach global keydown/keyup listeners and collect events into a buffer. */
export function createKeystrokeCollector() {
  const buffer: KeystrokeEvent[] = []
  const keydownTimes = new Map<string, number>()
  let lastKeyupTime: number | null = null

  const onKeydown = (e: KeyboardEvent) => {
    const now = performance.now()
    keydownTimes.set(e.key, now)
    const flight = lastKeyupTime !== null ? now - lastKeyupTime : undefined
    buffer.push({
      timestamp: Date.now(),
      key: e.key,
      event_type: 'keydown',
      flight_time_ms: flight,
    })
  }

  const onKeyup = (e: KeyboardEvent) => {
    const now = performance.now()
    const downTime = keydownTimes.get(e.key)
    const hold = downTime !== undefined ? now - downTime : undefined
    keydownTimes.delete(e.key)
    lastKeyupTime = now
    buffer.push({
      timestamp: Date.now(),
      key: e.key,
      event_type: 'keyup',
      hold_time_ms: hold,
    })
  }

  document.addEventListener('keydown', onKeydown)
  document.addEventListener('keyup', onKeyup)

  return {
    flush: (): KeystrokeEvent[] => buffer.splice(0),
    destroy: () => {
      document.removeEventListener('keydown', onKeydown)
      document.removeEventListener('keyup', onKeyup)
    },
  }
}

/** Collect mouse move/click events into a throttled buffer. */
export function createMouseCollector(throttleMs = 50) {
  const buffer: MouseEvent[] = []
  let lastMove = 0
  let lastX = 0, lastY = 0, lastT = 0

  const onMove = (e: globalThis.MouseEvent) => {
    const now = Date.now()
    if (now - lastMove < throttleMs) return
    lastMove = now

    const dt = now - lastT
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    const dist = Math.hypot(dx, dy)
    const velocity = dt > 0 ? dist / dt : 0

    buffer.push({
      timestamp: now,
      event_type: 'move',
      x: e.clientX,
      y: e.clientY,
      velocity,
    })

    lastX = e.clientX
    lastY = e.clientY
    lastT = now
  }

  const onClick = (e: globalThis.MouseEvent) => {
    buffer.push({
      timestamp: Date.now(),
      event_type: 'click',
      x: e.clientX,
      y: e.clientY,
    })
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('click', onClick)

  return {
    flush: (): MouseEvent[] => buffer.splice(0),
    destroy: () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('click', onClick)
    },
  }
}
