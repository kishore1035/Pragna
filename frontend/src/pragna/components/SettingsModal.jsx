import { useState, useEffect, useContext } from 'react'
import { ChatContext } from '../../context/ChatContext'
import { changePassword, deleteAccount } from '../../api/api'
import { SUPPORTED_LANGUAGE_OPTIONS } from '../../utils/language'
import PasswordInput from '../../components/ui/PasswordInput'
import { useMediaQuery } from '../hooks/useMediaQuery'
import {
  SettingsIcon,
  SunIcon,
  ShieldIcon,
  DownloadIcon,
  CloseIcon,
  SearchIcon,
  ChevronDownIcon,
  InfoIcon,
  SparklesIcon,
  BotIcon,
  GlobeIcon,
  SoundwaveIcon,
  CompareIcon,
  ZapIcon,
  ImagesIcon,
  CheckCircleIcon,
} from './PragnaIcon'

const SettingsModal = ({ isOpen, onClose, onLogout, userProfile }) => {
  const [activeTab, setActiveTab] = useState('General')
  const {
    userId,
    chatFont, setChatFont, chats, setChats,
    chatMode, setChatMode, language, setLanguage,
    desktopNotifications, setDesktopNotifications,
  } = useContext(ChatContext)

  const isMobile = useMediaQuery('(max-width: 640px)')

  const [userName, setUserName] = useState(() => userProfile?.username || localStorage.getItem('authUsername') || 'User')

  const [instructions, setInstructions] = useState(() => localStorage.getItem(`pragna_instructions_${userId}`) || '')
  const [generalSaved, setGeneralSaved] = useState(false)

  // Preferences drafts - only committed to ChatContext (and localStorage via
  // its own effects) when "Save changes" is clicked, not on every keystroke/select.
  const [draftChatFont, setDraftChatFont] = useState(chatFont)
  const [draftChatMode, setDraftChatMode] = useState(chatMode)
  const [draftLanguage, setDraftLanguage] = useState(language)
  const [draftNotifications, setDraftNotifications] = useState(desktopNotifications)
  const [prefsSaved, setPrefsSaved] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    // Re-sync drafts from live context each time the modal opens, so it
    // doesn't show stale values from a previous open-without-save.
    setDraftChatFont(chatFont)
    setDraftChatMode(chatMode)
    setDraftLanguage(language)
    setDraftNotifications(desktopNotifications)
  }, [isOpen])

  // Change password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Delete account
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Clear chat history
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  // Collapse/expand per-section - same localStorage-backed Set pattern used
  // by the sidebar's folder/recents sections. Danger zone defaults collapsed
  // (via defaultCollapsed below) so it's out of the way until deliberately opened.
  const [collapsedSettingsSections, setCollapsedSettingsSections] = useState(() => {
    const saved = localStorage.getItem('pragna_settings_collapsed')
    return saved ? new Set(JSON.parse(saved)) : new Set(['danger-zone'])
  })

  const toggleSettingsSection = (sectionId) => {
    setCollapsedSettingsSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      localStorage.setItem('pragna_settings_collapsed', JSON.stringify([...next]))
      return next
    })
  }

  const SectionToggle = ({ id, title, titleColor }) => {
    const collapsed = collapsedSettingsSections.has(id)
    return (
      <button
        type="button"
        onClick={() => toggleSettingsSection(id)}
        title={collapsed ? 'Expand' : 'Minimize'}
        style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
      >
        <ChevronDownIcon
          size={12}
          strokeWidth={2.4}
          style={{ color: 'var(--pragna-text-muted)', flexShrink: 0, transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
        />
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: titleColor || 'var(--pragna-text)' }}>{title}</h3>
      </button>
    )
  }

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Fill in all three fields.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')
    if (!deletePassword) {
      setDeleteError('Enter your password to confirm.')
      return
    }
    setDeleting(true)
    try {
      await deleteAccount(deletePassword)
      onClose()
      onLogout?.()
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account.')
      setDeleting(false)
    }
  }

  const handleSaveGeneral = () => {
    localStorage.setItem('authUsername', userName)
    localStorage.setItem(`pragna_instructions_${userId}`, instructions)
    setGeneralSaved(true)
    setTimeout(() => setGeneralSaved(false), 2500)
  }

  const handleSavePreferences = () => {
    setChatFont(draftChatFont)
    setChatMode(draftChatMode)
    setLanguage(draftLanguage)
    setDesktopNotifications(draftNotifications)
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 2500)
  }

  const handleClearHistory = () => {
    setChats([])
    setClearConfirmOpen(false)
  }

  const handleExportData = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      username: userName,
      chats,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pragna-chats-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  const userInitial = (userName[0] || 'U').toUpperCase()

  const gearIcon = (name) => {
    switch (name) {
      case 'gear':
        return <SettingsIcon size={16} />
      case 'sun':
        return <SunIcon size={16} />
      case 'shield':
        return <ShieldIcon size={16} />
      case 'download':
        return <DownloadIcon size={16} />
      case 'info':
        return <InfoIcon size={16} />
      default:
        return null
    }
  }

  const tabs = [
    { label: 'General', icon: 'gear' },
    { label: 'Preferences', icon: 'sun' },
    { label: 'Account', icon: 'shield' },
    { label: 'Data', icon: 'download' },
    { label: 'About Pragna', icon: 'info' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0 }}></div>
      <div style={{ position: 'relative', width: isMobile ? '100vw' : 'min(920px, 92vw)', height: isMobile ? '100dvh' : 'min(680px, 88vh)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', borderRadius: isMobile ? 0 : '20px', overflow: 'hidden', background: 'var(--pragna-surface)', border: isMobile ? 'none' : '1px solid rgba(212,175,55,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>

        {/* Settings Left Nav (horizontal tab strip on mobile) */}
        <div
          style={
            isMobile
              ? { width: '100%', flexShrink: 0, padding: '10px 10px', background: 'var(--pragna-surface-2)', borderBottom: '1px solid var(--pragna-border)', display: 'flex', flexDirection: 'row', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }
              : { width: '232px', flexShrink: 0, padding: '22px 14px', background: 'var(--pragna-surface-2)', borderRight: '1px solid var(--pragna-border)', display: 'flex', flexDirection: 'column', gap: '4px' }
          }
        >
          {!isMobile && (
            <>
              <div style={{ display: 'flex', gap: '9px', padding: '8px 10px 18px 10px', alignItems: 'center' }}>
                <SearchIcon size={15} color="var(--pragna-text-muted)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: 'var(--pragna-text-muted)', whiteSpace: 'nowrap' }}>Search settings</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: 'var(--pragna-text-muted)', padding: '0 10px 8px 10px' }}>SETTINGS</div>
            </>
          )}
          {tabs.map((tab) => {
            const active = activeTab === tab.label
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '11px',
                  padding: isMobile ? '8px 14px' : '10px 12px',
                  borderRadius: isMobile ? '999px' : '10px',
                  border: 'none',
                  background: active ? 'linear-gradient(135deg, rgba(212,175,55,0.16), rgba(184,134,11,0.08))' : 'transparent',
                  color: active ? 'var(--pragna-gold-soft)' : 'var(--pragna-text-soft)',
                  fontSize: '13.5px',
                  fontWeight: active ? 650 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
                className="hover:bg-[var(--pragna-surface-2)] hover:text-[var(--pragna-gold-soft)]"
              >
                <span style={{ display: 'flex', width: '16px', height: '16px', flexShrink: 0 }}>
                  {gearIcon(tab.icon)}
                </span>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Settings Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 16px 36px 16px' : '30px 40px', minWidth: 0, position: 'relative' }}>

          {/* Close button */}
          <button
            onClick={onClose}
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
              position: 'absolute',
              top: isMobile ? '12px' : '24px',
              right: isMobile ? '12px' : '28px',
              zIndex: 10,
            }}
            className="hover:bg-[var(--pragna-surface-2)] hover:text-[var(--pragna-gold-soft)]"
          >
            <CloseIcon size={16} />
          </button>

          {/* GENERAL TAB */}
          {activeTab === 'General' && (
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--pragna-text)', marginBottom: '4px' }}>General</div>
              <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--pragna-text-muted)' }}>Manage your profile and instructions.</p>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '8px' : '20px', marginBottom: '28px' }}>
                <div style={{ fontSize: '13px', color: 'var(--pragna-text-muted)', width: isMobile ? 'auto' : '110px', flexShrink: 0 }}>Full name</div>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{ width: isMobile ? '100%' : 'auto', flex: isMobile ? 'none' : 1, padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--pragna-border)', background: 'var(--pragna-surface-2)', color: 'var(--pragna-text)', fontFamily: 'inherit', fontSize: isMobile ? '16px' : '14px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <SectionToggle id="instructions" title="Instructions for Pragna" />
                {!collapsedSettingsSections.has('instructions') && (
                  <>
                    <p style={{ margin: '4px 0 12px 0', fontSize: '12.5px', color: 'var(--pragna-text-muted)' }}>Pragna keeps these in mind across chats.</p>
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. I primarily code in Python (not a beginner)"
                      rows="3"
                      style={{ width: '100%', resize: 'vertical', padding: '13px 14px', borderRadius: '12px', border: '1px solid var(--pragna-border)', background: 'var(--pragna-surface-2)', color: 'var(--pragna-text)', fontFamily: 'inherit', fontSize: isMobile ? '16px' : '14px', lineHeight: 1.5 }}
                    />
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '26px' }}>
                <button
                  onClick={handleSaveGeneral}
                  style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--pragna-gold-soft), var(--pragna-gold-deep))', color: 'var(--pragna-on-gold)', fontWeight: 650, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  Save changes
                </button>
                {generalSaved && (
                  <span style={{ fontSize: '12.5px', color: '#8fd19e' }}>Saved.</span>
                )}
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'Preferences' && (
            <div style={{ animation: 'fadeUp 0.15s ease' }}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 700, color: 'var(--pragna-text)' }}>Preferences</h2>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '8px' : '20px', marginBottom: '22px' }}>
                <div style={{ fontSize: '13px', color: 'var(--pragna-text-muted)', width: isMobile ? 'auto' : '150px', flexShrink: 0 }}>Chat font</div>
                <select
                  value={draftChatFont}
                  onChange={(e) => setDraftChatFont(e.target.value)}
                  style={{ width: isMobile ? '100%' : 'auto', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--pragna-border)', background: 'var(--pragna-surface-2)', color: 'var(--pragna-text)', fontFamily: 'inherit', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  <option>Default (Segoe UI)</option>
                  <option>Serif</option>
                  <option>Monospace</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '8px' : '20px', marginBottom: '22px' }}>
                <div style={{ fontSize: '13px', color: 'var(--pragna-text-muted)', width: isMobile ? 'auto' : '150px', flexShrink: 0 }}>Default chat mode</div>
                <select
                  value={draftChatMode}
                  onChange={(e) => setDraftChatMode(e.target.value)}
                  style={{ width: isMobile ? '100%' : 'auto', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--pragna-border)', background: 'var(--pragna-surface-2)', color: 'var(--pragna-text)', fontFamily: 'inherit', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  <option value="general">General</option>
                  <option value="explain_concepts">Explain</option>
                  <option value="generate_ideas">Ideas</option>
                  <option value="write_content">Write</option>
                  <option value="code_assistance">Code</option>
                  <option value="ask_questions">Questions</option>
                  <option value="creative_writing">Story</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '8px' : '20px', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', color: 'var(--pragna-text-muted)', width: isMobile ? 'auto' : '150px', flexShrink: 0 }}>Default response language</div>
                <select
                  value={draftLanguage}
                  onChange={(e) => setDraftLanguage(e.target.value)}
                  style={{ width: isMobile ? '100%' : 'auto', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--pragna-border)', background: 'var(--pragna-surface-2)', color: 'var(--pragna-text)', fontFamily: 'inherit', fontSize: '13.5px', cursor: 'pointer' }}
                >
                  {SUPPORTED_LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <p style={{ margin: isMobile ? '0 0 26px 0' : '0 0 26px 166px', fontSize: '12px', color: 'var(--pragna-text-muted)' }}>
                Can still be switched per-message from the composer.
              </p>

              <div style={{ height: '1px', background: 'var(--pragna-border)', marginBottom: '26px' }}></div>

              <SectionToggle id="notifications" title="Notifications" />
              {!collapsedSettingsSections.has('notifications') && (
                <>
                  <p style={{ margin: '4px 0 16px 0', fontSize: '12.5px', color: 'var(--pragna-text-muted)' }}>
                    Show a desktop notification when a response finishes while this tab is in the background.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', width: 'fit-content' }}>
                    <input
                      type="checkbox"
                      checked={draftNotifications}
                      onChange={(e) => setDraftNotifications(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--pragna-gold-soft)' }}
                    />
                    <span style={{ fontSize: '13.5px', color: 'var(--pragna-text)' }}>Desktop notifications</span>
                  </label>
                  {draftNotifications && typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
                    <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#e8a598' }}>
                      Notifications are blocked for this site in your browser settings - enable them there for this to work.
                    </p>
                  )}
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '30px' }}>
                <button
                  onClick={handleSavePreferences}
                  style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--pragna-gold-soft), var(--pragna-gold-deep))', color: 'var(--pragna-on-gold)', fontWeight: 650, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  Save changes
                </button>
                {prefsSaved && (
                  <span style={{ fontSize: '12.5px', color: '#8fd19e' }}>Saved.</span>
                )}
              </div>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'Account' && (
            <div style={{ animation: 'fadeUp 0.15s ease' }}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 700, color: 'var(--pragna-text)' }}>Account</h2>



              <div style={{ marginBottom: '10px' }}>
                <SectionToggle id="change-password" title="Change password" />
                {!collapsedSettingsSections.has('change-password') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px', marginTop: '12px' }}>
                  <PasswordInput
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    style={{ padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--pragna-border)', background: 'var(--pragna-surface-2)', color: 'var(--pragna-text)', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 characters)"
                    style={{ padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--pragna-border)', background: 'var(--pragna-surface-2)', color: 'var(--pragna-text)', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={{ padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--pragna-border)', background: 'var(--pragna-surface-2)', color: 'var(--pragna-text)', fontFamily: 'inherit', fontSize: '14px' }}
                  />
                  {passwordError && (
                    <div style={{ fontSize: '12.5px', color: '#e8a598' }}>{passwordError}</div>
                  )}
                  {passwordSuccess && (
                    <div style={{ fontSize: '12.5px', color: '#8fd19e' }}>{passwordSuccess}</div>
                  )}
                  <button
                    onClick={handleChangePassword}
                    disabled={passwordSaving}
                    style={{ alignSelf: 'flex-start', padding: '9px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--pragna-gold-soft), var(--pragna-gold-deep))', color: 'var(--pragna-on-gold)', fontWeight: 650, fontSize: '13.5px', cursor: passwordSaving ? 'default' : 'pointer', opacity: passwordSaving ? 0.7 : 1 }}
                  >
                    {passwordSaving ? 'Updating…' : 'Update password'}
                  </button>
                </div>
                )}
              </div>

              <div style={{ height: '1px', background: 'var(--pragna-border)', margin: '30px 0 26px 0' }}></div>

              <SectionToggle id="danger-zone" title="Danger zone" titleColor="#e8a598" />
              {!collapsedSettingsSections.has('danger-zone') && (
                <>
                  <p style={{ margin: '10px 0 16px 0', fontSize: '12.5px', color: 'var(--pragna-text-muted)' }}>
                    Permanently deletes your account, all chats, and all personas. This cannot be undone.
                  </p>

                  {!deleteConfirmOpen ? (
                    <button
                      onClick={() => setDeleteConfirmOpen(true)}
                      style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid rgba(220,110,100,0.4)', background: 'rgba(180,60,60,0.12)', color: '#e8a598', fontWeight: 650, fontSize: '13px', cursor: 'pointer' }}
                    >
                      Delete account
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px' }}>
                      <PasswordInput
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your password to confirm"
                        style={{ padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(220,110,100,0.4)', background: 'var(--pragna-surface-2)', color: 'var(--pragna-text)', fontFamily: 'inherit', fontSize: '14px' }}
                      />
                      {deleteError && (
                        <div style={{ fontSize: '12.5px', color: '#e8a598' }}>{deleteError}</div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleting}
                          style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#c0392b', color: '#fff', fontWeight: 650, fontSize: '13px', cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.7 : 1 }}
                        >
                          {deleting ? 'Deleting…' : 'Permanently delete my account'}
                        </button>
                        <button
                          onClick={() => { setDeleteConfirmOpen(false); setDeletePassword(''); setDeleteError('') }}
                          style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--pragna-border)', background: 'transparent', color: 'var(--pragna-text-muted)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* DATA TAB */}
          {activeTab === 'Data' && (
            <div style={{ animation: 'fadeUp 0.15s ease' }}>
              <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 700, color: 'var(--pragna-text)' }}>Data</h2>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '8px' : '20px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--pragna-text-muted)', width: isMobile ? 'auto' : '110px', flexShrink: 0 }}>Export chats</div>
                <button
                  onClick={handleExportData}
                  style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--pragna-border)', background: 'var(--pragna-surface-2)', color: 'var(--pragna-text)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                  className="hover:bg-[var(--pragna-surface)]"
                >
                  Download as JSON
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '8px' : '20px' }}>
                <div style={{ fontSize: '13px', color: 'var(--pragna-text-muted)', width: isMobile ? 'auto' : '110px', flexShrink: 0 }}>Chat history</div>
                {!clearConfirmOpen ? (
                  <button
                    onClick={() => setClearConfirmOpen(true)}
                    style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--pragna-border)', background: 'var(--pragna-surface-2)', color: 'var(--pragna-text)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                    className="hover:bg-[var(--pragna-surface)]"
                  >
                    Clear all chats
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--pragna-text-muted)' }}>Delete all {chats.length} chat{chats.length === 1 ? '' : 's'}? This can't be undone.</span>
                    <button
                      onClick={handleClearHistory}
                      style={{ padding: '7px 14px', borderRadius: '9px', border: 'none', background: '#c0392b', color: '#fff', fontWeight: 650, fontSize: '12.5px', cursor: 'pointer' }}
                    >
                      Yes, clear
                    </button>
                    <button
                      onClick={() => setClearConfirmOpen(false)}
                      style={{ padding: '7px 14px', borderRadius: '9px', border: '1px solid var(--pragna-border)', background: 'transparent', color: 'var(--pragna-text-muted)', fontWeight: 600, fontSize: '12.5px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABOUT PRAGNA TAB */}
          {activeTab === 'About Pragna' && (
            <div style={{ animation: 'fadeUp 0.15s ease' }}>
              {/* Product Introduction */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.3px', color: 'var(--pragna-gold-soft)', marginBottom: '6px' }}>
                  PRAGNA AI
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: 'var(--pragna-text-soft)', maxWidth: '560px' }}>
                  A thoughtful AI workspace built to help you understand, create, explore and get things done.
                </p>
              </div>

              <div style={{ height: '1px', background: 'var(--pragna-border)', marginBottom: '22px' }}></div>

              {/* Section Heading */}
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: 'var(--pragna-gold-soft)', textTransform: 'uppercase', marginBottom: '14px' }}>
                Capabilities
              </div>

              {/* Features Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px', marginBottom: '22px' }}>
                
                {/* 1. Pragna Canvas */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-[rgba(212,175,55,0.22)] hover:bg-[rgba(255,255,255,0.03)]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(212,175,55,0.08)', color: 'var(--pragna-gold-soft)', flexShrink: 0 }}>
                      <SparklesIcon size={14} />
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pragna-text)' }}>
                      Pragna Canvas
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--pragna-text-muted)' }}>
                    Turn ideas into clear visual structures. Pragna can transform complex information into diagrams, roadmaps, tables, timelines and other interactive views.
                  </p>
                </div>

                {/* 2. Pragna Autopilot */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-[rgba(212,175,55,0.22)] hover:bg-[rgba(255,255,255,0.03)]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(212,175,55,0.08)', color: 'var(--pragna-gold-soft)', flexShrink: 0 }}>
                      <ZapIcon size={14} />
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pragna-text)' }}>
                      Pragna Autopilot
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--pragna-text-muted)' }}>
                    Give Pragna a goal and let it break the task down, organize the work and guide you through the steps toward a result.
                  </p>
                </div>

                {/* 3. Indian Multilingual AI */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-[rgba(212,175,55,0.22)] hover:bg-[rgba(255,255,255,0.03)]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(212,175,55,0.08)', color: 'var(--pragna-gold-soft)', flexShrink: 0 }}>
                      <GlobeIcon size={14} />
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pragna-text)' }}>
                      Indian Multilingual AI
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--pragna-text-muted)' }}>
                    Communicate naturally across Indian languages with support for regional expressions, mixed-language conversations and context-aware responses.
                  </p>
                </div>

                {/* 4. Response Morphing */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-[rgba(212,175,55,0.22)] hover:bg-[rgba(255,255,255,0.03)]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(212,175,55,0.08)', color: 'var(--pragna-gold-soft)', flexShrink: 0 }}>
                      <CompareIcon size={14} />
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pragna-text)' }}>
                      Response Morphing
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--pragna-text-muted)' }}>
                    Shape an answer to fit the way you want to understand it — simpler, deeper, more precise, more creative or more concise.
                  </p>
                </div>

                {/* 5. Image Studio */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-[rgba(212,175,55,0.22)] hover:bg-[rgba(255,255,255,0.03)]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(212,175,55,0.08)', color: 'var(--pragna-gold-soft)', flexShrink: 0 }}>
                      <ImagesIcon size={14} />
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pragna-text)' }}>
                      Image Studio
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--pragna-text-muted)' }}>
                    Create and explore visual ideas directly inside Pragna, from simple concepts to detailed creative work.
                  </p>
                </div>

                {/* 6. Smart Search */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-[rgba(212,175,55,0.22)] hover:bg-[rgba(255,255,255,0.03)]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(212,175,55,0.08)', color: 'var(--pragna-gold-soft)', flexShrink: 0 }}>
                      <SearchIcon size={14} />
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pragna-text)' }}>
                      Smart Search
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--pragna-text-muted)' }}>
                    Find current information and explore topics beyond Pragna's built-in knowledge with live web grounding.
                  </p>
                </div>

                {/* 7. Voice Mode */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-[rgba(212,175,55,0.22)] hover:bg-[rgba(255,255,255,0.03)]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(212,175,55,0.08)', color: 'var(--pragna-gold-soft)', flexShrink: 0 }}>
                      <SoundwaveIcon size={14} />
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pragna-text)' }}>
                      Voice Mode
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--pragna-text-muted)' }}>
                    Speak naturally with hands-free conversation, ambient voice recognition and expressive spoken responses.
                  </p>
                </div>

                {/* 8. Memory & Continuity */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-[rgba(212,175,55,0.22)] hover:bg-[rgba(255,255,255,0.03)]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(212,175,55,0.08)', color: 'var(--pragna-gold-soft)', flexShrink: 0 }}>
                      <BotIcon size={14} />
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--pragna-text)' }}>
                      Memory & Continuity
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.55, color: 'var(--pragna-text-muted)' }}>
                    Pragna can remember useful context from your conversations so future interactions feel more continuous and relevant.
                  </p>
                </div>

              </div>

              {/* Supported Languages Note */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  marginBottom: '18px',
                  fontSize: '12px',
                  lineHeight: 1.55,
                  color: 'var(--pragna-text-muted)',
                }}
              >
                <span style={{ color: 'var(--pragna-gold-soft)', fontWeight: 600 }}>Supported Languages: </span>
                English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Bengali, and Urdu.
              </div>

              {/* Minimal Brand Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '11.5px',
                  color: 'var(--pragna-text-muted)',
                  opacity: 0.6,
                  paddingTop: '4px',
                }}
              >
                <span>Pragna — Designed for thoughtful exploration and creation.</span>
                <span>© 2026 Pragna AI</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default SettingsModal
