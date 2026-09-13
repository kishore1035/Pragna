import { Calendar, CheckCircle2, Clock, CircleDot } from 'lucide-react'

export default function TimelineRenderer({ data }) {
  const events = Array.isArray(data?.events)
    ? data.events
    : Array.isArray(data?.milestones)
    ? data.milestones
    : []

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          pill: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300/90',
          dot: 'bg-emerald-400 ring-emerald-400/30',
        }
      case 'in_progress':
      case 'current':
      case 'active':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-[#e5c76b]" />,
          pill: 'bg-[#d4af37]/15 border-[#d4af37]/35 text-[#e5c76b]',
          dot: 'bg-[#e5c76b] ring-[#d4af37]/40 animate-pulse',
        }
      default:
        return {
          icon: <CircleDot className="w-3.5 h-3.5 text-[#a89878]/60" />,
          pill: 'bg-white/[0.04] border-white/[0.08] text-[#a89878]',
          dot: 'bg-white/30 ring-white/10',
        }
    }
  }

  return (
    <div className="w-full flex flex-col p-3 bg-[#0a0a0c]/40 rounded-xl">
      <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2d2a24]">
        {events.map((evt, idx) => {
          const badge = getStatusBadge(evt.status)

          return (
            <div key={idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className="absolute -left-[16px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#d4af37]"
              />

              {/* Event Content Card */}
              <div className="p-3 rounded-xl border border-[#2d2a24] bg-[#0e0e11] hover:border-[#d4af37]/35 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-normal text-[#e5c76b] bg-[#141417] px-2 py-0.5 rounded border border-[#2d2a24]">
                    <Calendar className="w-3 h-3 text-[#a89878]" />
                    <span>{evt.date || evt.time || evt.period || `Step ${idx + 1}`}</span>
                  </div>

                  {evt.status && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-medium uppercase tracking-wider border border-[#2d2a24] bg-[#141417] text-[#a89878]"
                    >
                      {badge.icon}
                      <span>{evt.status}</span>
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-semibold text-[#f0e6d3]">{evt.title || evt.name || 'Milestone'}</h4>

                {evt.description && (
                  <p className="text-[11.5px] text-[#a89878] mt-1 leading-relaxed">{evt.description}</p>
                )}

                {Array.isArray(evt.highlights) && evt.highlights.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {evt.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="text-[11px] text-[#a89878] flex items-start gap-1.5">
                        <span className="text-[#d4af37] mt-0.5">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
