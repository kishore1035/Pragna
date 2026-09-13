import { useState, useMemo, useContext } from 'react'
import { ChatContext } from '../../context/ChatContext'
import {
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Download,
  Share2,
  Table,
  GitFork,
  Workflow,
  Network,
  Calendar,
  BarChart3,
  Columns3,
  Database,
  Server,
  Map,
  Layers,
  Wand2,
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
import PragnaCanvasModal from './PragnaCanvasModal'
import AutopilotProgressCard from './AutopilotProgressCard'

export default function PragnaCanvas({ canvasData, onSendPrompt }) {
  const { openArtifact } = useContext(ChatContext) || {}
  const [zoom, setZoom] = useState(1)
  const [copied, setCopied] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showMorphMenu, setShowMorphMenu] = useState(false)

  // Parse canvas data if passed as string or JSON
  const parsed = useMemo(() => {
    if (!canvasData) return null
    if (typeof canvasData === 'object') return canvasData
    try {
      return JSON.parse(canvasData)
    } catch {
      return null
    }
  }, [canvasData])

  if (!parsed || !parsed.type) return null

  const type = (parsed.type || 'table').toLowerCase()
  const title = parsed.title || 'Interactive Visualization'
  const description = parsed.description || null
  const data = parsed.data || parsed

  const getTypeMeta = (t) => {
    switch (t) {
      case 'table':
        return { label: 'COMPARISON TABLE', icon: <Table className="w-4 h-4 text-[#F2D06B]" /> }
      case 'tree':
        return { label: 'CONCEPT TREE', icon: <GitFork className="w-4 h-4 text-[#F2D06B]" /> }
      case 'flowchart':
        return { label: 'PROCESS FLOWCHART', icon: <Workflow className="w-4 h-4 text-[#F2D06B]" /> }
      case 'mindmap':
        return { label: 'MIND MAP', icon: <Network className="w-4 h-4 text-[#F2D06B]" /> }
      case 'timeline':
        return { label: 'TIMELINE', icon: <Calendar className="w-4 h-4 text-[#F2D06B]" /> }
      case 'chart':
      case 'graph':
        return { label: 'DATA CHART', icon: <BarChart3 className="w-4 h-4 text-[#F2D06B]" /> }
      case 'kanban':
        return { label: 'KANBAN BOARD', icon: <Columns3 className="w-4 h-4 text-[#F2D06B]" /> }
      case 'er_diagram':
      case 'er':
        return { label: 'ER DIAGRAM', icon: <Database className="w-4 h-4 text-[#F2D06B]" /> }
      case 'system_architecture':
      case 'architecture':
        return { label: 'SYSTEM ARCHITECTURE', icon: <Server className="w-4 h-4 text-[#F2D06B]" /> }
      case 'roadmap':
        return { label: 'ROADMAP', icon: <Map className="w-4 h-4 text-[#F2D06B]" /> }
      default:
        return { label: 'PRAGNA CANVAS', icon: <Layers className="w-4 h-4 text-[#F2D06B]" /> }
    }
  }

  const meta = getTypeMeta(type)

  const handleCopyJSON = () => {
    navigator.clipboard?.writeText(JSON.stringify(parsed, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleZoomIn = () => setZoom((z) => Math.min(1.5, z + 0.1))
  const handleZoomOut = () => setZoom((z) => Math.max(0.7, z - 0.1))
  const handleResetZoom = () => setZoom(1)

  const handleMorph = (morphPrompt) => {
    setShowMorphMenu(false)
    if (onSendPrompt) {
      onSendPrompt(morphPrompt)
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

  const isAutopilot = parsed.autopilot || parsed.mode === 'autopilot'

  return (
    <div className="w-full flex flex-col">
      {isAutopilot && (
        <AutopilotProgressCard
          isStreaming={false}
          onMakeItReal={() => setIsModalOpen(true)}
          onEdit={() => onSendPrompt?.(`Update and refine the ${title} visualization: `)}
        />
      )}

      <div className="w-full my-3 rounded-2xl border border-[#2d2a24] bg-[#0c0c0e]/95 text-[#f0e6d3] shadow-[0_4px_24px_rgba(0,0,0,0.6)] backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-[#d4af37]/35">
      {/* Canvas Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-[#101014]/90 border-b border-[#2d2a24]">
        {/* Title & Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/25 flex-shrink-0">
            {meta.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#e5c76b]">
                {meta.label}
              </span>
            </div>
            <h3 className="text-xs font-semibold text-[#f0e6d3] tracking-wide truncate">{title}</h3>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* MAKE IT REAL Action */}
          <button
            onClick={() => {
              openArtifact?.({
                id: `canvas-${Date.now()}`,
                title: title || 'Interactive Canvas',
                type: 'canvas',
                content: JSON.stringify(canvasData, null, 2),
                canvasData: canvasData,
              })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/35 hover:border-[#d4af37]/50 text-xs font-semibold text-[#f0e6d3] transition-all duration-150"
            title="Open Interactive Canvas in Side Split Panel & Studio"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#e5c76b]" />
            <span>✦ MAKE IT REAL</span>
          </button>

          {/* Zoom Controls for diagrams */}
          {['tree', 'mindmap', 'flowchart', 'architecture', 'er_diagram'].includes(type) && (
            <div className="hidden sm:flex items-center gap-1 bg-[#141417] border border-[#2d2a24] rounded-lg p-0.5">
              <button
                onClick={handleZoomOut}
                className="p-1 text-[#a89878] hover:text-[#f0e6d3] hover:bg-white/[0.04] rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 text-[#a89878] hover:text-[#f0e6d3] hover:bg-white/[0.04] rounded transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1 text-[#a89878] hover:text-[#f0e6d3] hover:bg-white/[0.04] rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Morph Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowMorphMenu(!showMorphMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#141417] hover:bg-[#1c1c20] border border-[#2d2a24] hover:border-[#d4af37]/30 text-[#c9bda2] hover:text-[#f0e6d3] text-xs transition-colors"
              title="AI Response Morphing"
            >
              <Wand2 className="w-3.5 h-3.5 text-[#e5c76b]" />
              <span className="hidden md:inline font-medium">Morph</span>
            </button>

            {/* Morph Dropdown */}
            {showMorphMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-[#0e0e11] border border-[#2d2a24] shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-xs animate-fadeIn backdrop-blur-xl">
                <button
                  onClick={() =>
                    handleMorph(`Make this ${title} visualization significantly more detailed with deeper sub-nodes and technical specifics.`)
                  }
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-[#d4af37]/10 text-[#f0e6d3] hover:text-[#e5c76b] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#e5c76b]" />
                  <span>Make more detailed</span>
                </button>
                <button
                  onClick={() =>
                    handleMorph(`Simplify this ${title} visualization to focus on high-level key essentials.`)
                  }
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-[#d4af37]/10 text-[#f0e6d3] hover:text-[#e5c76b] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#e5c76b]" />
                  <span>Make simpler</span>
                </button>
                <button
                  onClick={() =>
                    handleMorph(`Transform this ${title} structure into a clean comparison table.`)
                  }
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-[#d4af37]/10 text-[#f0e6d3] hover:text-[#e5c76b] transition-colors"
                >
                  <Table className="w-3.5 h-3.5 text-[#e5c76b]" />
                  <span>Turn into Table</span>
                </button>
                <button
                  onClick={() =>
                    handleMorph(`Transform this structure into a system architecture diagram.`)
                  }
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-[#d4af37]/10 text-[#f0e6d3] hover:text-[#e5c76b] transition-colors"
                >
                  <Server className="w-3.5 h-3.5 text-[#e5c76b]" />
                  <span>Show Technical Architecture</span>
                </button>
                <button
                  onClick={() =>
                    handleMorph(`Transform this structure into a step-by-step process flowchart.`)
                  }
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-[#d4af37]/10 text-[#f0e6d3] hover:text-[#e5c76b] transition-colors"
                >
                  <Workflow className="w-3.5 h-3.5 text-[#e5c76b]" />
                  <span>Turn into Flowchart</span>
                </button>
              </div>
            )}
          </div>

          {/* Copy JSON */}
          <button
            onClick={handleCopyJSON}
            className="p-1 rounded-lg bg-[#141417] hover:bg-[#1c1c20] border border-[#2d2a24] hover:border-[#d4af37]/30 text-[#c9bda2] hover:text-[#f0e6d3] transition-colors"
            title="Copy Canvas JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Optional Description */}
      {description && (
        <div className="px-4 pt-3 pb-1 text-xs text-white/60 leading-relaxed">
          {description}
        </div>
      )}

      {/* Canvas Body with interactive zoom */}
      <div className="p-4 overflow-x-auto">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          className="transition-transform duration-200"
        >
          {renderContent()}
        </div>
      </div>

      {/* Fullscreen Interactive Canvas Modal (MAKE IT REAL Studio) */}
      <PragnaCanvasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        parsed={parsed}
        onSendPrompt={onSendPrompt}
      />
      </div>
    </div>
  )
}
