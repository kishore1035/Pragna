'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AuthGate from '@/app/components/AuthGate';
import { API_BASE, getAuthToken } from '@/lib/api';
import { Calendar, Clock, CheckCircle2, ListTodo, Plus, RefreshCw } from 'lucide-react';

interface ScheduledJob {
  id: number;
  prompt: string;
  schedule_type: string;
  cron_expression?: string;
  duration_seconds?: number;
  timer_condition?: string;
  status: string;
  created_at: string;
}

interface KanbanTask {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority?: string;
  created_at: string;
}

export default function TasksPage() {
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'kanban'>('scheduled');

  const fetchData = async () => {
    setLoading(true);
    const token = getAuthToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [cronRes, kanbanRes] = await Promise.all([
        fetch(`${API_BASE}/api/scheduled-tasks`, { headers }),
        fetch(`${API_BASE}/api/kanban`, { headers }),
      ]);

      if (cronRes.ok) {
        const data = await cronRes.json();
        setScheduledJobs(data.jobs || []);
      }

      if (kanbanRes.ok) {
        const data = await kanbanRes.json();
        setKanbanTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AuthGate>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          {/* Header */}
          <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <Calendar className="text-primary" size={20} />
              <h1 className="text-lg font-semibold">Scheduled Tasks & Kanban Board</h1>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </header>

          {/* Navigation Tabs */}
          <div className="px-6 pt-4 border-b border-border flex items-center gap-4 bg-card/50">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'scheduled'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock size={16} />
              Scheduled Background Jobs ({scheduledJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'kanban'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTodo size={16} />
              Kanban Project Board ({kanbanTasks.length})
            </button>
          </div>

          {/* Main Content View */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <RefreshCw className="animate-spin mr-2" size={20} />
                Loading tasks...
              </div>
            ) : activeTab === 'scheduled' ? (
              /* Scheduled Tasks View */
              <div className="space-y-4 max-w-4xl">
                {scheduledJobs.length === 0 ? (
                  <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-foreground">
                    <Clock size={32} className="mx-auto mb-3 text-muted-foreground/60" />
                    <p className="font-medium text-foreground">No scheduled background jobs active</p>
                    <p className="text-sm mt-1">
                      You can schedule reminders in chat using prompts like <code className="bg-muted px-1.5 py-0.5 rounded">"Remind me in 30 sec to check logs"</code>.
                    </p>
                  </div>
                ) : (
                  scheduledJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                            Schedule: {job.cron_expression || (job.duration_seconds ? `${job.duration_seconds}s timer` : job.schedule_type)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Status: <strong className="text-foreground">{job.status}</strong>
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{job.prompt}</p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(job.created_at.includes('Z') ? job.created_at : job.created_at + 'Z').toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 size={13} /> Active Scheduler
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Kanban Board View */
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                {(['todo', 'in_progress', 'review', 'done'] as const).map((statusKey) => {
                  const items = kanbanTasks.filter((t) => t.status === statusKey);
                  const titleMap = {
                    todo: 'To Do',
                    in_progress: 'In Progress',
                    review: 'In Review',
                    done: 'Completed',
                  };
                  return (
                    <div key={statusKey} className="bg-card/40 border border-border rounded-xl p-3 flex flex-col">
                      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                        <h3 className="font-semibold text-sm text-foreground">{titleMap[statusKey]}</h3>
                        <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {items.length}
                        </span>
                      </div>
                      <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin">
                        {items.length === 0 ? (
                          <div className="text-xs text-muted-foreground p-3 text-center border border-dashed border-border rounded-lg">
                            No tasks
                          </div>
                        ) : (
                          items.map((task) => (
                            <div
                              key={task.id}
                              className="p-3 bg-card border border-border rounded-lg shadow-sm space-y-1.5"
                            >
                              <p className="text-sm font-medium text-foreground">{task.title}</p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                              )}
                              {task.priority && (
                                <span className="inline-block text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  {task.priority}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGate>
  );
}
