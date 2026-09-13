import { useState } from 'react'
import { Tag, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default function KanbanRenderer({ data }) {
  const columns = Array.isArray(data?.columns)
    ? data.columns
    : [
        { id: 'todo', title: 'To Do', tasks: [] },
        { id: 'inprogress', title: 'In Progress', tasks: [] },
        { id: 'done', title: 'Done', tasks: [] },
      ]

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'bg-rose-950/40 border-rose-500/30 text-rose-300/90'
      case 'medium':
        return 'bg-amber-950/40 border-amber-500/30 text-amber-300/90'
      default:
        return 'bg-[#d4af37]/15 border-[#d4af37]/35 text-[#e5c76b]'
    }
  }

  return (
    <div className="w-full flex gap-2.5 overflow-x-auto pb-2 p-3 bg-[#0a0a0c]/40 rounded-xl">
      {columns.map((col, idx) => {
        const tasks = Array.isArray(col.tasks) ? col.tasks : []

        return (
          <div
            key={col.id || idx}
            className="flex-1 min-w-[200px] max-w-[280px] flex flex-col rounded-xl bg-[#0e0e11] border border-[#2d2a24] overflow-hidden"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-2.5 bg-[#121216] border-b border-[#2d2a24]">
              <span className="text-xs font-semibold text-[#f0e6d3] tracking-wide">
                {col.title || col.name || `Column ${idx + 1}`}
              </span>
              <span className="px-1.5 py-0.5 text-[9.5px] font-mono rounded bg-[#141417] border border-[#2d2a24] text-[#a89878]">
                {tasks.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="p-2 flex flex-col gap-1.5 min-h-[120px]">
              {tasks.map((task, tIdx) => {
                const title = typeof task === 'string' ? task : (task.title || task.name || 'Task')
                const tag = typeof task === 'object' ? task.tag : null
                const priority = typeof task === 'object' ? task.priority : null
                const desc = typeof task === 'object' ? task.description : null

                return (
                  <div
                    key={tIdx}
                    className="p-2.5 rounded-lg bg-[#141417] border border-[#2d2a24] hover:border-[#d4af37]/35 transition-colors flex flex-col gap-1"
                  >
                    <span className="text-xs font-normal text-[#f0e6d3] leading-snug">{title}</span>

                    {desc && <p className="text-[10.5px] text-[#a89878] line-clamp-2">{desc}</p>}

                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {priority && (
                        <span
                          className={`text-[9px] uppercase font-medium px-1.5 py-0.2 rounded border ${getPriorityStyle(
                            priority
                          )}`}
                        >
                          {priority}
                        </span>
                      )}

                      {tag && (
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#0a0a0c] border border-[#2d2a24] text-[#a89878]">
                          #{tag}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {tasks.length === 0 && (
                <div className="h-full flex items-center justify-center text-[10.5px] text-[#a89878]/40 italic py-4">
                  No tasks
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
