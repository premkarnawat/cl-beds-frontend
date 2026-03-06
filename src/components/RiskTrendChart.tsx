/**
 * RiskTrendChart – multi-line Recharts chart for risk_score, cmes_index, hrv_stress
 */

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RiskTrendPoint } from '@/lib/api'

interface Props {
  data: RiskTrendPoint[]
  height?: number
}

const COLORS = {
  risk_score:      '#ef4444',
  cmes_index:      '#6366f1',
  hrv_stress:      '#22c55e',
  backspace_ratio: '#f59e0b',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function RiskTrendChart({ data, height = 280 }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No trend data yet – start a monitoring session.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    time:           formatTime(d.timestamp),
    risk_score:     +(d.risk_score * 100).toFixed(1),
    cmes_index:     +(d.cmes_index * 100).toFixed(1),
    hrv_stress:     +(d.hrv_stress * 100).toFixed(1),
    backspace_ratio:+(d.backspace_ratio * 100).toFixed(1),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#334155' }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
          itemStyle={{ color: '#cbd5e1' }}
          formatter={(val: number) => [`${val}%`]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}
          formatter={(name) => name.replace(/_/g, ' ')}
        />
        {Object.entries(COLORS).map(([key, color]) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
