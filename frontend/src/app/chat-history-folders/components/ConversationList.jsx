import { Search, MessageSquare, X, Clock, Trash2, ArrowUpRight } from 'lucide-react'

function formatDate(dateValue) {
  if (!dateValue) return ''
  try {
    const d = new Date(dateValue)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return String(dateValue)
  }
}

export default function ConversationList({
  conversations = [],
  searchQuery = '',
  onSearchChange,
  totalCount = 0,
  onSelectConversation,
  onDeleteConversation,
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-[var(--pragna-surface)]">
      {/* Search Header */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-[var(--pragna-border)] shrink-0 bg-[var(--pragna-surface-2)]/30">
        <div className="flex-1 flex items-center gap-2 bg-[var(--pragna-surface-2)] rounded-xl px-3 py-1.5 border border-[var(--pragna-border)]">
          <Search size={14} className="text-[var(--pragna-text-muted)] shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations…"
            className="flex-1 bg-transparent text-xs text-[var(--pragna-text)] placeholder:text-[var(--pragna-text-muted)] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-[var(--pragna-text-muted)] hover:text-[var(--pragna-text)]"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Count Header */}
      <div className="px-5 py-2.5 border-b border-[var(--pragna-border)] shrink-0 bg-[var(--pragna-surface-2)]/10 flex items-center justify-between">
        <span className="text-xs text-[var(--pragna-text-muted)] font-mono">
          {totalCount} {totalCount === 1 ? 'conversation' : 'conversations'}
        </span>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8 py-16">
            <div className="w-12 h-12 rounded-2xl bg-[var(--pragna-surface-2)] flex items-center justify-center border border-[var(--pragna-border)]">
              <MessageSquare size={22} className="text-[var(--pragna-gold-soft)] opacity-70" />
            </div>
            <p className="text-sm font-semibold text-[var(--pragna-text)]">No conversations found</p>
            <p className="text-xs text-[var(--pragna-text-muted)] max-w-sm">
              {searchQuery
                ? 'Try a different search term or clear the search.'
                : 'Start a new chat to see your conversation history organized here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--pragna-border)]/60">
            {conversations.map((conv) => {
              const convId = conv.id
              const title = conv.title || 'Untitled Conversation'
              const dateStr = conv.created_at || conv.timestamp || conv.updated_at

              return (
                <div
                  key={convId}
                  onClick={() => onSelectConversation(convId)}
                  className="group flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[var(--pragna-surface-2)]/70 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--pragna-text)] truncate group-hover:text-[var(--pragna-gold-soft)] transition-colors">
                      {title}
                    </p>
                    <p className="text-[11px] text-[var(--pragna-text-muted)] flex items-center gap-1.5 mt-1 font-mono">
                      <Clock size={11} />
                      {formatDate(dateStr)}
                      {conv.messages && conv.messages.length > 0 && (
                        <span>• {conv.messages.length} msgs</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(convId)
                      }}
                      className="p-1.5 rounded-lg text-[var(--pragna-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete conversation"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectConversation(convId)
                      }}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[var(--pragna-surface-2)] group-hover:bg-gradient-to-r group-hover:from-[var(--pragna-gold-soft)] group-hover:to-[var(--pragna-gold-deep)] group-hover:text-[var(--pragna-on-gold)] text-[var(--pragna-text-soft)] transition-all shrink-0 font-medium cursor-pointer"
                    >
                      Open
                      <ArrowUpRight size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
