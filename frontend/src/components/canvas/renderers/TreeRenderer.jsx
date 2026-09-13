import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText, Sparkles, Users, User, ArrowRight, LayoutGrid, ListTree } from 'lucide-react'

function TreeNode({ node, depth = 0, defaultExpanded = true, isHorizontal = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const hasChildren = Array.isArray(node?.children) && node.children.length > 0

  const getDepthStyle = (d) => {
    switch (d) {
      case 0:
        return 'bg-[#101014] border-[#d4af37]/40 text-[#f0e6d3] font-semibold shadow-[0_0_15px_rgba(212,175,55,0.12)]'
      case 1:
        return 'bg-[#0e0e11] border-[#2d2a24] hover:border-[#d4af37]/35 text-[#f0e6d3] font-medium'
      case 2:
        return 'bg-[#0a0a0c] border-[#2d2a24]/80 hover:border-[#d4af37]/30 text-[#f0e6d3]'
      default:
        return 'bg-[#08080a] border-[#2d2a24]/60 text-[#c9bda2]'
    }
  }

  const isFamily = (node.label || '').toLowerCase().includes('grandparent') ||
    (node.label || '').toLowerCase().includes('parent') ||
    (node.label || '').toLowerCase().includes('father') ||
    (node.label || '').toLowerCase().includes('mother') ||
    (node.label || '').toLowerCase().includes('child') ||
    (node.label || '').toLowerCase().includes('cousin') ||
    (node.label || '').toLowerCase().includes('uncle')

  return (
    <div className="flex flex-col">
      <div
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 select-none ${
          hasChildren ? 'cursor-pointer hover:border-[#d4af37]/70 hover:shadow-[0_0_14px_rgba(212,175,55,0.18)]' : 'cursor-default'
        } ${getDepthStyle(depth)}`}
      >
        {hasChildren ? (
          <button
            type="button"
            className="w-4 h-4 flex items-center justify-center text-[#d4af37] group-hover:scale-125 transition-transform"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-4 h-4 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]/70" />
          </div>
        )}

        {depth === 0 ? (
          <Sparkles className="w-4 h-4 text-[#e5c76b] flex-shrink-0" />
        ) : isFamily ? (
          hasChildren ? <Users className="w-4 h-4 text-[#d4af37] flex-shrink-0" /> : <User className="w-3.5 h-3.5 text-[#a89878] flex-shrink-0" />
        ) : hasChildren ? (
          <Folder className="w-4 h-4 text-[#d4af37]/90 flex-shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-[#a89878]/70 flex-shrink-0" />
        )}

        <span className="text-xs tracking-wide flex-1 font-semibold text-[#f0e6d3]">{node.label || node.name || 'Node'}</span>

        {node.tag && (
          <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#e5c76b]">
            {node.tag}
          </span>
        )}

        {node.description && (
          <span className="text-[11.5px] text-[#a89878] hidden sm:inline truncate max-w-xs">
            {node.description}
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="pl-6 ml-3.5 my-1.5 border-l-2 border-[#d4af37]/25 flex flex-col gap-2 animate-fadeIn">
          {node.children.map((child, idx) => (
            <TreeNode key={idx} node={child} depth={depth + 1} defaultExpanded={defaultExpanded} isHorizontal={isHorizontal} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TreeRenderer({ data }) {
  const [viewMode, setViewMode] = useState('tree') // 'tree' | 'generation'

  const rootNode = data?.label || data?.name ? data : (data?.root || data?.nodes?.[0] || { label: 'Root', children: [] })

  // Check if this is a generation / family tree
  const isFamilyTree = (rootNode.label || '').toLowerCase().includes('grandparent') ||
    (rootNode.children || []).some(c => (c.label || '').toLowerCase().includes('parent') || (c.label || '').toLowerCase().includes('uncle'))

  return (
    <div className="w-full flex flex-col gap-3 p-3 bg-[#0a0a0c]/40 rounded-xl">
      {/* View Switcher for Family Trees */}
      {isFamilyTree && (
        <div className="flex items-center justify-between pb-2 border-b border-[#2d2a24]">
          <span className="text-[10px] uppercase font-semibold text-[#e5c76b] tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Family Lineage Architecture</span>
          </span>
          <div className="flex items-center gap-1 bg-[#101014] p-0.5 rounded-lg border border-[#2d2a24] text-xs">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                viewMode === 'tree' ? 'bg-[#d4af37]/15 text-[#f0e6d3] font-medium border border-[#d4af37]/30' : 'text-[#a89878] hover:text-[#f0e6d3]'
              }`}
            >
              <ListTree className="w-3 h-3" />
              <span>Hierarchy</span>
            </button>
            <button
              onClick={() => setViewMode('generation')}
              className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                viewMode === 'generation' ? 'bg-[#d4af37]/15 text-[#f0e6d3] font-medium border border-[#d4af37]/30' : 'text-[#a89878] hover:text-[#f0e6d3]'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Generations</span>
            </button>
          </div>
        </div>
      )}

      {viewMode === 'generation' && isFamilyTree ? (
        /* Generation Tier View */
        <div className="flex flex-col gap-3 py-1">
          {/* Generation I */}
          <div className="p-3 rounded-xl bg-[#101014] border border-[#d4af37]/30">
            <span className="text-[10px] uppercase font-semibold text-[#e5c76b] tracking-widest">Generation I (Ancestors)</span>
            <div className="mt-1.5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#e5c76b]" />
              <span className="text-xs font-semibold text-[#f0e6d3]">{rootNode.label}</span>
            </div>
          </div>

          <div className="flex justify-center text-[#d4af37]/50 -my-1 font-mono text-xs">
            <span>↓</span>
          </div>

          {/* Generation II */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(rootNode.children || []).map((branch, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#0e0e11] border border-[#2d2a24] hover:border-[#d4af37]/30 flex flex-col gap-2 transition-all">
                <span className="text-[10px] uppercase font-medium text-[#e5c76b] tracking-wider">
                  Generation II • {branch.tag || 'Branch'}
                </span>
                <span className="text-xs font-semibold text-[#f0e6d3]">{branch.label}</span>

                {/* Generation III */}
                {Array.isArray(branch.children) && branch.children.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-[#2d2a24] flex flex-col gap-1.5">
                    <span className="text-[9.5px] uppercase text-[#a89878] font-medium">Generation III (Offspring)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {branch.children.map((child, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-2 py-0.5 rounded-lg bg-[#141417] border border-[#2d2a24] text-xs text-[#f0e6d3]"
                        >
                          {child.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Standard Interactive Hierarchy Tree */
        <TreeNode node={rootNode} depth={0} defaultExpanded={true} />
      )}
    </div>
  )
}
