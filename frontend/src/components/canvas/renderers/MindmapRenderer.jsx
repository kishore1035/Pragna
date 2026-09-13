import { useState } from 'react'
import { Sparkles, Layers, ChevronRight, ChevronDown } from 'lucide-react'

export default function MindmapRenderer({ data }) {
  const center = data?.center || data?.topic || data?.title || 'Core Topic'
  const branches = Array.isArray(data?.branches) ? data.branches : []
  const [expandedBranches, setExpandedBranches] = useState(() =>
    branches.reduce((acc, _, i) => ({ ...acc, [i]: true }), {})
  )

  const toggleBranch = (idx) => {
    setExpandedBranches((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <div className="w-full flex flex-col gap-4 p-3 bg-[#0a0a0c]/40 rounded-xl">
      {/* Central Core Concept Node */}
      <div className="flex justify-center">
        <div className="px-4 py-2 rounded-xl bg-[#101014] border border-[#d4af37]/40 shadow-[0_0_15px_rgba(212,175,55,0.12)] text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#e5c76b]" />
            <h4 className="text-xs font-semibold text-[#f0e6d3] tracking-wide">{center}</h4>
          </div>
        </div>
      </div>

      {/* Radiating Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {branches.map((branch, idx) => {
          const isExpanded = !!expandedBranches[idx]
          const subnodes = Array.isArray(branch.subnodes)
            ? branch.subnodes
            : Array.isArray(branch.children)
            ? branch.children
            : []

          return (
            <div
              key={idx}
              className="flex flex-col rounded-xl border border-[#2d2a24] bg-[#0e0e11] overflow-hidden hover:border-[#d4af37]/35 transition-all duration-150"
            >
              {/* Branch Header */}
              <div
                onClick={() => toggleBranch(idx)}
                className="flex items-center justify-between p-2.5 bg-[#121216] border-b border-[#2d2a24] cursor-pointer select-none hover:bg-[#16161a] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#e5c76b]" />
                  <span className="text-xs font-medium text-[#f0e6d3]">
                    {branch.label || branch.title || `Branch ${idx + 1}`}
                  </span>
                </div>
                <button type="button" className="text-[#d4af37]/80">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Subnodes List */}
              {isExpanded && (
                <div className="p-2 flex flex-col gap-1">
                  {subnodes.map((sub, sIdx) => {
                    const label = typeof sub === 'string' ? sub : (sub.label || sub.name || JSON.stringify(sub))
                    const desc = typeof sub === 'object' ? sub.description : null

                    return (
                      <div
                        key={sIdx}
                        className="flex items-start gap-2 px-2 py-1 rounded-lg bg-[#141417] border border-[#2d2a24] text-[#c9bda2] text-xs hover:border-[#d4af37]/25 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-normal text-[#f0e6d3]">{label}</span>
                          {desc && <p className="text-[10.5px] text-[#a89878] mt-0.5">{desc}</p>}
                        </div>
                      </div>
                    )
                  })}
                  {subnodes.length === 0 && (
                    <span className="text-[11px] text-[#a89878]/40 italic px-1">No subnodes</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
