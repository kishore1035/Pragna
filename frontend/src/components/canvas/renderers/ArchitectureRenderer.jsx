import { Server, Layers, Cpu, Database, Cloud, Shield, ArrowDown } from 'lucide-react'

export default function ArchitectureRenderer({ data }) {
  const tiers = Array.isArray(data?.tiers)
    ? data.tiers
    : Array.isArray(data?.layers)
    ? data.layers
    : []

  const getTierIcon = (idx, name = '') => {
    const n = name.toLowerCase()
    if (n.includes('client') || n.includes('ui') || n.includes('frontend')) return <Layers className="w-4 h-4 text-[#e5c76b]" />
    if (n.includes('gateway') || n.includes('proxy') || n.includes('auth')) return <Shield className="w-4 h-4 text-amber-400" />
    if (n.includes('service') || n.includes('app') || n.includes('api')) return <Server className="w-4 h-4 text-emerald-400" />
    if (n.includes('data') || n.includes('db') || n.includes('storage') || n.includes('cache')) return <Database className="w-4 h-4 text-sky-400" />
    return <Cloud className="w-4 h-4 text-[#d4af37]" />
  }

  return (
    <div className="w-full flex flex-col items-center gap-2.5 p-3 bg-[#0a0a0c]/40 rounded-xl">
      {tiers.map((tier, idx) => {
        const components = Array.isArray(tier.components)
          ? tier.components
          : Array.isArray(tier.nodes)
          ? tier.nodes
          : []
        const isLast = idx === tiers.length - 1

        return (
          <div key={idx} className="w-full flex flex-col items-center">
            {/* Tier Box */}
            <div className="w-full p-3 rounded-xl border border-[#2d2a24] bg-[#0e0e11] shadow-sm">
              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#2d2a24]">
                {getTierIcon(idx, tier.name)}
                <span className="text-xs font-semibold text-[#f0e6d3] uppercase tracking-wider">
                  {tier.name || `Tier ${idx + 1}`}
                </span>
                {tier.protocol && (
                  <span className="ml-auto text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-[#141417] border border-[#2d2a24] text-[#a89878]">
                    {tier.protocol}
                  </span>
                )}
              </div>

              {/* Components in Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {components.map((comp, cIdx) => {
                  const name = typeof comp === 'string' ? comp : (comp.name || comp.title || 'Component')
                  const tech = typeof comp === 'object' ? comp.tech : null
                  const desc = typeof comp === 'object' ? comp.desc || comp.description : null

                  return (
                    <div
                      key={cIdx}
                      className="p-2.5 rounded-lg bg-[#141417] border border-[#2d2a24] hover:border-[#d4af37]/35 transition-colors flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-medium text-[#f0e6d3]">{name}</span>
                      </div>

                      {tech && (
                        <span className="text-[10px] font-mono text-[#e5c76b]">
                          {tech}
                        </span>
                      )}

                      {desc && (
                        <p className="text-[10.5px] text-[#a89878] leading-relaxed mt-0.5">{desc}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Protocol Arrow between tiers */}
            {!isLast && (
              <div className="flex flex-col items-center py-1 text-[#d4af37]/50">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
