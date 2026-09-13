import { useState, useMemo, useContext } from 'react'
import FolderTree from './FolderTree'
import ConversationList from './ConversationList'
import { ChatContext } from '../../../context/ChatContext'

export default function HistoryLayout({ onSelectChat }) {
  const {
    chats = [],
    folders = [],
    deleteChat,
    setActiveChatId,
  } = useContext(ChatContext)

  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    let list = chats || []

    // Filter by folder if selected
    if (activeFilter !== 'all') {
      const folder = folders.find((f) => (f.id || f.name) === activeFilter)
      if (folder) {
        const folderChatIds = new Set(folder.chat_ids || (folder.chats || []).map((c) => c.id || c))
        list = list.filter((c) => folderChatIds.has(c.id))
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((c) => {
        const titleMatch = (c.title || '').toLowerCase().includes(q)
        const msgMatch = (c.messages || []).some((m) =>
          (m.text || '').toLowerCase().includes(q)
        )
        return titleMatch || msgMatch
      })
    }

    return list
  }, [chats, folders, activeFilter, searchQuery])

  const handleSelect = (id) => {
    setActiveChatId(id)
    if (onSelectChat) {
      onSelectChat(id)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this conversation? This action cannot be undone.')) {
      deleteChat(id)
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <FolderTree
        activeFolder={activeFilter}
        onSelect={setActiveFilter}
        totalCount={chats.length}
      />
      <ConversationList
        conversations={filtered}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={filtered.length}
        onSelectConversation={handleSelect}
        onDeleteConversation={handleDelete}
      />
    </div>
  )
}
