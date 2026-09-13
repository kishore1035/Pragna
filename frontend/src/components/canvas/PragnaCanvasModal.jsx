import { useState, useRef, useEffect } from 'react'
import {
  X,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Download,
  Send,
  Wand2,
  Table,
  Layers,
  Map,
  Server,
  Workflow,
} from 'lucide-react'

import TableRenderer from './renderers/TableRenderer'
import TreeRenderer from './renderers/TreeRenderer'
import FlowchartRenderer from './renderers/FlowchartRenderer'
import MindmapRenderer from './renderers/MindmapRenderer'
import TimelineRenderer from './renderers/TimelineRenderer'
import ChartRenderer from './renderers/ChartRenderer'
import KanbanRenderer from './renderers/KanbanRenderer'
import ERDiagramRenderer from './renderers/ERDiagramRenderer'
import ArchitectureRenderer from './renderers/ArchitectureRenderer'
import RoadmapRenderer from './renderers/RoadmapRenderer'

export default function PragnaCanvasModal({ isOpen, onClose, parsed, onSendPrompt }) {
  const [zoom, setZoom] = useState(1)
  const [copied, setCopied] = useState(false)
  const [followupText, setFollowupText] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !parsed) return null

  const type = (parsed.type || 'table').toLowerCase()
  const title = parsed.title || 'Interactive Canvas Studio'
  const data = parsed.data || parsed

  const handleZoomIn = () => setZoom((z) => Math.min(2, z + 0.15))
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, z - 0.15))
  const handleResetZoom = () => setZoom(1)

  const handleCopyJSON = () => {
    navigator.clipboard?.writeText(JSON.stringify(parsed, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFollowupSubmit = (e) => {
    e.preventDefault()
    const query = followupText.trim()
    if (!query) return
    onClose()
    if (onSendPrompt) {
      onSendPrompt(`Regarding the ${title} visualization: ${query}`)
    }
  }

  const renderContent = () => {
    switch (type) {
      case 'table':
        return <TableRenderer data={data} title={title} />
      case 'tree':
        return <TreeRenderer data={data} />
      case 'flowchart':
        return <FlowchartRenderer data={data} />
      case 'mindmap':
        return <MindmapRenderer data={data} />
      case 'timeline':
        return <TimelineRenderer data={data} />
      case 'chart':
      case 'graph':
        return <ChartRenderer data={data} />
      case 'kanban':
        return <KanbanRenderer data={data} />
      case 'er_diagram':
      case 'er':
        return <ERDiagramRenderer data={data} />
      case 'system_architecture':
      case 'architecture':
        return <ArchitectureRenderer data={data} />
      case 'roadmap':
        return <RoadmapRenderer data={data} />
      default:
        return <TableRenderer data={data} title={title} />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
      {/* Modal Window Container */}
      <div className="w-full max-w-6xl h-[90vh] flex flex-col rounded-2xl bg-[#0e0e11] border border-[#d4af37]/35 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Studio Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#d4af37]/15 via-[#d4af37]/8 to-transparent border-b border-[#d4af37]/25">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/35 shadow-[0_0_12px_rgba(212,175,55,0.15)]">
              <Sparkles className="w-5 h-5 text-[#e5c76b]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#e5c76b]">
                  PRAGNA CANVAS STUDIO ✦ MAKE IT REAL
                </span>
              </div>
              <h2 className="text-base font-bold text-[#f0e6d3] tracking-wide">{title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-[#0a0a0c]/80 border border-white/[0.08] rounded-xl p-1">
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-[#a89878] hover:text-[#f0e6d3] hover:bg-white/[0.06] rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-[#e5c76b] font-bold">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleResetZoom}
                className="p-1.5 text-[#a89878] hover:text-[#f0e6d3] hover:bg-white/[0.06] rounded-lg transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-[#a89878] hover:text-[#f0e6d3] hover:bg-white/[0.06] rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Copy JSON */}
            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0a0a0c]/80 hover:bg-[#d4af37]/20 border border-[#d4af37]/25 text-xs font-semibold text-[#e5c76b] transition-colors"
              title="Copy JSON"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'JSON'}</span>
            </button>

            {/* Close Studio */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#a89878] hover:text-[#f0e6d3] transition-colors"
              title="Close Studio (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Interactive Canvas Area */}
        <div className="flex-1 overflow-auto p-6 bg-[radial-gradient(#202024_1px,transparent_1px)] [background-size:16px_16px]">
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            className="transition-transform duration-200 flex justify-center"
          >
            <div className="w-full max-w-4xl">{renderContent()}</div>
          </div>
        </div>

        {/* Live Modification Prompt Footer */}
        <div className="p-4 bg-[#0a0a0c]/95 border-t border-[#d4af37]/25">
          <form onSubmit={handleFollowupSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e5c76b]" />
              <input
                type="text"
                value={followupText}
                onChange={(e) => setFollowupText(e.target.value)}
                placeholder="Ask Pragna to modify, expand, or refine this visualization (e.g. 'Add Redis cache layer', 'Make backend more detailed')..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#121215] border border-[#d4af37]/25 rounded-xl text-[#f0e6d3] placeholder-[#a89878]/40 focus:outline-none focus:border-[#d4af37]/60 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c76b] to-[#d4af37] hover:opacity-90 font-bold text-xs text-[#0e0e11] transition-opacity shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              <span>Update Canvas</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
