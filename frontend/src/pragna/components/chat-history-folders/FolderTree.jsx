import { useState, useContext } from 'react'
import { ChatContext } from '../../../context/ChatContext'
import {
  ChatsIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderPlusIcon,
  TrashIcon,
} from '../PragnaIcon'
import { Folder, ChevronRight, MessageSquare, Plus } from 'lucide-react'

export default function FolderTree({ activeFolder, onSelect, totalCount }) {
  const [expanded, setExpanded] = useState(true)
  const { folders = [], createFolder, deleteFolder } = useContext(ChatContext)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  const handleCreateFolder = (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    createFolder(newFolderName.trim())
    setNewFolderName('')
    setIsCreatingFolder(false)
  }

  return (
    <div className="w-64 shrink-0 border-r border-[var(--pragna-border)] h-full flex flex-col bg-[var(--pragna-surface-2)]/60">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--pragna-border)] shrink-0">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs font-bold text-[var(--pragna-text)] tracking-wider uppercase cursor-pointer"
        >
          <ChevronRight
            size={14}
            className={`transition-transform text-[var(--pragna-text-muted)] ${expanded ? 'rotate-90' : ''}`}
          />
          Folders & History
        </button>

        <button
          type="button"
          onClick={() => setIsCreatingFolder(!isCreatingFolder)}
          className="p-1 rounded-md hover:bg-[var(--pragna-surface)] text-[var(--pragna-text-muted)] hover:text-[var(--pragna-gold-soft)] transition-colors cursor-pointer"
          title="New Folder"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* New Folder Inline Form */}
      {isCreatingFolder && (
        <form onSubmit={handleCreateFolder} className="p-3 border-b border-[var(--pragna-border)] bg-[var(--pragna-surface)] space-y-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name…"
            className="w-full px-2.5 py-1 text-xs bg-[var(--pragna-surface-2)] border border-[var(--pragna-border)] rounded-md text-[var(--pragna-text)] outline-none focus:border-[var(--pragna-gold-soft)]"
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="px-2 py-0.5 text-[11px] text-[var(--pragna-text-muted)] hover:text-[var(--pragna-text)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 text-[11px] bg-gradient-to-r from-[var(--pragna-gold-soft)] to-[var(--pragna-gold-deep)] text-[var(--pragna-on-gold)] font-bold rounded-md cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Folder Tree Navigation */}
      {expanded && (
        <div className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2 space-y-1">
          {/* All Conversations */}
          <button
            type="button"
            onClick={() => onSelect('all')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeFolder === 'all'
                ? 'bg-[rgba(212,175,55,0.15)] text-[var(--pragna-gold-soft)] font-semibold'
                : 'text-[var(--pragna-text-muted)] hover:bg-[var(--pragna-surface)] hover:text-[var(--pragna-text)]'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-[rgba(212,175,55,0.1)] text-[var(--pragna-gold-soft)] shrink-0">
              <MessageSquare size={14} />
            </span>
            <span className="flex-1 text-left truncate">All Conversations</span>
            <span className="text-[11px] font-mono text-[var(--pragna-text-muted)]">{totalCount}</span>
          </button>

          {/* User Folders */}
          {folders.map((folder) => {
            const folderId = folder.id || folder.name
            const folderName = folder.name || folderId
            const chatCount = Array.isArray(folder.chat_ids)
              ? folder.chat_ids.length
              : Array.isArray(folder.chats)
              ? folder.chats.length
              : 0

            return (
              <div key={folderId} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() => onSelect(folderId)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    activeFolder === folderId
                      ? 'bg-[rgba(212,175,55,0.15)] text-[var(--pragna-gold-soft)] font-semibold'
                      : 'text-[var(--pragna-text-muted)] hover:bg-[var(--pragna-surface)] hover:text-[var(--pragna-text)]'
                  }`}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-[rgba(212,175,55,0.08)] text-[var(--pragna-gold-soft)] shrink-0">
                    <Folder size={14} />
                  </span>
                  <span className="flex-1 text-left truncate">{folderName}</span>
                  <span className="text-[11px] font-mono text-[var(--pragna-text-muted)]">{chatCount}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`Delete folder "${folderName}"?`)) {
                      deleteFolder?.(folderId)
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[var(--pragna-text-muted)] hover:text-red-400 absolute right-8 transition-opacity cursor-pointer"
                  title="Delete folder"
                >
                  <TrashIcon size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Storage / Summary Indicator */}
      <div className="px-4 py-3 border-t border-[var(--pragna-border)] shrink-0 bg-[var(--pragna-surface-2)]">
        <p className="text-[11px] text-[var(--pragna-text-muted)]">Total Saved Chats</p>
        <p className="text-xs font-bold text-[var(--pragna-text)] mt-0.5">
          {totalCount} {totalCount === 1 ? 'conversation' : 'conversations'}
        </p>
      </div>
    </div>
  )
}
