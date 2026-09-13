import { useState, useEffect } from 'react'
import { API_BASE } from '../../api/api'
import {
  Calendar,
  Clock,
  CheckCircle2,
  ListTodo,
  Plus,
  RefreshCw,
  Trash2,
  Play,
  Layers,
  Sparkles,
} from 'lucide-react'

export default function TasksPage() {
  const [scheduledJobs, setScheduledJobs] = useState([])
  const [kanbanTasks, setKanbanTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('scheduled')

  const fetchData = async () => {
    setLoading(true)
    const token = localStorage.getItem('authToken')
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    try {
      const [cronRes, kanbanRes] = await Promise.all([
        fetch(`${API_BASE}/api/scheduled-tasks`, { headers }),
        fetch(`${API_BASE}/api/kanban`, { headers }),
      ])

      if (cronRes.ok) {
        const data = await cronRes.json()
        setScheduledJobs(data.jobs || [])
      }

      if (kanbanRes.ok) {
        const data = await kanbanRes.json()
        setKanbanTasks(data.tasks || [])
      }
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent text-[var(--pragna-text)]">
      {/* Header */}
      <header className="h-16 border-b border-[var(--pragna-border)] px-6 flex items-center justify-between bg-[var(--pragna-surface)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--pragna-accent-soft)] flex items-center justify-center text-[var(--pragna-accent)] border border-[rgba(212,175,55,0.2)]">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[var(--pragna-text)]">Autonomous Tasks & Kanban</h1>
            <p className="text-xs text-[var(--pragna-text-muted)]">Mimir Background Cron Jobs & Agent Task Board</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--pragna-surface-elevated)] hover:bg-[var(--pragna-surface-hover)] text-[var(--pragna-text)] border border-[var(--pragna-border)] transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {/* Navigation Tabs */}
      <div className="px-6 pt-3 border-b border-[var(--pragna-border)] flex items-center gap-4 bg-[var(--pragna-surface)]">
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`flex items-center gap-2 pb-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'scheduled'
              ? 'border-[var(--pragna-accent)] text-[var(--pragna-accent)]'
              : 'border-transparent text-[var(--pragna-text-muted)] hover:text-[var(--pragna-text)]'
          }`}
        >
          <Clock size={15} />
          Scheduled Background Jobs ({scheduledJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('kanban')}
          className={`flex items-center gap-2 pb-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'kanban'
              ? 'border-[var(--pragna-accent)] text-[var(--pragna-accent)]'
              : 'border-transparent text-[var(--pragna-text-muted)] hover:text-[var(--pragna-text)]'
          }`}
        >
          <ListTodo size={15} />
          Kanban Project Board ({kanbanTasks.length})
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[var(--pragna-text-muted)] text-sm">
            <RefreshCw className="animate-spin mr-2" size={18} />
            Loading autonomous tasks...
          </div>
        ) : activeTab === 'scheduled' ? (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--pragna-text)]">Active Cron Jobs</h2>
                <p className="text-xs text-[var(--pragna-text-muted)]">Autonomous worker tasks running in the background</p>
              </div>
            </div>

            {scheduledJobs.length === 0 ? (
              <div className="p-8 rounded-2xl border border-[var(--pragna-border)] bg-[var(--pragna-surface)] text-center text-[var(--pragna-text-muted)] text-xs">
                No active scheduled jobs. Instruct Pragna to create a reminder, watcher, or recurring job.
              </div>
            ) : (
              <div className="grid gap-3">
                {scheduledJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-[var(--pragna-border)] bg-[var(--pragna-surface)] flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--pragna-accent-soft)] text-[var(--pragna-accent)] border border-[rgba(212,175,55,0.2)]">
                          {job.status || 'Active'}
                        </span>
                        <span className="text-xs font-mono text-[var(--pragna-text-muted)]">
                          {job.schedule_expression || 'every 1h'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--pragna-text)] font-medium leading-relaxed">
                        {job.prompt}
                      </p>
                      <p className="text-[10px] text-[var(--pragna-text-muted)]">
                        Created: {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
              {['todo', 'in_progress', 'review', 'done'].map((col) => {
                const colTasks = kanbanTasks.filter((t) => (t.status || 'todo') === col)
                const colTitles = {
                  todo: 'To Do',
                  in_progress: 'In Progress',
                  review: 'In Review',
                  done: 'Done',
                }
                return (
                  <div
                    key={col}
                    className="rounded-2xl border border-[var(--pragna-border)] bg-[var(--pragna-surface)] p-4 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-[var(--pragna-text)]">
                        {colTitles[col]}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--pragna-surface-elevated)] text-[var(--pragna-text-muted)] font-bold">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin">
                      {colTasks.length === 0 ? (
                        <div className="text-center py-6 text-[10px] text-[var(--pragna-text-muted)] italic">
                          No tasks
                        </div>
                      ) : (
                        colTasks.map((t) => (
                          <div
                            key={t.id}
                            className="p-3 rounded-xl border border-[var(--pragna-border)] bg-[var(--pragna-surface-elevated)] text-xs space-y-1.5"
                          >
                            <p className="font-medium text-[var(--pragna-text)] leading-snug">{t.title}</p>
                            {t.description && (
                              <p className="text-[11px] text-[var(--pragna-text-muted)] line-clamp-2">{t.description}</p>
                            )}
                            <div className="flex items-center justify-between pt-1 text-[9px] text-[var(--pragna-text-muted)]">
                              <span className="capitalize">{t.priority || 'medium'} priority</span>
                              <span>{new Date(t.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
