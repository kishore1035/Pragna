import { useState } from 'react'
import { BarChart3, LineChart, PieChart, Info } from 'lucide-react'

export default function ChartRenderer({ data }) {
  const chartType = (data?.chartType || data?.type || 'bar').toLowerCase()
  const labels = Array.isArray(data?.labels) ? data.labels : []
  const datasets = Array.isArray(data?.datasets)
    ? data.datasets
    : Array.isArray(data?.series)
    ? data.series
    : [{ label: 'Data', values: Array.isArray(data?.values) ? data.values : [] }]

  const [activeIdx, setActiveIdx] = useState(null)

  // Calculate max value for auto scaling
  const allValues = datasets.flatMap((d) => (Array.isArray(d.values) ? d.values : []))
  const maxVal = Math.max(...allValues, 1)

  // Color palette: Obsidian Gold variants
  const palette = [
    '#e5c76b', // Soft Gold
    '#d4af37', // Metallic Gold
    '#b8860b', // Deep Antique Gold
    '#e5b84b', // Warm Amber Gold
    '#c49a32', // Muted Gold
  ]

  // Render Bar Chart
  const renderBarChart = () => {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-end gap-3 h-48 pt-6 pb-2 px-3 border-b border-l border-[#d4af37]/25 bg-[#0a0a0c]/80 rounded-lg">
          {labels.map((label, idx) => {
            const firstSet = datasets[0]
            const val = firstSet?.values?.[idx] ?? 0
            const heightPercent = Math.max(8, Math.min(100, (val / maxVal) * 100))
            const isHovered = activeIdx === idx

            return (
              <div
                key={idx}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-9 px-2 py-1 bg-[#121215] border border-[#d4af37]/50 rounded text-[11px] text-[#e5c76b] font-mono shadow-lg whitespace-nowrap z-10 animate-fadeIn">
                    {firstSet?.label ? `${firstSet.label}: ` : ''}{val}
                  </div>
                )}

                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[40px] rounded-t-md transition-all duration-300 ${
                    isHovered
                      ? 'bg-gradient-to-t from-[#d4af37] to-[#e5c76b] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-y-105'
                      : 'bg-gradient-to-t from-[#a3862c]/60 to-[#d4af37]/80 hover:brightness-125'
                  }`}
                />
              </div>
            )
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between px-3 text-[11px] text-[#a89878] font-medium">
          {labels.map((label, idx) => (
            <div
              key={idx}
              className={`flex-1 text-center truncate ${activeIdx === idx ? 'text-[#e5c76b] font-bold' : ''}`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render Donut / Pie Chart
  const renderDonutChart = () => {
    const dataset = datasets[0] || { values: [] }
    const values = dataset.values || []
    const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0) || 1

    let cumulativeAngle = 0

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4">
        {/* SVG Donut */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {values.map((val, idx) => {
              const fraction = (Number(val) || 0) / total
              const strokeDasharray = `${fraction * 251.2} 251.2`
              const strokeDashoffset = -cumulativeAngle * 251.2
              cumulativeAngle += fraction

              const isHovered = activeIdx === idx
              const color = palette[idx % palette.length]

              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={color}
                  strokeWidth={isHovered ? '18' : '14'}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseLeave={() => setActiveIdx(null)}
                  className="transition-all duration-200 cursor-pointer"
                />
              )
            })}
          </svg>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-[#a89878]">Total</span>
            <span className="text-sm font-bold text-[#e5c76b]">{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          {labels.map((label, idx) => {
            const val = values[idx] ?? 0
            const pct = Math.round(((Number(val) || 0) / total) * 100)
            const isHovered = activeIdx === idx

            return (
              <div
                key={idx}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                className={`flex items-center gap-2.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? 'bg-[#d4af37]/15' : 'hover:bg-white/[0.04]'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: palette[idx % palette.length] }}
                />
                <span className="text-xs text-[#f0e6d3] font-medium">{label}</span>
                <span className="text-xs font-mono text-[#e5c76b] ml-auto font-semibold">
                  {val} ({pct}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render Line Chart
  const renderLineChart = () => {
    const dataset = datasets[0] || { values: [] }
    const values = dataset.values || []
    const count = values.length
    if (count < 2) return renderBarChart()

    const stepX = 260 / (count - 1)
    const points = values
      .map((v, i) => {
        const y = 90 - (Number(v) / maxVal) * 75
        return `${20 + i * stepX},${y}`
      })
      .join(' ')

    return (
      <div className="w-full flex flex-col gap-3">
        <div className="w-full bg-[#0a0a0c]/80 rounded-lg p-2 border border-[#d4af37]/25">
          <svg viewBox="0 0 300 110" className="w-full h-44 overflow-visible">
            {/* Grid lines */}
            <line x1="20" y1="15" x2="280" y2="15" stroke="rgba(212,175,55,0.12)" strokeDasharray="3 3" />
            <line x1="20" y1="52" x2="280" y2="52" stroke="rgba(212,175,55,0.12)" strokeDasharray="3 3" />
            <line x1="20" y1="90" x2="280" y2="90" stroke="rgba(212,175,55,0.25)" />

            {/* Polyline */}
            <polyline
              fill="none"
              stroke="#d4af37"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* Data Dots */}
            {values.map((v, idx) => {
              const x = 20 + idx * stepX
              const y = 90 - (Number(v) / maxVal) * 75
              const isHovered = activeIdx === idx

              return (
                <g key={idx} className="cursor-pointer" onMouseEnter={() => setActiveIdx(idx)} onMouseLeave={() => setActiveIdx(null)}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#e5c76b"
                    stroke="#0b0b0e"
                    strokeWidth="2"
                    className="transition-all"
                  />
                  {isHovered && (
                    <text x={x} y={y - 8} textAnchor="middle" fill="#e5c76b" fontSize="9" fontWeight="bold">
                      {v}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Labels */}
        <div className="flex justify-between px-4 text-[11px] text-[#a89878]">
          {labels.map((l, idx) => (
            <span key={idx} className={activeIdx === idx ? 'text-[#e5c76b] font-bold' : ''}>
              {l}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-3 p-3 bg-[#0a0a0c]/40 rounded-xl">
      {chartType === 'donut' || chartType === 'pie'
        ? renderDonutChart()
        : chartType === 'line'
        ? renderLineChart()
        : renderBarChart()}
    </div>
  )
}
