import { useState } from 'react'
import { ArrowRight, ArrowDown, Play, CheckCircle2, HelpCircle, Activity } from 'lucide-react'

export default function FlowchartRenderer({ data }) {
  const [selectedStep, setSelectedStep] = useState(null)

  const steps = Array.isArray(data?.steps)
    ? data.steps
    : Array.isArray(data?.nodes)
    ? data.nodes
    : []

  const getStepIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'start':
        return <Play className="w-4 h-4 text-emerald-400" />
      case 'end':
        return <CheckCircle2 className="w-4 h-4 text-[#e5c76b]" />
      case 'decision':
        return <HelpCircle className="w-4 h-4 text-amber-400" />
      default:
        return <Activity className="w-4 h-4 text-[#d4af37]" />
    }
  }

  const getStepBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'start':
        return 'bg-[#0e0e11] border-[#2d2a24] hover:border-[#d4af37]/35 text-[#f0e6d3]'
      case 'end':
        return 'bg-[#101014] border-[#d4af37]/35 text-[#f0e6d3]'
      case 'decision':
        return 'bg-[#0e0e11] border-[#2d2a24] hover:border-[#d4af37]/35 text-[#f0e6d3]'
      default:
        return 'bg-[#0c0c0e] border-[#2d2a24] hover:border-[#d4af37]/30 text-[#f0e6d3]'
    }
  }

  return (
    <div className="w-full flex flex-col gap-3 p-3 bg-[#0a0a0c]/40 rounded-xl">
      {/* Flow Steps List */}
      <div className="flex flex-col items-center gap-1.5">
        {steps.map((step, idx) => {
          const isSelected = selectedStep === step.id || selectedStep === idx
          const isLast = idx === steps.length - 1

          return (
            <div key={step.id || idx} className="w-full flex flex-col items-center">
              {/* Step Card */}
              <div
                onClick={() => setSelectedStep(isSelected ? null : (step.id || idx))}
                className={`w-full max-w-lg p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none flex items-start gap-2.5 ${getStepBadge(step.type)} ${
                  isSelected ? 'border-[#d4af37]/60 shadow-[0_0_12px_rgba(212,175,55,0.15)]' : ''
                }`}
              >
                <div className="p-1.5 rounded-lg bg-[#141417] border border-[#2d2a24] flex-shrink-0">
                  {getStepIcon(step.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#f0e6d3] tracking-wide">
                      {step.label || step.title || `Step ${idx + 1}`}
                    </span>
                    {step.type && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#141417] border border-[#2d2a24] text-[#a89878]">
                        {step.type}
                      </span>
                    )}
                  </div>

                  {step.description && (
                    <p className="text-[11.5px] text-[#a89878] mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  )}

                  {step.condition && (
                    <div className="mt-1.5 text-[11px] px-2 py-0.5 rounded-md bg-[#141417] border border-[#2d2a24] text-[#e5c76b]">
                      ⚡ <strong>Condition:</strong> {step.condition}
                    </div>
                  )}
                </div>
              </div>

              {/* Flow Connector Arrow */}
              {!isLast && (
                <div className="flex flex-col items-center py-1 text-[#d4af37]/50">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
