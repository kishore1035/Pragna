import { useEffect, useState } from 'react'
import {
  fetchMemories,
  deleteMemory,
  syncMemories,
  clearAllMemories,
} from '../../api/api'
import {
  BotIcon,
  TrashIcon,
  CheckCircleIcon,
  SearchIcon,
} from './PragnaIcon'
import { RefreshCw, Brain, AlertCircle, Database, Calendar } from 'lucide-react'

export default function MemorySettings() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [msg, setMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await fetchMemories()
      setMemories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load memories:', err)
      setErrorMsg('Failed to load memories from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id) => {
    try {
      await deleteMemory(id)
      setMemories((prev) => prev.filter((m) => m.id !== id))
      setMsg('Memory purged from SQLite and vector store.')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete memory.')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setErrorMsg('')
    try {
      const res = await syncMemories()
      setMsg(res.message || 'Vector memory store synchronized.')
      await load()
      setTimeout(() => setMsg(''), 3500)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sync memory store.')
    } finally {
      setSyncing(false)
    }
  }

  const handleClearAll = async () => {
    try {
      await clearAllMemories()
      setMemories([])
      setConfirmClearOpen(false)
      setMsg('All personalized memories purged.')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to clear memories.')
    }
  }

  const filteredMemories = memories.filter((m) =>
    (m.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString.includes('Z') ? isoString : `${isoString}Z`)
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--pragna-border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--pragna-text)] flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[rgba(212,175,55,0.15)] text-[var(--pragna-gold-soft)]">
              <Brain size={18} />
            </span>
            Persistent Personalized Memory
          </h2>
          <p className="text-xs text-[var(--pragna-text-muted)] mt-1">
            Durable semantic facts and preferences Pragna has remembered across conversations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--pragna-border)] bg-[var(--pragna-surface-2)] text-[var(--pragna-text-soft)] text-xs font-medium hover:text-[var(--pragna-text)] transition-colors cursor-pointer"
            title="Synchronize and verify SQLite & ChromaDB memories"
          >
            <Database size={13} />
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync Vector Store'}
          </button>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[var(--pragna-border)] bg-[var(--pragna-surface-2)] text-[var(--pragna-text-muted)] hover:text-[var(--pragna-text)] transition-colors cursor-pointer"
            title="Refresh memory list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {memories.length > 0 && !confirmClearOpen && (
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              Purge All Memories
            </button>
          )}
        </div>
      </div>

      {/* Confirmation for Purge All */}
      {confirmClearOpen && (
        <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-red-300 font-medium">
            Purge all {memories.length} memories from SQLite and ChromaDB vector store? This cannot be undone.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
            >
              Yes, Purge All
            </button>
            <button
              type="button"
              onClick={() => setConfirmClearOpen(false)}
              className="px-3 py-1 rounded-lg border border-[var(--pragna-border)] text-[var(--pragna-text-muted)] hover:text-[var(--pragna-text)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {msg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircleIcon size={16} />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search and Counts */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pragna-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recalled memories…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--pragna-surface-2)] border border-[var(--pragna-border)] rounded-lg text-[var(--pragna-text)] outline-none focus:border-[var(--pragna-gold-soft)]"
          />
        </div>
        <div className="text-xs text-[var(--pragna-text-muted)] font-mono">
          {filteredMemories.length} {filteredMemories.length === 1 ? 'memory' : 'memories'} captured
        </div>
      </div>

      {/* Memories List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-10 text-center text-xs text-[var(--pragna-text-muted)]">Loading persistent memories…</div>
        ) : filteredMemories.length === 0 ? (
          <div className="p-10 border border-dashed border-[var(--pragna-border)] rounded-xl text-center text-[var(--pragna-text-muted)] bg-[var(--pragna-surface-2)]/30 space-y-1.5">
            <BotIcon size={28} className="mx-auto mb-2 opacity-40 text-[var(--pragna-gold-soft)]" />
            <p className="font-semibold text-xs text-[var(--pragna-text)]">
              {searchQuery ? 'No matching memories found' : 'No personalized memories saved yet'}
            </p>
            <p className="text-[11px]">
              {searchQuery ? 'Try another search keyword.' : 'Talk with Pragna and share your preferences, project details, or guidelines!'}
            </p>
          </div>
        ) : (
          filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-3.5 rounded-xl border border-[var(--pragna-border)] bg-[var(--pragna-surface-2)]/50 hover:bg-[var(--pragna-surface-2)] transition-all flex items-start justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-medium text-[var(--pragna-text)] leading-relaxed">
                  {mem.content}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--pragna-text-muted)] font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDate(mem.created_at)}
                  </span>
                  {mem.source_conversation_id && (
                    <span>Chat #{mem.source_conversation_id}</span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[rgba(212,175,55,0.08)] text-[var(--pragna-gold-soft)]">
                    ChromaDB Vector: mem_{mem.id}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(mem.id)}
                className="p-1.5 rounded-lg text-[var(--pragna-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                title="Delete memory"
              >
                <TrashIcon size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
