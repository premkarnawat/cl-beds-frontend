/**
 * CL-BEDS Dashboard Page
 * Real-time burnout monitoring with live WebSocket + rPPG camera data.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import BurnoutGauge from '@/components/BurnoutGauge'
import RiskTrendChart from '@/components/RiskTrendChart'
import ShapCards from '@/components/ShapCards'
import RPPGCamera from '@/components/RPPGCamera'
import { dashboardApi, type RiskTrendPoint, type SHAPReport } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { RPPGMetric } from '@/lib/websocket'
import {
  createKeystrokeCollector,
  createMouseCollector,
  type LiveRiskResponse,
  useMetricsWS,
} from '@/lib/websocket'

const WS_SEND_INTERVAL_MS = 5_000

export default function DashboardPage() {
  const { token } = useAuth()

  const [trendData, setTrendData]     = useState<RiskTrendPoint[]>([])
  const [shapReport, setShapReport]   = useState<SHAPReport | null>(null)
  const [latestRisk, setLatestRisk]   = useState<LiveRiskResponse | null>(null)
  const [sessionId, setSessionId]     = useState<string | undefined>()
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [wsStatus, setWsStatus]       = useState<string>('disconnected')
  const [rppgEnabled, setRppgEnabled] = useState(false)
  const [latestRPPG, setLatestRPPG]   = useState<RPPGMetric | null>(null)

  const ksCollectorRef    = useRef<ReturnType<typeof createKeystrokeCollector>>()
  const mouseCollectorRef = useRef<ReturnType<typeof createMouseCollector>>()
  const sendIntervalRef   = useRef<ReturnType<typeof setInterval>>()
  // Mutable ref so sendInterval always gets latest rPPG value
  const latestRPPGRef = useRef<RPPGMetric | null>(null)

  // ── Fetch initial data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return
    dashboardApi.getRiskTrend(token, 50).then(setTrendData).catch(() => {})
    dashboardApi.getLatestSHAP(token).then(setShapReport).catch(() => {})
  }, [token])

  // ── rPPG callback ───────────────────────────────────────────────────────
  const handleRPPGMetric = useCallback((metric: RPPGMetric) => {
    latestRPPGRef.current = metric
    setLatestRPPG(metric)
  }, [])

  // ── WS risk update ──────────────────────────────────────────────────────
  const handleRiskUpdate = useCallback((data: LiveRiskResponse) => {
    setLatestRisk(data)
    setShapReport(data.shap)
    setTrendData((prev) => [
      ...prev.slice(-99),
      {
        timestamp:       new Date(data.timestamp * 1000).toISOString(),
        risk_score:      data.fusion.risk_score,
        risk_level:      data.fusion.risk_level,
        cmes_index:      data.cmes?.cmes_index ?? 0,
        hrv_stress:      latestRPPGRef.current
          ? Math.min(Math.max((latestRPPGRef.current.bpm - 60) / 60, 0), 1)
          : 0.5,
        backspace_ratio: data.keystroke_features?.backspace_ratio ?? 0,
      },
    ])
  }, [])

  const { status, sendBatch, connect, disconnect } = useMetricsWS({
    token: token ?? null,
    sessionId,
    onRiskUpdate: handleRiskUpdate,
    autoConnect: false,
  })

  useEffect(() => { setWsStatus(status) }, [status])

  // ── Start monitoring ────────────────────────────────────────────────────
  const startMonitoring = async () => {
    if (!token) return
    const session = await dashboardApi.createSession(token, 'Live Session')
    setSessionId(session.id)

    ksCollectorRef.current    = createKeystrokeCollector()
    mouseCollectorRef.current = createMouseCollector()

    connect()
    setIsMonitoring(true)

    sendIntervalRef.current = setInterval(() => {
      const ks    = ksCollectorRef.current?.flush() ?? []
      const mouse = mouseCollectorRef.current?.flush() ?? []
      const rppg  = latestRPPGRef.current ?? undefined   // ← real heart rate

      sendBatch({
        type:         'metrics_batch',
        session_id:   session.id,
        keystrokes:   ks,
        mouse_events: mouse,
        rppg,
      })
    }, WS_SEND_INTERVAL_MS)
  }

  // ── Stop monitoring ─────────────────────────────────────────────────────
  const stopMonitoring = () => {
    clearInterval(sendIntervalRef.current)
    ksCollectorRef.current?.destroy()
    mouseCollectorRef.current?.destroy()
    disconnect()
    setIsMonitoring(false)
    setSessionId(undefined)
  }

  const riskScore  = latestRisk?.fusion.risk_score  ?? 0
  const riskLevel  = (latestRisk?.fusion.risk_level ?? 'Low') as 'Low' | 'Medium' | 'High'
  const confidence = latestRisk?.fusion.confidence  ?? 0

  const statusColors: Record<string, string> = {
    connected:    'bg-green-500',
    connecting:   'bg-yellow-500',
    disconnected: 'bg-slate-500',
    error:        'bg-red-500',
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Live Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time cognitive load & burnout monitoring
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${statusColors[wsStatus] ?? 'bg-slate-500'}`} />
            <span className="text-xs text-slate-400 capitalize">{wsStatus}</span>
          </div>
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              isMonitoring
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-brand-600 hover:bg-brand-700 text-white'
            }`}
          >
            {isMonitoring ? '⏹ Stop Monitoring' : '▶ Start Monitoring'}
          </button>
        </div>
      </div>

      {/* Top grid: Gauge + Signals + SHAP */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Burnout Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6
                        flex items-center justify-center">
          <BurnoutGauge score={riskScore} riskLevel={riskLevel} confidence={confidence} />
        </div>

        {/* Live signal readings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
            Live Signals
          </h2>

          {latestRisk ? (
            <div className="space-y-2.5">
              <MetricRow label="CMES Index"      value={latestRisk.cmes?.cmes_index} />
              <MetricRow label="Emotion"         valueStr={latestRisk.emotion ?? 'Neutral'} />
              <MetricRow label="Backspace Ratio" value={latestRisk.keystroke_features?.backspace_ratio} unit="%" scale={100} />
              <MetricRow label="Mouse Stiffness" value={latestRisk.mouse_features?.stiffness_score} />
              <MetricRow label="Typing Speed"    value={latestRisk.keystroke_features?.typing_speed_wpm} unit=" WPM" />
            </div>
          ) : (
            <p className="text-sm text-slate-600 text-center py-6">
              Start monitoring to see live data
            </p>
          )}

          {/* rPPG readings */}
          {latestRPPG && (
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <MetricRow label="❤️ Heart Rate"  valueStr={`${latestRPPG.bpm} BPM`} />
              <MetricRow label="HRV SDNN"       valueStr={`${(latestRPPG.hrv_sdnn ?? 0).toFixed(1)} ms`} />
              <MetricRow label="HRV RMSSD"      valueStr={`${(latestRPPG.hrv_rmssd ?? 0).toFixed(1)} ms`} />
              <MetricRow
                label="Signal Quality"
                valueStr={`${Math.round((latestRPPG.signal_quality ?? 0) * 100)}%`}
              />
            </div>
          )}
        </div>

        {/* SHAP feature cards */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5
                        md:col-span-2 xl:col-span-1">
          <ShapCards report={shapReport} />
        </div>
      </div>

      {/* rPPG Camera Card */}
      <RPPGCamera
        enabled={rppgEnabled}
        onToggle={setRppgEnabled}
        onMetric={handleRPPGMetric}
      />

      {/* Risk trend chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Risk Trend
        </h2>
        <RiskTrendChart data={trendData} />
      </div>

    </div>
  )
}

// ─── Helper sub-component ─────────────────────────────────────────────────
function MetricRow({
  label,
  value,
  valueStr,
  unit = '',
  scale = 1,
}: {
  label:     string
  value?:    number | null
  valueStr?: string
  unit?:     string
  scale?:    number
}) {
  const display =
    valueStr !== undefined
      ? valueStr
      : value !== undefined && value !== null
      ? `${(value * scale).toFixed(2)}${unit}`
      : '—'

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-mono font-medium text-slate-200">{display}</span>
    </div>
  )
}
