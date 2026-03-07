/**
 * CL-BEDS Dashboard — Premium Glassmorphism UI
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import BurnoutGauge from '@/components/BurnoutGauge'
import RiskTrendChart from '@/components/RiskTrendChart'
import ShapCards from '@/components/ShapCards'
import RPPGCamera from '@/components/RPPGCamera'
import { dashboardApi, type RiskTrendPoint, type SHAPReport } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { RPPGMetric } from '@/lib/websocket'
import { createKeystrokeCollector, createMouseCollector, type LiveRiskResponse, useMetricsWS } from '@/lib/websocket'
import { GlassCard, PageWrap, PageHeader, SectionTitle, Badge } from '@/components/GlassUI'

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
  const latestRPPGRef     = useRef<RPPGMetric | null>(null)

  useEffect(() => {
    if (!token) return
    dashboardApi.getRiskTrend(token, 50).then(setTrendData).catch(() => {})
    dashboardApi.getLatestSHAP(token).then(setShapReport).catch(() => {})
  }, [token])

  const handleRPPGMetric = useCallback((metric: RPPGMetric) => {
    latestRPPGRef.current = metric
    setLatestRPPG(metric)
  }, [])

  const handleRiskUpdate = useCallback((data: LiveRiskResponse) => {
    setLatestRisk(data)
    setShapReport(data.shap)
    setTrendData(prev => [...prev.slice(-99), {
      timestamp:       new Date(data.timestamp * 1000).toISOString(),
      risk_score:      data.fusion.risk_score,
      risk_level:      data.fusion.risk_level,
      cmes_index:      data.cmes?.cmes_index ?? 0,
      hrv_stress:      latestRPPGRef.current ? Math.min(Math.max((latestRPPGRef.current.bpm - 60) / 60, 0), 1) : 0.5,
      backspace_ratio: data.keystroke_features?.backspace_ratio ?? 0,
    }])
  }, [])

  const { status, sendBatch, connect, disconnect } = useMetricsWS({
    token: token ?? null, sessionId, onRiskUpdate: handleRiskUpdate, autoConnect: false,
  })
  useEffect(() => { setWsStatus(status) }, [status])

  const startMonitoring = async () => {
    if (!token) return
    const session = await dashboardApi.createSession(token, 'Live Session')
    setSessionId(session.id)
    ksCollectorRef.current    = createKeystrokeCollector()
    mouseCollectorRef.current = createMouseCollector()
    connect(); setIsMonitoring(true)
    sendIntervalRef.current = setInterval(() => {
      sendBatch({ type:'metrics_batch', session_id:session.id, keystrokes:ksCollectorRef.current?.flush()??[], mouse_events:mouseCollectorRef.current?.flush()??[], rppg:latestRPPGRef.current??undefined })
    }, WS_SEND_INTERVAL_MS)
  }

  const stopMonitoring = () => {
    clearInterval(sendIntervalRef.current)
    ksCollectorRef.current?.destroy(); mouseCollectorRef.current?.destroy()
    disconnect(); setIsMonitoring(false); setSessionId(undefined)
  }

  const riskScore  = latestRisk?.fusion.risk_score  ?? 0
  const riskLevel  = (latestRisk?.fusion.risk_level ?? 'Low') as 'Low'|'Medium'|'High'
  const confidence = latestRisk?.fusion.confidence  ?? 0

  const wsColor = { connected:'#22c55e', connecting:'#eab308', disconnected:'rgba(255,255,255,0.2)', error:'#ef4444' }

  return (
    <PageWrap>
      <PageHeader
        title="Live Dashboard"
        subtitle="Real-time cognitive load & burnout monitoring"
        action={
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:wsColor[wsStatus as keyof typeof wsColor]??'rgba(255,255,255,0.2)', boxShadow:`0 0 8px ${wsColor[wsStatus as keyof typeof wsColor]??'transparent'}` }} />
              <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', textTransform:'capitalize' }}>{wsStatus}</span>
            </div>
            <button onClick={isMonitoring ? stopMonitoring : startMonitoring} style={{
              padding:'0.6rem 1.25rem', border:'none', borderRadius:10, cursor:'pointer', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.85rem',
              background: isMonitoring ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg,#6366f1,#a855f7)',
              color: isMonitoring ? '#fca5a5' : '#fff', border: isMonitoring ? '1px solid rgba(239,68,68,0.3)' : 'none',
              boxShadow: isMonitoring ? 'none' : '0 4px 20px rgba(99,102,241,0.35)', transition:'all 0.2s'
            }}>
              {isMonitoring ? '⏹ Stop' : '▶ Start Monitoring'}
            </button>
          </div>
        }
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16, marginBottom:16 }}>
        {/* Gauge */}
        <GlassCard style={{ padding:24, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <BurnoutGauge score={riskScore} riskLevel={riskLevel} confidence={confidence} />
        </GlassCard>

        {/* Live signals */}
        <GlassCard style={{ padding:24 }}>
          <SectionTitle>Live Signals</SectionTitle>
          {latestRisk ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <SignalRow label="CMES Index"      value={latestRisk.cmes?.cmes_index} />
              <SignalRow label="Emotion"         valueStr={latestRisk.emotion ?? 'Neutral'} />
              <SignalRow label="Backspace Ratio" value={latestRisk.keystroke_features?.backspace_ratio} unit="%" scale={100} />
              <SignalRow label="Mouse Stiffness" value={latestRisk.mouse_features?.stiffness_score} />
              <SignalRow label="Typing Speed"    value={latestRisk.keystroke_features?.typing_speed_wpm} unit=" WPM" />
              {latestRPPG && <>
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', margin:'4px 0' }} />
                <SignalRow label="❤️ Heart Rate"  valueStr={`${latestRPPG.bpm} BPM`} accent />
                <SignalRow label="HRV SDNN"       valueStr={`${(latestRPPG.hrv_sdnn??0).toFixed(1)} ms`} />
                <SignalRow label="HRV RMSSD"      valueStr={`${(latestRPPG.hrv_rmssd??0).toFixed(1)} ms`} />
                <SignalRow label="Signal Quality" valueStr={`${Math.round((latestRPPG.signal_quality??0)*100)}%`} />
              </>}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'2rem 0', color:'rgba(255,255,255,0.2)', fontSize:'0.875rem' }}>
              Start monitoring to see live data
            </div>
          )}
        </GlassCard>

        {/* SHAP */}
        <GlassCard style={{ padding:24 }}>
          <ShapCards report={shapReport} />
        </GlassCard>
      </div>

      {/* rPPG Camera */}
      <div style={{ marginBottom:16 }}>
        <RPPGCamera enabled={rppgEnabled} onToggle={setRppgEnabled} onMetric={handleRPPGMetric} />
      </div>

      {/* Trend Chart */}
      <GlassCard style={{ padding:24 }}>
        <SectionTitle>Risk Trend</SectionTitle>
        <RiskTrendChart data={trendData} />
      </GlassCard>
    </PageWrap>
  )
}

function SignalRow({ label, value, valueStr, unit='', scale=1, accent }: {
  label:string; value?:number|null; valueStr?:string; unit?:string; scale?:number; accent?:boolean
}) {
  const display = valueStr !== undefined ? valueStr : value!=null ? `${(value*scale).toFixed(2)}${unit}` : '—'
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)' }}>{label}</span>
      <span style={{ fontSize:'0.8rem', fontFamily:'monospace', fontWeight:600, color: accent ? '#a78bfa' : 'rgba(255,255,255,0.8)' }}>{display}</span>
    </div>
  )
}
