import { useState, useRef, useEffect, useContext } from 'react'
import { Layers, Code as CodeIcon } from 'lucide-react'
import {
  PlusIcon,
  ChatsIcon,
  ImagesIcon,
  StarredIcon,
  SearchIcon,
  SettingsIcon,
  LogoutIcon,
  PanelCollapseIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderPlusIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  PinIcon,
} from './PragnaIcon'
import pragnaLogo from '../../assets/pragna-logo-full.png'
import ChatManagementAPI from '../../api/chatManagement'
import RecentItem from './RecentItem'
import { ChatContext } from '../../context/ChatContext'

const Sidebar = ({
  activeView,
  onViewChange,
  recentChats,
  activeChatId,
  onSelectRecent,
  onDeleteRecent,
  onNewChat,
  onLogout,
  userProfile,
  onClose,
  onOpenSettings,
}) => {
  const {
    chats,
    setChats,
    renameChat,
    pinChat,
    deleteChat,
    folders,
    createFolder,
    renameFolder,
    deleteFolder,
    moveChatToFolder,
    toggleSidebar,
    sidebarSearchInputRef,
    duplicateChat,
    setHighlightedMessageId,
  } = useContext(ChatContext)

  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderMenuOpenId, setFolderMenuOpenId] = useState(null)
  const [folderRenameId, setFolderRenameId] = useState(null)
  const [folderRenameName, setFolderRenameName] = useState('')

  const allChats = chats && chats.length > 0 ? chats : (recentChats || [])

  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await ChatManagementAPI.searchChats(q)
        if (res && Array.isArray(res.results)) {
          setSearchResults(res.results)
        } else {
          const localHits = []
          allChats.forEach((chat) => {
            if ((chat.title || '').toLowerCase().includes(q.toLowerCase())) {
              localHits.push({
                chat_id: chat.id,
                title: chat.title || 'New chat',
                snippet: chat.title || 'New chat',
                match_type: 'title',
                timestamp: null,
              })
            }
            (chat.messages || []).forEach((msg) => {
              if ((msg.text || '').toLowerCase().includes(q.toLowerCase())) {
                localHits.push({
                  chat_id: chat.id,
                  title: chat.title || 'New chat',
                  snippet: msg.text,
                  match_type: 'message',
                  sender: msg.sender,
                  message_id: msg.id,
                  timestamp: msg.timestamp,
                })
              }
            })
          })
          setSearchResults(localHits)
        }
      } catch (err) {
        console.error('Error searching chats:', err)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery, allChats])

  // Collapsed state for the folder/recents/pinned sections in the sidebar list
  const [collapsedSections, setCollapsedSections] = useState(() => {
    const saved = localStorage.getItem('pragna_collapsed_sections')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })

  const toggleSection = (sectionId) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      localStorage.setItem('pragna_collapsed_sections', JSON.stringify([...next]))
      return next
    })
  }

  // Menu popup states
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const userMenuRef = useRef(null)
  const userButtonRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        !userButtonRef.current?.contains(event.target)
      ) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  const handleChangeView = (viewId) => {
    onViewChange(viewId)
    if (onClose) onClose()
  }

  const handlePinChat = async (chatId) => {
    try {
      setLoading('pin')
      const targetChat = allChats.find((c) => c.id === chatId)
      const nextPinned = !targetChat?.pinned
      if (pinChat) {
        pinChat(chatId, nextPinned)
      } else {
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, pinned: nextPinned } : c)))
        await ChatManagementAPI.pinChat(chatId, nextPinned)
      }
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to pin chat')
      console.error('Error pinning chat:', err)
    } finally {
      setLoading(null)
    }
  }

  const handleRename = async (chatId, titleToSet) => {
    try {
      setLoading('rename')
      if (renameChat) {
        renameChat(chatId, titleToSet)
      } else {
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: titleToSet } : c)))
        await ChatManagementAPI.renameChat(chatId, titleToSet)
      }
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to rename chat')
      console.error('Error renaming chat:', err)
    } finally {
      setLoading(null)
    }
  }

  const handleShare = async (chatId) => {
    try {
      setLoading('share')
      const targetChat = allChats.find((c) => c.id === chatId)
      const title = targetChat?.title || 'New chat'
      const messages = targetChat?.messages || []
      const result = await ChatManagementAPI.shareChat(chatId, title, messages)
      const shareUrl = `${window.location.origin}${result.share_url}`
      await navigator.clipboard.writeText(shareUrl)
      alert(`Share link copied to clipboard!\n${shareUrl}`)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to share chat')
      console.error('Error sharing chat:', err)
    } finally {
      setLoading(null)
    }
  }

  const handleExport = (chatId) => {
    const targetChat = allChats.find((c) => c.id === chatId)
    if (!targetChat) return

    const title = targetChat.title || 'New chat'
    const lines = [`# ${title}`, '', `_Exported ${new Date().toISOString()}_`, '', '---', '']

    for (const msg of targetChat.messages || []) {
      const speaker = msg.sender === 'bot' ? 'Pragna' : 'You'
      lines.push(`**${speaker}:** ${msg.text || ''}`)
      if (msg.attachments?.length) {
        for (const att of msg.attachments) {
          lines.push(`_[attached: ${att.name}]_`)
        }
      }
      lines.push('')
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'chat'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePdfExport = (chatId) => {
    const targetChat = allChats.find((c) => c.id === chatId)
    if (!targetChat) return

    const title = targetChat.title || 'New chat'
    const escapeHtml = (str) =>
      (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const turns = (targetChat.messages || [])
      .map((msg) => {
        const speaker = msg.sender === 'bot' ? 'Pragna' : 'You'
        let html = `<p><strong>${speaker}:</strong> ${escapeHtml(msg.text)}</p>`
        if (msg.attachments?.length) {
          for (const att of msg.attachments) {
            html += `<p><em>[attached: ${escapeHtml(att.name)}]</em></p>`
          }
        }
        return html
      })
      .join('\n')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #1a1a1a; }
  h1 { font-size: 22px; }
  .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
  hr { border: none; border-top: 1px solid #ccc; margin: 24px 0; }
  p { line-height: 1.6; white-space: pre-wrap; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">Exported ${new Date().toISOString()}</div>
<hr>
${turns}
</body>
</html>`

    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }

  const handleDuplicate = (chatId) => {
    duplicateChat(chatId)
    handleChangeView('chats')
  }

  const handleDelete = async (chatId) => {
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      try {
        setLoading('delete')
        if (deleteChat) {
          deleteChat(chatId)
        }
        onDeleteRecent?.(chatId)
        await ChatManagementAPI.deleteChat(chatId)
        setError(null)
      } catch (err) {
        setError(err.message || 'Failed to delete chat')
        console.error('Error deleting chat:', err)
      } finally {
        setLoading(null)
      }
    }
  }

  const rawUsername = userProfile?.username || localStorage.getItem('authUsername') || ''
  const rawEmail = userProfile?.email || localStorage.getItem('authEmail') || ''

  const displayName = rawUsername.trim() || (rawEmail && !rawEmail.includes('@dev.local') ? rawEmail.split('@')[0] : 'User')
  const displayEmail = rawEmail.includes('@dev.local') ? '' : rawEmail.trim()
  const initials = (displayName.slice(0, 1) || 'U').toUpperCase()

  const navIcon = (name) => {
    switch (name) {
      case 'chats':
        return <ChatsIcon size={18} />
      case 'tasks':
        return <Layers size={18} />
      case 'images':
        return <ImagesIcon size={18} />
      case 'agent':
        return <CodeIcon size={18} />
      case 'starred':
        return <StarredIcon size={18} />
      case 'chat-history-folders':
      case 'history':
        return <FolderIcon size={18} />
      default:
        return null
    }
  }

  const gearIcon = (name) => {
    switch (name) {
      case 'gear':
        return <SettingsIcon size={17} />
      case 'logout':
        return <LogoutIcon size={17} />
      default:
        return null
    }
  }

  const navItemsList = [
    { id: 'chats', label: 'Chats' },
    { id: 'chat-history-folders', label: 'History & Folders' },
    { id: 'tasks', label: 'Tasks & Kanban' },
    { id: 'images', label: 'Images' },
    { id: 'agent', label: 'Coding Agent' },
    { id: 'starred', label: 'Starred requests' },
  ]

  const filteredChats = allChats.filter((chat) => {
    const query = searchQuery.toLowerCase()
    if (!query) return true
    const titleMatch = (chat.title || 'New chat').toLowerCase().includes(query)
    const messageMatch = (chat.messages || []).some((msg) => (msg.text || '').toLowerCase().includes(query))
    return titleMatch || messageMatch
  })

  const pinnedChatsList = filteredChats.filter((chat) => chat.pinned)
  const unfiledChats = filteredChats.filter((chat) => !chat.pinned && !chat.folderId)

  return (
    <aside style={{ width: onClose ? '100%' : '270px', maxWidth: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--pragna-surface)', borderRight: '1px solid var(--pragna-border)', backdropFilter: 'blur(8px)', height: '100%' }}>
      
      {/* Wordmark logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px 20px', flexShrink: 0, gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={pragnaLogo}
            alt="Pragna-1 A"
            style={{
              height: '34px',
              width: 'auto',
              maxWidth: '175px',
              objectFit: 'contain',
              display: 'block',
              filter: 'drop-shadow(0 2px 10px rgba(212,175,55,0.2))',
            }}
          />
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            title="Close menu"
            style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--pragna-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            className="hover:bg-[var(--pragna-surface-2)] hover:text-[var(--pragna-gold-soft)]"
          >
            <PanelCollapseIcon size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            title="Close sidebar"
            style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--pragna-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            className="hover:bg-[var(--pragna-surface-2)] hover:text-[var(--pragna-gold-soft)]"
          >
            <PanelCollapseIcon size={18} />
          </button>
        )}
      </div>
      {/* New chat button (Sticky, non-scrollable) */}
      <div style={{ padding: '6px 16px 14px 16px', flexShrink: 0 }}>
        <button
          onClick={() => {
            onNewChat()
            if (onClose) onClose()
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '9px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(212,175,55,0.35)',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.16), rgba(184,134,11,0.10))',
            color: 'var(--pragna-gold-soft)',
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.3px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
            transition: 'all 0.15s ease',
          }}
          className="hover:border-accent-500/55 hover:shadow-premium-md hover:from-accent-500/[.26] hover:to-accent-700/[.16] active:scale-[0.98]"
        >
          <PlusIcon size={15} strokeWidth={2.4} />
          New chat
        </button>
      </div>

      {/* Unified Scrollable body containing nav links and chat list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
        className="sidebar-scroll-body"
      >

        {/* Nav links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '0 12px', flexShrink: 0, marginBottom: '8px' }}>
          {navItemsList.map((nav) => {
            const active = activeView === nav.id
            return (
              <button
                key={nav.id}
                onClick={() => handleChangeView(nav.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '13px',
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '11px',
                  border: active ? '1px solid rgba(212,175,55,0.30)' : '1px solid transparent',
                  background: active ? 'linear-gradient(135deg, rgba(212,175,55,0.14), rgba(184,134,11,0.07))' : 'transparent',
                  color: active ? 'var(--pragna-gold-soft)' : 'var(--pragna-text-soft)',
                  fontSize: '14.5px',
                  fontWeight: active ? 650 : 500,
                  letterSpacing: '0.2px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                className="hover:bg-[var(--pragna-surface-2)] hover:text-[var(--pragna-gold-soft)]"
              >
                <span style={{ display: 'flex', width: '20px', height: '20px', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {navIcon(nav.id)}
                </span>
                {nav.label}
              </button>
            )
          })}
        </nav>

        {/* Recents list and Folders */}
        <div
          style={{
            padding: '16px 12px 12px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ padding: '0 8px 10px 8px', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--pragna-text-muted)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.8,
              }}
            >
              <SearchIcon size={14} />
            </span>
            <input
              ref={sidebarSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              style={{
                width: '100%',
                padding: searchQuery ? '7px 54px 7px 34px' : '7px 42px 7px 34px',
                borderRadius: '8px',
                border: '1px solid var(--pragna-border)',
                background: 'var(--pragna-surface-2)',
                color: 'var(--pragna-text)',
                fontSize: '12.5px',
                boxSizing: 'border-box',
              }}
              className="focus-ring"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                style={{
                  position: 'absolute',
                  right: '44px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--pragna-text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px 4px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            ) : null}
            <span
              title="Open command palette (jump to any chat or run an action)"
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '10px',
                fontFamily: 'monospace',
                color: 'var(--pragna-text-muted)',
                background: 'var(--pragna-surface)',
                border: '1px solid var(--pragna-border)',
                borderRadius: '4px',
                padding: '1px 5px',
                pointerEvents: 'none',
                opacity: 0.75,
              }}
            >
              ⌘K
            </span>
          </div>

          {searchQuery.trim() ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--pragna-text-muted)' }}>
                <span>SEARCH RESULTS ({searchResults.length})</span>
                {isSearching && <span style={{ fontSize: '10px', color: 'var(--pragna-gold-soft)' }}>Searching…</span>}
              </div>

              {searchResults.length === 0 && !isSearching ? (
                <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--pragna-text-muted)', fontSize: '13px' }}>
                  No past conversations or messages matched "{searchQuery}".
                </div>
              ) : (
                searchResults.map((result, idx) => {
                  const isMessageMatch = result.match_type === 'message'
                  const isActive = result.chat_id === activeChatId
                  return (
                    <button
                      key={`${result.chat_id}-${result.message_id || idx}`}
                      type="button"
                      onClick={() => {
                        onSelectRecent(result.chat_id)
                        if (result.message_id && setHighlightedMessageId) {
                          setHighlightedMessageId(result.message_id)
                        }
                        handleChangeView('chats')
                        if (onClose) onClose()
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '4px',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isActive ? '1px solid rgba(212,175,55,0.35)' : '1px solid var(--pragna-border)',
                        background: isActive ? 'linear-gradient(135deg, rgba(212,175,55,0.16), rgba(184,134,11,0.08))' : 'var(--pragna-surface-2)',
                        color: 'var(--pragna-text)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      className="hover:border-accent-500/50 hover:bg-[var(--pragna-surface-3)]"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                        <span style={{ fontWeight: 650, fontSize: '13px', color: isActive ? 'var(--pragna-gold-soft)' : 'var(--pragna-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {result.title || 'New chat'}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isMessageMatch ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.08)',
                            color: isMessageMatch ? 'var(--pragna-gold-soft)' : 'var(--pragna-text-muted)',
                            flexShrink: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                          }}
                        >
                          {isMessageMatch ? (result.sender === 'user' ? 'Your message' : 'AI message') : 'Title match'}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--pragna-text-muted)',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {result.snippet}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          ) : (
            <>
              {/* Pinned section */}
              {pinnedChatsList.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div
                    onClick={() => toggleSection('pinned')}
                    title={collapsedSections.has('pinned') ? 'Expand pinned' : 'Minimize pinned'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '2px',
                      color: 'var(--pragna-gold-soft)',
                      padding: '4px 14px',
                      margin: '0 0 6px 0',
                      cursor: 'pointer',
                      borderRadius: '6px',
                    }}
                    className="hover:bg-[var(--pragna-surface-2)]"
                  >
                    <ChevronDownIcon
                      size={12}
                      style={{
                        transform: collapsedSections.has('pinned') ? 'rotate(-90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                        flexShrink: 0,
                      }}
                    />
                    <PinIcon size={12} color="var(--pragna-gold-soft)" />
                    <span>PINNED</span>
                    <span style={{ color: '#8c7639', fontSize: '11px' }}>({pinnedChatsList.length})</span>
                  </div>

                  <div style={{ display: collapsedSections.has('pinned') ? 'none' : 'flex', flexDirection: 'column', gap: '3px' }}>
                    {pinnedChatsList.map((chat) => (
                      <RecentItem
                        key={`pinned-${chat.id}`}
                        id={chat.id}
                        title={chat.title || 'New chat'}
                        active={chat.id === activeChatId}
                        isPinned={true}
                        folders={folders}
                        currentFolderId={chat.folderId || null}
                        onClick={() => {
                          onSelectRecent(chat.id)
                          handleChangeView('chats')
                        }}
                        onDelete={() => handleDelete(chat.id)}
                        onRename={(titleToSet) => handleRename(chat.id, titleToSet)}
                        onShare={() => handleShare(chat.id)}
                        onExport={() => handleExport(chat.id)}
                        onPdfExport={() => handlePdfExport(chat.id)}
                        onDuplicate={() => handleDuplicate(chat.id)}
                        onPinChat={() => handlePinChat(chat.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Folder sections */}
              {folders.map((folder) => {
                const folderChats = filteredChats.filter((c) => c.folderId === folder.id)
                return (
                  <div
                    key={folder.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const chatId = e.dataTransfer.getData('text/plain')
                      if (chatId) moveChatToFolder(chatId, folder.id)
                    }}
                    style={{ marginBottom: '6px' }}
                  >
                    {folderRenameId === folder.id ? (
                      <div style={{ padding: '6px 14px' }}>
                        <input
                          autoFocus
                          type="text"
                          value={folderRenameName}
                          onChange={(e) => setFolderRenameName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid var(--pragna-border)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            background: 'var(--pragna-surface-2)',
                            color: 'var(--pragna-text)',
                          }}
                          onBlur={() => {
                            if (folderRenameName.trim()) renameFolder(folder.id, folderRenameName)
                            setFolderRenameId(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && folderRenameName.trim()) {
                              renameFolder(folder.id, folderRenameName)
                              setFolderRenameId(null)
                            } else if (e.key === 'Escape') {
                              setFolderRenameId(null)
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => toggleSection(folder.id)}
                        title={collapsedSections.has(folder.id) ? 'Expand folder' : 'Minimize folder'}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', position: 'relative', cursor: 'pointer', borderRadius: '6px' }}
                        className="hover:bg-[var(--pragna-surface-2)]"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11.5px', fontWeight: 700, letterSpacing: '1px', color: 'var(--pragna-text-muted)' }}>
                          <ChevronDownIcon
                            size={12}
                            style={{
                              transform: collapsedSections.has(folder.id) ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.15s ease',
                              flexShrink: 0,
                            }}
                          />
                          <FolderIcon size={13} />
                          <span>{folder.name.toUpperCase()}</span>
                          <span style={{ color: '#6b6152' }}>({folderChats.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFolderMenuOpenId(folderMenuOpenId === folder.id ? null : folder.id)
                          }}
                          style={{ padding: '2px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--pragna-text-muted)', cursor: 'pointer', display: 'flex' }}
                          aria-label={`Menu for ${folder.name}`}
                        >
                          <MoreVerticalIcon size={13} />
                        </button>
                        {folderMenuOpenId === folder.id && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={(e) => { e.stopPropagation(); setFolderMenuOpenId(null) }} />
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: 'calc(100% + 2px)',
                                width: '150px',
                                zIndex: 100,
                                padding: '4px',
                                borderRadius: '10px',
                                background: 'var(--pragna-surface)',
                                border: '1px solid rgba(212,175,55,0.22)',
                                boxShadow: '0 10px 24px rgba(0,0,0,0.5)',
                              }}
                            >
                              <button
                                onClick={() => {
                                  setFolderRenameId(folder.id)
                                  setFolderRenameName(folder.name)
                                  setFolderMenuOpenId(null)
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', border: 'none', background: 'transparent', color: '#d8cbb0', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
                                className="hover:bg-[#1e1a10] hover:text-[var(--pragna-gold-soft)]"
                              >
                                <EditIcon size={14} />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete folder "${folder.name}"? Chats inside will be moved back to Recents.`)) {
                                    deleteFolder(folder.id)
                                  }
                                  setFolderMenuOpenId(null)
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', border: 'none', background: 'transparent', color: '#d98b7f', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}
                                className="hover:bg-[#301614]"
                              >
                                <TrashIcon size={14} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div style={{ display: collapsedSections.has(folder.id) ? 'none' : 'flex', flexDirection: 'column', gap: '3px' }}>
                      {folderChats.map((chat) => (
                        <RecentItem
                          key={chat.id}
                          id={chat.id}
                          title={chat.title || 'New chat'}
                          active={chat.id === activeChatId}
                          isPinned={!!chat.pinned}
                          folders={folders}
                          currentFolderId={chat.folderId || null}
                          onMoveToFolder={(folderId) => moveChatToFolder(chat.id, folderId)}
                          onClick={() => {
                            onSelectRecent(chat.id)
                            handleChangeView('chats')
                          }}
                          onDelete={() => handleDelete(chat.id)}
                          onRename={(titleToSet) => handleRename(chat.id, titleToSet)}
                          onShare={() => handleShare(chat.id)}
                          onExport={() => handleExport(chat.id)}
                          onPdfExport={() => handlePdfExport(chat.id)}
                          onDuplicate={() => handleDuplicate(chat.id)}
                          onPinChat={() => handlePinChat(chat.id)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Unfiled chats */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const chatId = e.dataTransfer.getData('text/plain')
                  if (chatId) moveChatToFolder(chatId, null)
                }}
              >
                <div
                  onClick={() => toggleSection('recents')}
                  title={collapsedSections.has('recents') ? 'Expand recents' : 'Minimize recents'}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: 'var(--pragna-text-muted)', padding: '4px 14px', margin: '0 0 6px 0', cursor: 'pointer', borderRadius: '6px' }}
                  className="hover:bg-[var(--pragna-surface-2)]"
                >
                  <ChevronDownIcon
                    size={12}
                    style={{
                      transform: collapsedSections.has('recents') ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                      flexShrink: 0,
                    }}
                  />
                  RECENTS
                </div>

                <div style={{ display: collapsedSections.has('recents') ? 'none' : 'flex', flexDirection: 'column', gap: '3px' }}>
                  {unfiledChats.map((chat) => (
                    <RecentItem
                      key={chat.id}
                      id={chat.id}
                      title={chat.title || 'New chat'}
                      active={chat.id === activeChatId}
                      isPinned={!!chat.pinned}
                      folders={folders}
                      currentFolderId={null}
                      onMoveToFolder={(folderId) => moveChatToFolder(chat.id, folderId)}
                      onClick={() => {
                        onSelectRecent(chat.id)
                        handleChangeView('chats')
                      }}
                      onDelete={() => handleDelete(chat.id)}
                      onRename={(titleToSet) => handleRename(chat.id, titleToSet)}
                      onShare={() => handleShare(chat.id)}
                      onExport={() => handleExport(chat.id)}
                      onPdfExport={() => handlePdfExport(chat.id)}
                      onDuplicate={() => handleDuplicate(chat.id)}
                      onPinChat={() => handlePinChat(chat.id)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* User footer with menu popup overlay */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {userMenuOpen && (
          <>
            {/* Click-out backdrop */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              onClick={() => setUserMenuOpen(false)}
            />

            {/* Menu Popup */}
            <div
              ref={userMenuRef}
              style={{
                position: 'absolute',
                bottom: '68px',
                left: '12px',
                width: '244px',
                zIndex: 41,
                padding: '8px',
                borderRadius: '14px',
                background: 'var(--pragna-surface)',
                border: '1px solid rgba(212,175,55,0.22)',
                boxShadow: '0 20px 32px rgba(0,0,0,0.50)',
                animation: 'fadeUp 0.15s ease',
              }}
            >
              {/* Settings */}
              <button
                onClick={() => {
                  setUserMenuOpen(false)
                  if (onClose) onClose()
                  onOpenSettings?.()
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 12px', borderRadius: '9px', border: 'none', background: 'transparent', color: '#d8cbb0', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                className="hover:bg-[#1e1a10] hover:text-[var(--pragna-gold-soft)]"
              >
                <span style={{ display: 'flex', width: '16px', height: '16px', color: 'var(--pragna-text-muted)', flexShrink: 0 }}>
                  {gearIcon('gear')}
                </span>
                <span style={{ flex: 1 }}>Settings</span>
                <span style={{ fontSize: '11px', color: '#6b6152' }}>Ctrl ⇧,</span>
              </button>

              {/* Log out */}
              <button
                onClick={() => {
                  setUserMenuOpen(false)
                  onLogout?.()
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 12px', borderRadius: '9px', border: 'none', background: 'transparent', color: '#d8cbb0', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                className="hover:bg-[#1e1a10] hover:text-[var(--pragna-gold-soft)]"
              >
                <span style={{ display: 'flex', width: '16px', height: '16px', color: 'var(--pragna-text-muted)', flexShrink: 0 }}>
                  {gearIcon('logout')}
                </span>
                <span style={{ flex: 1 }}>Log out</span>
              </button>
            </div>
          </>
        )}

        {/* User bar element (clickable to toggle userMenuOpen) */}
        <div
          ref={userButtonRef}
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 18px',
            borderTop: '1px solid var(--pragna-border)',
            background: 'var(--pragna-surface-2)',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          className="hover:bg-[var(--pragna-surface-2)]"
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2a2415, var(--pragna-surface-2))',
              border: '1.5px solid rgba(212,175,55,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--pragna-accent)',
              fontWeight: 700,
              fontSize: '15px',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pragna-text)' }}>{displayName}</div>
            {displayEmail && (
              <div style={{ fontSize: '12px', color: 'var(--pragna-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayEmail}
              </div>
            )}
          </div>

          <button
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              border: 'none',
              background: 'transparent',
              color: 'var(--pragna-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            className="hover:bg-[var(--pragna-surface-2)] hover:text-[var(--pragna-gold-soft)]"
          >
            {gearIcon('gear')}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
