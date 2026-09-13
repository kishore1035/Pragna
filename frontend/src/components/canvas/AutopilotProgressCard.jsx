import { Sparkles, Check, Circle, CircleDot, Pencil } from 'lucide-react'

export default function AutopilotProgressCard({ isStreaming = false, onEdit, onMakeItReal }) {
  const steps = [
    { label: 'Intent identified', state: 'done' },
    { label: 'Structure generated', state: 'done' },
    { label: 'Building visualization', state: isStreaming ? 'active' : 'done' },
    { label: 'Finalizing', state: isStreaming ? 'pending' : 'done' },
  ]

  const getStepIcon = (state) => {
    switch (state) {
      case 'done':
        return <span className="text-[#d4af37] font-bold text-xs">✓</span>
      case 'active':
        return <span className="w-2 h-2 rounded-full bg-[#e5c76b] animate-ping" />
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-[#a89878]/30" />
    }
  }

  return (
    <div className="w-full my-2.5 p-3.5 rounded-xl border border-[#2d2a24] bg-[#0c0c0e]/90 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex flex-col gap-2.5 transition-all duration-200 hover:border-[#d4af37]/35">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[#d4af37]/10 border border-[#d4af37]/25">
            <Sparkles className="w-3.5 h-3.5 text-[#e5c76b]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#e5c76b]">
              PRAGNA AUTOPILOT
            </span>
            <span className="text-[11px] text-[#a89878]">
              {isStreaming ? 'Understanding your request...' : 'Workflow executed successfully'}
            </span>
          </div>
        </div>

        {!isStreaming && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25 text-[#f0e6d3] font-medium">
            Complete
          </span>
        )}
      </div>

      {/* Progress Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#2d2a24]/60 text-[11px]">
        {steps.map((s, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className="w-3.5 flex items-center justify-center">
              {getStepIcon(s.state)}
            </div>
            <span className={s.state === 'active' ? 'text-[#e5c76b] font-medium' : s.state === 'done' ? 'text-[#f0e6d3]' : 'text-[#a89878]/50'}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Action shortcuts once completed */}
      {!isStreaming && (
        <div className="flex items-center gap-2 pt-2 border-t border-[#2d2a24]/60">
          {onMakeItReal && (
            <button
              onClick={onMakeItReal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/35 hover:border-[#d4af37]/50 text-[11px] font-semibold text-[#f0e6d3] transition-all duration-150"
            >
              <Sparkles className="w-3 h-3 text-[#e5c76b]" />
              <span>✦ MAKE IT REAL</span>
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141417] hover:bg-[#1c1c20] border border-[#2d2a24] hover:border-[#d4af37]/30 text-[11px] text-[#c9bda2] hover:text-[#f0e6d3] transition-colors"
            >
              <Pencil className="w-3 h-3 text-[#a89878]" />
              <span>Edit</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
