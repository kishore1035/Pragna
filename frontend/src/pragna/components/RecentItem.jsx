import { useState, useRef, useEffect } from 'react'
import {
  ChatsIcon,
  MoreVerticalIcon,
  ShareIcon,
  EditIcon,
  PinIcon,
  TrashIcon,
  DownloadIcon,
  CopyIcon,
  PrinterIcon,
} from './PragnaIcon'

const RecentItem = ({
  id,
  title,
  onClick,
  onDelete,
  onRename,
  onShare,
  onExport,
  onPdfExport,
  onDuplicate,
  onPinChat,
  active = false,
  isPinned = false,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title || '')
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    setEditTitle(title || '')
  }, [title])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && !buttonRef.current?.contains(event.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleMenuClick = (e, callback) => {
    e.stopPropagation()
    callback?.()
    setShowMenu(false)
  }

  const handleSaveRename = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== title) {
      onRename?.(trimmed)
    } else {
      setEditTitle(title || '')
    }
    setIsEditing(false)
  }

  const handleCancelRename = () => {
    setEditTitle(title || '')
    setIsEditing(false)
  }

  return (
    <div
      onClick={isEditing ? undefined : onClick}
      draggable={!isEditing}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick?.()
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        padding: '9px 12px',
        borderRadius: '10px',
        cursor: isEditing ? 'default' : 'pointer',
        background: active ? 'var(--pragna-surface-2)' : 'transparent',
        border: `1px solid ${active ? 'rgba(212,175,55,0.22)' : 'transparent'}`,
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
      className="group focus-ring"
    >
      {/* Pinned badge icon or normal chats icon */}
      {isPinned ? (
        <PinIcon
          size={14}
          color="var(--pragna-gold-soft)"
          style={{ flexShrink: 0 }}
        />
      ) : (
        <ChatsIcon
          size={14}
          color={active ? 'var(--pragna-text)' : 'var(--pragna-text-muted)'}
          style={{ flexShrink: 0 }}
        />
      )}

      {/* Title or Inline Edit Input */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={handleSaveRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSaveRename()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              handleCancelRename()
            }
          }}
          style={{
            flex: 1,
            fontSize: '13px',
            padding: '3px 7px',
            borderRadius: '6px',
            border: '1px solid var(--pragna-gold-soft)',
            background: 'rgba(0, 0, 0, 0.45)',
            color: 'var(--pragna-text)',
            outline: 'none',
            boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.15)',
          }}
        />
      ) : (
        <span
          style={{
            flex: 1,
            fontSize: '13.5px',
            color: active ? 'var(--pragna-text)' : 'var(--pragna-text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </span>
      )}

      {/* Action button */}
      {!isEditing && (
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          style={{
            padding: '2px',
            borderRadius: '4px',
            border: 'none',
            background: 'transparent',
            color: 'var(--pragna-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: active || showMenu ? 1 : 0,
            transition: 'all 0.15s ease',
          }}
          className="group-hover:opacity-100"
          aria-label={`Menu for ${title}`}
        >
          <MoreVerticalIcon size={13} />
        </button>
      )}

      {/* Context Menu (without Archive, Group Chat, Move to Folder) */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            right: '8px',
            top: 'calc(100% + 4px)',
            width: '170px',
            zIndex: 100,
            padding: '4px',
            borderRadius: '10px',
            background: 'var(--pragna-surface)',
            border: '1px solid rgba(212,175,55,0.22)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.55)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => handleMenuClick(e, onShare)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '7px',
              border: 'none',
              background: 'transparent',
              color: '#d8cbb0',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="hover:bg-[#1e1a10] hover:text-[var(--pragna-gold-soft)]"
          >
            <ShareIcon size={14} />
            <span>Share</span>
          </button>

          <button
            onClick={(e) => handleMenuClick(e, onExport)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '7px',
              border: 'none',
              background: 'transparent',
              color: '#d8cbb0',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="hover:bg-[#1e1a10] hover:text-[var(--pragna-gold-soft)]"
          >
            <DownloadIcon size={14} />
            <span>Export</span>
          </button>

          <button
            onClick={(e) => handleMenuClick(e, onPdfExport)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '7px',
              border: 'none',
              background: 'transparent',
              color: '#d8cbb0',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="hover:bg-[#1e1a10] hover:text-[var(--pragna-gold-soft)]"
          >
            <PrinterIcon size={14} />
            <span>Export as PDF</span>
          </button>

          <button
            onClick={(e) => handleMenuClick(e, onDuplicate)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '7px',
              border: 'none',
              background: 'transparent',
              color: '#d8cbb0',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="hover:bg-[#1e1a10] hover:text-[var(--pragna-gold-soft)]"
          >
            <CopyIcon size={14} />
            <span>Duplicate</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(false)
              setIsEditing(true)
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '7px',
              border: 'none',
              background: 'transparent',
              color: '#d8cbb0',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="hover:bg-[#1e1a10] hover:text-[var(--pragna-gold-soft)]"
          >
            <EditIcon size={14} />
            <span>Rename</span>
          </button>

          <button
            onClick={(e) => handleMenuClick(e, onPinChat)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '7px',
              border: 'none',
              background: 'transparent',
              color: '#d8cbb0',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="hover:bg-[#1e1a10] hover:text-[var(--pragna-gold-soft)]"
          >
            <PinIcon size={14} color={isPinned ? 'var(--pragna-gold-soft)' : undefined} />
            <span>{isPinned ? 'Unpin' : 'Pin'}</span>
          </button>

          <div style={{ height: '1px', background: 'var(--pragna-border)', margin: '4px 0' }} />

          <button
            onClick={(e) => handleMenuClick(e, onDelete)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '7px',
              border: 'none',
              background: 'transparent',
              color: '#d98b7f',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="hover:bg-[#301614]"
          >
            <TrashIcon size={14} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default RecentItem
