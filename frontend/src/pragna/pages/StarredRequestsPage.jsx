import { useMemo, useState } from 'react'
import pragnaShield from '../../assets/pragna-shield-icon.png'
import {
  StarredIcon as StarIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  SearchIcon,
} from '../components/PragnaIcon'

export default function StarredRequestsPage({ chats, setChats, onOpenChat }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'user', 'bot'
  const [copiedId, setCopiedId] = useState(null)

  // Extract all starred items across conversations
  const starredItems = useMemo(() => {
    const list = []
    chats.forEach((c) => {
      (c.messages || []).forEach((m, idx) => {
        if (m.bookmarked) {
          list.push({
            id: `${c.id}_${idx}`,
            chatId: c.id,
            chatTitle: c.title || 'Untitled Chat',
            message: m,
            messageIdx: idx,
            isUser: m.sender !== 'bot',
            text: m.text || '',
            timestamp: m.timestamp || c.createdAt || null,
          })
        }
      })
    })
    return list
  }, [chats])

  // Filter based on search query & tab selection
  const filteredItems = useMemo(() => {
    return starredItems.filter((item) => {
      if (filterType === 'user' && !item.isUser) return false
      if (filterType === 'bot' && item.isUser) return false

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const textMatch = item.text.toLowerCase().includes(query)
        const titleMatch = item.chatTitle.toLowerCase().includes(query)
        return textMatch || titleMatch
      }
      return true
    })
  }, [starredItems, filterType, searchQuery])

  const handleUnstar = (chatId, messageIdx) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map((m, i) =>
                i === messageIdx ? { ...m, bookmarked: false } : m
              ),
            }
          : c
      )
    )
  }

  const handleCopy = (id, text) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '24px 24px 60px 24px',
        background: 'var(--pragna-bg)',
        color: 'var(--pragna-text)',
        position: 'relative',
      }}
      className="custom-scrollbar"
    >
      {/* Background ambient gold radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.08))',
                border: '1px solid rgba(212,175,55,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--pragna-gold-soft)',
                boxShadow: '0 4px 16px rgba(212,175,55,0.15)',
              }}
            >
              <StarIcon filled={true} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--pragna-text)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Starred Requests
              </h1>
              <p
                style={{
                  fontSize: '13.5px',
                  color: 'var(--pragna-text-muted)',
                  margin: '2px 0 0 0',
                }}
              >
                Access and manage all your bookmarked user requests and AI responses in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Controls Bar: Search & Filter Tabs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '24px',
            padding: '14px 18px',
            borderRadius: '14px',
            background: 'var(--pragna-surface)',
            border: '1px solid var(--pragna-border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 260px',
              maxWidth: '400px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div style={{ position: 'absolute', left: '12px', color: 'var(--pragna-text-muted)', display: 'flex' }}>
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search starred requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid rgba(212,175,55,0.2)',
                background: 'var(--pragna-bg)',
                color: 'var(--pragna-text)',
                fontSize: '13.5px',
                outline: 'none',
              }}
              className="focus:border-[var(--pragna-gold-soft)]"
            />
          </div>

          {/* Type Filters */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--pragna-bg)', padding: '4px', borderRadius: '10px', border: '1px solid var(--pragna-border)' }}>
            {[
              { id: 'all', label: `All (${starredItems.length})` },
              { id: 'user', label: `Requests (${starredItems.filter((i) => i.isUser).length})` },
              { id: 'bot', label: `Responses (${starredItems.filter((i) => !i.isUser).length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: filterType === tab.id ? 650 : 500,
                  cursor: 'pointer',
                  background: filterType === tab.id ? 'var(--pragna-surface-2)' : 'transparent',
                  color: filterType === tab.id ? 'var(--pragna-gold-soft)' : 'var(--pragna-text-muted)',
                  transition: 'all 0.15s ease',
                  boxShadow: filterType === tab.id ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        {filteredItems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              borderRadius: '16px',
              background: 'var(--pragna-surface)',
              border: '1px solid var(--pragna-border)',
              margin: '20px 0',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(212,175,55,0.12)',
                border: '1px solid rgba(212,175,55,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: 'var(--pragna-gold-soft)',
              }}
            >
              <StarIcon filled={false} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 650, color: 'var(--pragna-text)', margin: '0 0 6px 0' }}>
              {searchQuery ? 'No matching starred requests' : 'No starred requests yet'}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--pragna-text-muted)', maxWidth: '420px', margin: '0 auto' }}>
              {searchQuery
                ? 'Try tweaking your search keywords or switching filters.'
                : 'Click the star icon (⭐) under any request or response in a chat to save it here for instant access.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredItems.map((item) => {
              const isCopied = copiedId === item.id

              return (
                <div
                  key={item.id}
                  style={{
                    borderRadius: '14px',
                    background: 'var(--pragna-surface)',
                    border: '1px solid var(--pragna-border)',
                    padding: '18px 20px',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-[rgba(212,175,55,0.35)]"
                >
                  {/* Card Header: Badge, Chat Title, Actions */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      marginBottom: '12px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid rgba(212,175,55,0.12)',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto' }}>
                      {/* Sender Tag */}
                      {item.isUser ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, var(--pragna-gold-soft), var(--pragna-gold))',
                            color: 'var(--pragna-on-gold)',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                          }}
                        >
                          User Request
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            background: 'rgba(212,175,55,0.15)',
                            border: '1px solid rgba(212,175,55,0.3)',
                            color: 'var(--pragna-gold-soft)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                          }}
                        >
                          <img src={pragnaShield} alt="" style={{ width: '12px', height: '12px' }} />
                          Pragna Response
                        </span>
                      )}

                      {/* Chat Origin Title */}
                      <span
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--pragna-text-muted)',
                          fontWeight: 500,
                          wordBreak: 'break-word',
                        }}
                      >
                        From: <strong style={{ color: 'var(--pragna-text)' }}>{item.chatTitle}</strong>
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>

                      {/* Open Chat */}
                      <button
                        type="button"
                        onClick={() => onOpenChat(item.chatId)}
                        title="Open in chat"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(212,175,55,0.22)',
                          background: 'transparent',
                          color: 'var(--pragna-gold-soft)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        className="hover:bg-[#1e1a10] hover:scale-105"
                      >
                        <span>Open</span>
                        <ExternalLinkIcon />
                      </button>

                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.text)}
                        title={isCopied ? 'Copied!' : 'Copy text'}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: isCopied ? 'var(--pragna-gold-soft)' : 'var(--pragna-text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        className="hover:bg-[var(--pragna-surface-2)] hover:text-[var(--pragna-gold-soft)]"
                      >
                        {isCopied ? <CheckIcon /> : <CopyIcon />}
                      </button>

                      {/* Unstar */}
                      <button
                        type="button"
                        onClick={() => handleUnstar(item.chatId, item.messageIdx)}
                        title="Remove from starred"
                        style={{
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--pragna-gold-soft)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        className="hover:bg-[var(--pragna-surface-2)] hover:text-[#ff6b6b]"
                      >
                        <StarIcon filled={true} />
                      </button>
                    </div>
                  </div>

                  {/* Message Body Content */}
                  <div
                    style={{
                      fontSize: '14.5px',
                      lineHeight: '1.6',
                      color: 'var(--pragna-text)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.text}
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
