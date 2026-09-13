import { Map, CheckCircle2, Clock, CircleDot, ChevronRight } from 'lucide-react'

export default function RoadmapRenderer({ data }) {
  const stages = Array.isArray(data?.stages)
    ? data.stages
    : Array.isArray(data?.phases)
    ? data.phases
    : []

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          pill: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300/90',
          dot: 'bg-emerald-400',
        }
      case 'current':
      case 'in_progress':
      case 'active':
        return {
          icon: <Clock className="w-4 h-4 text-[#e5c76b]" />,
          pill: 'bg-[#d4af37]/15 border-[#d4af37]/35 text-[#e5c76b]',
          dot: 'bg-[#e5c76b] animate-pulse',
        }
      default:
        return {
          icon: <CircleDot className="w-4 h-4 text-[#a89878]/60" />,
          pill: 'bg-white/[0.04] border-white/[0.08] text-[#a89878]',
          dot: 'bg-white/30',
        }
    }
  }

  return (
    <div className="w-full flex flex-col gap-3 p-3 bg-[#0a0a0c]/40 rounded-xl">
      <div className="flex flex-col gap-2.5">
        {stages.map((stage, idx) => {
          const status = stage.status || 'upcoming'
          const badge = getStatusBadge(status)
          const milestones = Array.isArray(stage.milestones)
            ? stage.milestones
            : Array.isArray(stage.tasks)
            ? stage.tasks
            : []

          return (
            <div
              key={idx}
              className="flex flex-col rounded-xl border border-[#2d2a24] bg-[#0e0e11] overflow-hidden hover:border-[#d4af37]/35 transition-all duration-150"
            >
              {/* Stage Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#121216] border-b border-[#2d2a24]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#d4af37]/10 border border-[#d4af37]/25 flex items-center justify-center text-xs font-semibold text-[#e5c76b]">
                    {stage.stage || idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#f0e6d3]">{stage.title || `Stage ${idx + 1}`}</h4>
                    {stage.duration && (
                      <span className="text-[10.5px] text-[#a89878] font-mono">
                        ⏱ {stage.duration}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border border-[#2d2a24] bg-[#141417] text-[#c9bda2]"
                >
                  {badge.icon}
                  <span>{status}</span>
                </span>
              </div>

              {/* Milestones / Checklist */}
              {milestones.length > 0 && (
                <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {milestones.map((m, mIdx) => {
                    const label = typeof m === 'string' ? m : (m.title || m.label || 'Milestone')
                    const isDone = typeof m === 'object' ? m.completed : status === 'completed'

                    return (
                      <div
                        key={mIdx}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#141417] border border-[#2d2a24] text-xs text-[#c9bda2]"
                      >
                        <ChevronRight className="w-3 h-3 text-[#d4af37]" />
                        <span className={isDone ? 'line-through text-[#a89878]/40' : 'text-[#f0e6d3] font-normal'}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
