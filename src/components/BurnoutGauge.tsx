/**
 * BurnoutGauge – SVG arc gauge displaying real-time burnout risk.
 */

import { useEffect, useRef } from 'react'

interface BurnoutGaugeProps {
  score: number          // 0–1
  riskLevel: 'Low' | 'Medium' | 'High' | string
  confidence: number     // 0–1
  size?: number
}

const RISK_COLORS = {
  Low:    '#22c55e',
  Medium: '#f59e0b',
  High:   '#ef4444',
}

export default function BurnoutGauge({
  score,
  riskLevel,
  confidence,
  size = 220,
}: BurnoutGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const color = RISK_COLORS[riskLevel as keyof typeof RISK_COLORS] ?? '#6366f1'
  const angle = score * Math.PI  // 0 → π  (semi-circle)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const cx = size / 2
    const cy = size * 0.68
    const radius = size * 0.38

    ctx.clearRect(0, 0, size, size)

    // Background track
    ctx.beginPath()
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = size * 0.09
    ctx.lineCap = 'round'
    ctx.stroke()

    // Filled arc
    const endAngle = Math.PI + angle
    ctx.beginPath()
    ctx.arc(cx, cy, radius, Math.PI, endAngle)
    ctx.strokeStyle = color
    ctx.lineWidth = size * 0.09
    ctx.lineCap = 'round'
    ctx.stroke()

    // Needle
    const needleAngle = Math.PI + angle
    const nx = cx + (radius) * Math.cos(needleAngle)
    const ny = cy + (radius) * Math.sin(needleAngle)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(nx, ny)
    ctx.strokeStyle = '#f8fafc'
    ctx.lineWidth = size * 0.02
    ctx.lineCap = 'round'
    ctx.stroke()

    // Center dot
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.035, 0, 2 * Math.PI)
    ctx.fillStyle = '#f8fafc'
    ctx.fill()

    // Labels: 0  50  100
    ctx.font = `bold ${size * 0.07}px Inter, sans-serif`
    ctx.fillStyle = '#94a3b8'
    ctx.textAlign = 'left'
    ctx.fillText('0', cx - radius - size * 0.04, cy + size * 0.08)
    ctx.textAlign = 'center'
    ctx.fillText('50', cx, cy - radius - size * 0.04)
    ctx.textAlign = 'right'
    ctx.fillText('100', cx + radius + size * 0.04, cy + size * 0.08)
  }, [score, color, size, angle])

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <canvas
        ref={canvasRef}
        width={size}
        height={size * 0.75}
        style={{ width: size, height: size * 0.75 }}
        aria-label={`Burnout risk gauge: ${riskLevel}`}
      />

      {/* Score text */}
      <div className="flex flex-col items-center -mt-4">
        <span className="text-4xl font-bold" style={{ color }}>
          {Math.round(score * 100)}
        </span>
        <span className="text-xs uppercase tracking-widest text-slate-400 mt-1">
          Risk Score
        </span>
        <span
          className="mt-2 px-3 py-0.5 rounded-full text-sm font-semibold"
          style={{ background: `${color}22`, color }}
        >
          {riskLevel} Risk
        </span>
        <span className="text-xs text-slate-500 mt-1">
          Confidence: {Math.round(confidence * 100)}%
        </span>
      </div>
    </div>
  )
}
