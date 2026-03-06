/**
 * ShapCards – displays top SHAP feature drivers as visual cards.
 */

import type { SHAPReport } from '@/lib/api'

interface Props {
  report: SHAPReport | null
}

const FEATURE_ICONS: Record<string, string> = {
  CMES:            '🔄',
  HRV_Stress:      '💓',
  Backspace_Ratio: '⌫',
  Mouse_Stiffness: '🖱️',
  Sentiment:       '🧠',
}

const FEATURE_LABELS: Record<string, string> = {
  CMES:            'Cross-Modal Entropy',
  HRV_Stress:      'Heart Rate Variability',
  Backspace_Ratio: 'Typing Corrections',
  Mouse_Stiffness: 'Mouse Stiffness',
  Sentiment:       'Emotional Tone',
}

export default function ShapCards({ report }: Props) {
  if (!report) {
    return (
      <div className="text-slate-500 text-sm text-center py-8">
        No SHAP data available yet.
      </div>
    )
  }

  const maxAbs = Math.max(...report.top_drivers.map((d) => Math.abs(d.impact)), 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Top Risk Drivers
        </h3>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background:
              report.risk_level === 'High'
                ? '#ef444422'
                : report.risk_level === 'Medium'
                ? '#f59e0b22'
                : '#22c55e22',
            color:
              report.risk_level === 'High'
                ? '#ef4444'
                : report.risk_level === 'Medium'
                ? '#f59e0b'
                : '#22c55e',
          }}
        >
          {report.risk_level} Risk · {Math.round(report.confidence * 100)}%
        </span>
      </div>

      {report.top_drivers.map((driver) => {
        const pct = (Math.abs(driver.impact) / maxAbs) * 100
        const isPositive = driver.impact > 0
        const barColor = isPositive ? '#ef4444' : '#22c55e'

        return (
          <div key={driver.feature} className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  {FEATURE_ICONS[driver.feature] ?? '📊'}
                </span>
                <span className="text-sm font-medium text-slate-200">
                  {FEATURE_LABELS[driver.feature] ?? driver.feature}
                </span>
              </div>
              <span
                className="text-xs font-mono font-bold"
                style={{ color: barColor }}
              >
                {isPositive ? '+' : ''}{driver.impact.toFixed(1)}
              </span>
            </div>

            {/* Impact bar */}
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>

            <p className="text-xs text-slate-500 mt-1">
              {isPositive
                ? 'Increases burnout risk'
                : 'Reduces burnout risk'}
            </p>
          </div>
        )
      })}
    </div>
  )
}
