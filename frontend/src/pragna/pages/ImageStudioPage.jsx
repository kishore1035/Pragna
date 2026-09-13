import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import {
  getImageStudioConfig,
  getImageHistory,
  deleteImageHistoryItem,
  clearImageHistory,
} from '../../api/api'
import {
  ImagesIcon,
  DownloadIcon,
  SparklesIcon,
  SearchIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
  RetryIcon,
  CloseIcon,
  ZapIcon,
  ChevronDownIcon,
} from '../components/PragnaIcon'

const STYLE_OPTIONS = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'photo', label: 'Photorealistic' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'concept_art', label: 'Concept Art' },
  { value: 'product', label: 'Product Shot' },
  { value: 'anime', label: 'Anime / Manga' },
  { value: 'digital_art', label: 'Digital Art' },
  { value: 'fantasy', label: 'Fantasy Landscape' },
]

const QUALITY_OPTIONS = [
  { value: 'hd', label: 'HD Quality' },
  { value: 'standard', label: 'Standard' },
  { value: 'draft', label: 'Draft / Fast' },
]

const SIZE_OPTIONS = [
  { value: '1024x1024', label: 'Square (1024x1024)' },
  { value: '1024x1536', label: 'Portrait (1024x1536)' },
  { value: '1536x1024', label: 'Landscape (1536x1024)' },
]

const formatTimestamp = (dateStr) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const now = new Date()
    const diffSec = Math.floor((now - d) / 1000)
    if (diffSec < 60) return 'Just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const ImageStudioPage = ({
  imagePrompt,
  setImagePrompt,
  imageStyle,
  setImageStyle,
  imageQuality,
  setImageQuality,
  imageSize,
  setImageSize,
  isGeneratingImage,
  generatedImage,
  setGeneratedImage,
  imageError,
  onGenerate,
  onSendToChat,
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTabletOrMobile = useMediaQuery('(max-width: 1024px)')

  const [rateLimit, setRateLimit] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historySearch, setHistorySearch] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [isClearing, setIsClearing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Fetch config and history on mount
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await getImageHistory(50, 0)
      if (res && Array.isArray(res.history)) {
        setHistory(res.history)
      } else if (Array.isArray(res)) {
        setHistory(res)
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    getImageStudioConfig()
      .then((data) => {
        if (isMounted && data?.rate_limit) {
          setRateLimit(data.rate_limit)
        }
      })
      .catch(() => {})

    fetchHistory()

    return () => {
      isMounted = false
    }
  }, [fetchHistory])

  // Automatically refresh history when a new image is generated
  useEffect(() => {
    if (generatedImage?.image) {
      fetchHistory()
    }
  }, [generatedImage, fetchHistory])

  // Copy prompt helper
  const handleCopyPrompt = (id, promptText) => {
    if (!promptText) return
    navigator.clipboard.writeText(promptText)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Remix / Use Prompt in Studio controls
  const handleRemix = (item) => {
    if (item.prompt) setImagePrompt(item.prompt)
    if (item.style) setImageStyle(item.style)
    if (item.quality) setImageQuality(item.quality)
    if (item.size) setImageSize(item.size)

    if (selectedImage) {
      setSelectedImage(null)
    }

    // Scroll smoothly to studio top on mobile
    if (isTabletOrMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Delete a single item
  const handleDeleteItem = async (e, id) => {
    e.stopPropagation()
    if (deletingId) return
    setDeletingId(id)
    try {
      const ok = await deleteImageHistoryItem(id)
      if (ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id))
        if (selectedImage?.id === id) {
          setSelectedImage(null)
        }
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  // Delete currently displayed generated image
  const handleDeleteCurrent = async () => {
    if (!generatedImage) return
    const currentId = generatedImage.id
    if (currentId) {
      try {
        await deleteImageHistoryItem(currentId)
        setHistory((prev) => prev.filter((item) => item.id !== currentId))
      } catch {
        // ignore
      }
    }
    if (selectedImage?.id === currentId || selectedImage?.image === generatedImage.image) {
      setSelectedImage(null)
    }
    if (typeof setGeneratedImage === 'function') {
      setGeneratedImage(null)
    }
  }

  // Clear all history
  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      const ok = await clearImageHistory()
      if (ok) {
        setHistory([])
        setSelectedImage(null)
        setShowClearConfirm(false)
      }
    } catch {
      // ignore
    } finally {
      setIsClearing(false)
    }
  }

  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [styleFilter, setStyleFilter] = useState('all')

  const PROMPT_SUGGESTIONS = [
    'A cyberpunk samurai in a rain-slicked neon Tokyo street, 8k cinematic reflections',
    'Ethereal floating islands in a pastel sunset sky with cascading waterfalls',
    'Hyperrealistic golden hour studio portrait of an astronaut with glowing helmet visor',
    'Majestic ancient dragon wrapped around a crystal mountain peak, volumetric fog',
  ]

  // Filter history by search query and style filter
  const filteredHistory = useMemo(() => {
    let list = history
    if (styleFilter !== 'all') {
      list = list.filter((item) => item.style && item.style.toLowerCase() === styleFilter.toLowerCase())
    }
    const q = historySearch.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (item) =>
        (item.prompt && item.prompt.toLowerCase().includes(q)) ||
        (item.effective_prompt && item.effective_prompt.toLowerCase().includes(q)) ||
        (item.style && item.style.toLowerCase().includes(q)) ||
        (item.provider && item.provider.toLowerCase().includes(q)) ||
        (item.model && item.model.toLowerCase().includes(q))
    )
  }, [history, historySearch, styleFilter])

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '16px 12px 24px 12px' : '20px 28px 24px 28px',
        animation: 'fadeUp 0.3s ease',
        height: '100%',
        position: 'relative',
        background: 'var(--pragna-bg)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="custom-scrollbar"
    >
      {/* Background ambient gold radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top Minimal Header */}
      <div
        style={{
          maxWidth: generatedImage?.image ? '100%' : '760px',
          width: '100%',
          margin: '0 auto 16px auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2,
          position: 'relative',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.05))',
              border: '1px solid rgba(212,175,55,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--pragna-gold-soft)',
            }}
          >
            <ImagesIcon size={18} />
          </div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--pragna-text)', letterSpacing: '-0.02em' }}>
            AI Image Studio
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {rateLimit && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--pragna-gold-soft)',
                background: 'rgba(212, 175, 55, 0.08)',
                padding: '4px 10px',
                borderRadius: '16px',
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              Limit: {rateLimit}/acct
            </span>
          )}

          {/* History Drawer Toggle Button */}
          <button
            onClick={() => setHistoryDrawerOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              background: 'rgba(212, 175, 55, 0.08)',
              color: 'var(--pragna-gold-soft)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            className="hover:bg-[rgba(212,175,55,0.16)] hover:border-[var(--pragna-gold-soft)]"
            title="Open History"
          >
            <ImagesIcon size={14} />
            <span>History</span>
            <span
              style={{
                fontSize: '10.5px',
                background: 'rgba(212, 175, 55, 0.25)',
                padding: '0 6px',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {history.length}
            </span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW: Single Screen Adaptive Layout */}
      <div
        style={{
          maxWidth: generatedImage?.image ? '100%' : '760px',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: generatedImage?.image && !isTabletOrMobile ? '380px minmax(0, 1fr)' : '1fr',
          gap: '20px',
          alignItems: 'start',
          position: 'relative',
          zIndex: 1,
          flex: 1,
        }}
      >
        {/* Creation Studio Card */}
        <div
          style={{
            padding: isMobile ? '16px' : '22px 24px',
            borderRadius: '20px',
            background: 'linear-gradient(180deg, rgba(26, 23, 19, 0.85) 0%, rgba(16, 14, 11, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Card Top Title Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SparklesIcon size={14} color="var(--pragna-gold-soft)" />
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--pragna-text)' }}>
                Prompt & Controls
              </span>
            </div>
            {imagePrompt && (
              <button
                onClick={() => setImagePrompt('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--pragna-text-muted)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
                className="hover:text-[var(--pragna-gold-soft)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Prompt Textarea */}
          <div style={{ position: 'relative' }}>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              rows={generatedImage?.image ? "3" : "4"}
              style={{
                width: '100%',
                resize: 'none',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                background: 'rgba(0, 0, 0, 0.35)',
                color: 'var(--pragna-text)',
                fontFamily: 'inherit',
                fontSize: isMobile ? '14px' : '13px',
                lineHeight: 1.5,
                padding: '12px 14px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(212, 175, 55, 0.5)'
                e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.09)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Artistic Style Chips */}
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--pragna-text-muted)', marginBottom: '6px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Style
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {STYLE_OPTIONS.map((opt) => {
                const isSelected = imageStyle === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setImageStyle(opt.value)}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid rgba(212, 175, 55, 0.55)' : '1px solid rgba(255, 255, 255, 0.06)',
                      background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.025)',
                      color: isSelected ? 'var(--pragna-gold-soft)' : 'var(--pragna-text-muted)',
                      fontSize: '11px',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    className={isSelected ? '' : 'hover:text-[var(--pragna-text)] hover:bg-[rgba(255,255,255,0.05)]'}
                    title={opt.label}
                  >
                    {opt.label.split(' ')[0]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Aspect Ratio & Quality Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Aspect Ratio */}
            <div>
              <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--pragna-text-muted)', marginBottom: '6px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Ratio
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {SIZE_OPTIONS.map((opt) => {
                  const isSelected = imageSize === opt.value
                  const short = opt.value === '1024x1024' ? '1:1' : opt.value === '1024x1536' ? '9:16' : '16:9'
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setImageSize(opt.value)}
                      style={{
                        padding: '6px 2px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid rgba(212, 175, 55, 0.55)' : '1px solid rgba(255, 255, 255, 0.06)',
                        background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.025)',
                        color: isSelected ? 'var(--pragna-gold-soft)' : 'var(--pragna-text-muted)',
                        fontSize: '11px',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {short}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quality */}
            <div>
              <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--pragna-text-muted)', marginBottom: '6px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Quality
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {QUALITY_OPTIONS.map((opt) => {
                  const isSelected = imageQuality === opt.value
                  const short = opt.value === 'hd' ? 'HD' : opt.value === 'standard' ? 'Std' : 'Draft'
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setImageQuality(opt.value)}
                      style={{
                        padding: '6px 2px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid rgba(212, 175, 55, 0.55)' : '1px solid rgba(255, 255, 255, 0.06)',
                        background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.025)',
                        color: isSelected ? 'var(--pragna-gold-soft)' : 'var(--pragna-text-muted)',
                        fontSize: '11px',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {short}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            <button
              onClick={onGenerate}
              disabled={isGeneratingImage || !imagePrompt.trim()}
              style={{
                flex: 1.5,
                padding: '11px 18px',
                borderRadius: '11px',
                border: 'none',
                background: 'linear-gradient(135deg, #e5c56d 0%, #c49a37 100%)',
                color: '#12100C',
                fontSize: '13px',
                fontWeight: 700,
                cursor: (isGeneratingImage || !imagePrompt.trim()) ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px -4px rgba(212, 175, 55, 0.3)',
                transition: 'all 0.2s ease',
                opacity: (isGeneratingImage || !imagePrompt.trim()) ? 0.45 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {isGeneratingImage ? (
                <>
                  <div
                    style={{
                      width: '13px',
                      height: '13px',
                      border: '2px solid rgba(0,0,0,0.3)',
                      borderTopColor: '#12100C',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <SparklesIcon size={14} />
                  <span>Generate Artwork</span>
                </>
              )}
            </button>

            <button
              onClick={onSendToChat}
              style={{
                padding: '11px 14px',
                borderRadius: '11px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--pragna-text-muted)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              className="hover:text-[var(--pragna-gold-soft)] hover:border-accent-500/40"
            >
              Send to Chat
            </button>
          </div>

          {/* Error Message */}
          {imageError && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '9px',
                background: 'rgba(180,60,60,0.12)',
                border: '1px solid rgba(220,110,100,0.3)',
                color: '#e8a598',
                fontSize: '12px',
                lineHeight: 1.4,
              }}
            >
              ⚠️ {imageError}
            </div>
          )}
        </div>

        {/* Right / Side-by-Side Artwork Output Hero (When Image Generated) */}
        {generatedImage?.image && (
          <div
            style={{
              padding: isMobile ? '16px' : '20px',
              borderRadius: '20px',
              background: 'linear-gradient(180deg, rgba(26, 23, 19, 0.85) 0%, rgba(16, 14, 11, 0.95) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--pragna-gold-soft)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Generated Result
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--pragna-text-muted)' }}>
                  {generatedImage.model || 'Flux'}
                </span>
                <button
                  onClick={handleDeleteCurrent}
                  title="Delete image"
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '6px',
                    color: '#f87171',
                    padding: '3px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:bg-[rgba(239,68,68,0.2)] hover:border-red-500/50 hover:text-red-300"
                >
                  <TrashIcon size={12} />
                </button>
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                background: '#0a0908',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: 'calc(100vh - 270px)',
              }}
              onClick={() => setSelectedImage(generatedImage)}
            >
              <img
                src={generatedImage.image}
                alt="Generated AI"
                style={{ width: '100%', maxHeight: 'calc(100vh - 270px)', objectFit: 'contain', display: 'block' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.35)',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  gap: '6px',
                }}
                className="hover:opacity-100"
              >
                <SearchIcon size={14} /> Click to Expand HD
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <a
                href={generatedImage.image}
                download={`pragna-art-${Date.now()}.png`}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(212,175,55,0.3)',
                  background: 'rgba(212,175,55,0.08)',
                  textDecoration: 'none',
                  color: 'var(--pragna-gold-soft)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <DownloadIcon size={13} /> Download
              </a>

              <button
                onClick={() => handleCopyPrompt('latest', generatedImage.effective_prompt || imagePrompt)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--pragna-text-muted)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copiedId === 'latest' ? <CheckIcon size={12} color="var(--pragna-gold-soft)" /> : <CopyIcon size={12} />}
                <span>{copiedId === 'latest' ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDeleteCurrent}
                title="Delete this artwork"
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#f87171',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
                className="hover:bg-[rgba(239,68,68,0.2)] hover:border-red-500/50 hover:text-red-300"
              >
                <TrashIcon size={12} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* HISTORY SLIDE-OVER SIDEBAR DRAWER */}
      {historyDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              zIndex: 50,
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={() => setHistoryDrawerOpen(false)}
          />

          {/* Drawer Sidebar Panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: isMobile ? '100vw' : '440px',
              maxWidth: '100vw',
              background: '#14120E',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.8)',
              zIndex: 51,
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideLeft 0.25s ease',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--pragna-text)', letterSpacing: '-0.01em' }}>
                  Creations History
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--pragna-gold-soft)',
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {history.length}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={fetchHistory}
                  disabled={historyLoading}
                  title="Refresh creations"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'var(--pragna-text-muted)',
                    cursor: historyLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11.5px',
                  }}
                  className="hover:text-[var(--pragna-gold-soft)]"
                >
                  <div style={{ animation: historyLoading ? 'spin 1s linear infinite' : 'none', display: 'flex' }}>
                    <RetryIcon size={12} />
                  </div>
                  <span>Refresh</span>
                </button>

                {history.length > 0 && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowClearConfirm((v) => !v)}
                      disabled={isClearing}
                      title="Clear history"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(220,110,100,0.25)',
                        background: 'rgba(180,60,60,0.08)',
                        color: '#e8a598',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11.5px',
                      }}
                    >
                      <TrashIcon size={12} />
                      <span>Clear</span>
                    </button>

                    {showClearConfirm && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          right: 0,
                          width: '220px',
                          padding: '12px',
                          borderRadius: '12px',
                          background: '#1A1815',
                          border: '1px solid rgba(220,110,100,0.35)',
                          boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
                          zIndex: 20,
                          fontSize: '12px',
                        }}
                      >
                        <p style={{ margin: '0 0 10px 0', color: '#e8a598', fontWeight: 500, lineHeight: 1.4 }}>
                          Clear all image history?
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setShowClearConfirm(false)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              background: 'transparent',
                              color: 'var(--pragna-text-muted)',
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleClearAll}
                            disabled={isClearing}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: '#c24136',
                              color: '#fff',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                          >
                            {isClearing ? 'Clearing...' : 'Clear'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setHistoryDrawerOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--pragna-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="hover:text-white"
                  title="Close Drawer"
                >
                  <CloseIcon size={14} />
                </button>
              </div>
            </div>

            {/* Drawer Search & Filter Toolbar */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <SearchIcon
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--pragna-text-muted)',
                  }}
                />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search prompts or styles..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(0, 0, 0, 0.35)',
                    color: 'var(--pragna-text)',
                    fontSize: '12.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(212, 175, 55, 0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--pragna-text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <CloseIcon size={12} />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }} className="custom-scrollbar">
                {['all', 'cinematic', 'photo', 'illustration', 'concept_art', 'anime', 'digital_art', 'fantasy'].map((st) => {
                  const label = st === 'all' ? 'All' : st === 'photo' ? 'Photo' : st === 'concept_art' ? 'Concept' : st === 'digital_art' ? 'Digital' : st.charAt(0).toUpperCase() + st.slice(1)
                  const isSelected = styleFilter === st
                  return (
                    <button
                      key={st}
                      onClick={() => setStyleFilter(st)}
                      style={{
                        padding: '3px 9px',
                        borderRadius: '12px',
                        border: isSelected ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                        background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        color: isSelected ? 'var(--pragna-gold-soft)' : 'var(--pragna-text-muted)',
                        fontSize: '11px',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                      className={isSelected ? '' : 'hover:text-[var(--pragna-text)]'}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Drawer Feed List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }} className="custom-scrollbar">
              {historyLoading && history.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', gap: '10px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid rgba(212,175,55,0.2)',
                      borderTopColor: 'var(--pragna-gold-soft)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span style={{ fontSize: '12.5px', color: 'var(--pragna-text-muted)' }}>
                    Loading creations...
                  </span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--pragna-text-muted)', fontSize: '13px' }}>
                  {historySearch || styleFilter !== 'all' ? 'No creations match your filter.' : 'No creations in history yet.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filteredHistory.map((item) => {
                    const imgSource = item.image_url || item.image
                    const isItemCopied = copiedId === item.id
                    const isItemDeleting = deletingId === item.id

                    return (
                      <div
                        key={item.id || item.created_at}
                        style={{
                          borderRadius: '14px',
                          background: 'rgba(255, 255, 255, 0.025)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.2s ease',
                        }}
                        className="hover:border-[var(--pragna-gold-soft)] group"
                      >
                        {/* Image Thumbnail with Overlay */}
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            paddingTop: '56%',
                            background: '#0a0908',
                            cursor: 'pointer',
                            overflow: 'hidden',
                          }}
                          onClick={() => {
                            setSelectedImage(item)
                          }}
                        >
                          <img
                            src={imgSource}
                            alt={item.prompt || 'Generated art'}
                            loading="lazy"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease',
                            }}
                            className="group-hover:scale-105"
                          />

                          {/* Top Badges */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '6px',
                              left: '6px',
                              right: '6px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              pointerEvents: 'none',
                            }}
                          >
                            {item.style && (
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  color: '#fff',
                                  background: 'rgba(0,0,0,0.65)',
                                  backdropFilter: 'blur(6px)',
                                  padding: '2px 6px',
                                  borderRadius: '5px',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                }}
                              >
                                {item.style}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '9px',
                                color: 'rgba(255,255,255,0.85)',
                                background: 'rgba(0,0,0,0.65)',
                                backdropFilter: 'blur(6px)',
                                padding: '2px 6px',
                                borderRadius: '5px',
                                marginLeft: 'auto',
                              }}
                            >
                              {formatTimestamp(item.created_at)}
                            </span>
                          </div>

                          {/* Hover Action Overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                              opacity: 0,
                              transition: 'opacity 0.2s ease',
                              display: 'flex',
                              alignItems: 'flex-end',
                              padding: '8px',
                              gap: '6px',
                            }}
                            className="group-hover:opacity-100"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImage(item)
                              }}
                              style={{
                                flex: 1,
                                padding: '5px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                backdropFilter: 'blur(4px)',
                              }}
                            >
                              <SearchIcon size={11} /> View HD
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemix(item)
                                setHistoryDrawerOpen(false)
                              }}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, var(--pragna-gold-soft), var(--pragna-gold-deep))',
                                border: 'none',
                                color: '#12100C',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                              }}
                            >
                              <ZapIcon size={11} /> Remix
                            </button>
                          </div>
                        </div>

                        {/* Card Content & Action Buttons */}
                        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '11.5px',
                              color: 'var(--pragna-text)',
                              lineHeight: 1.45,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                            }}
                            title={item.prompt}
                          >
                            {item.prompt}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                onClick={() => handleCopyPrompt(item.id, item.effective_prompt || item.prompt)}
                                title="Copy Prompt"
                                style={{
                                  padding: '4px 6px',
                                  borderRadius: '5px',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  color: 'var(--pragna-text-muted)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '10.5px',
                                }}
                              >
                                {isItemCopied ? <CheckIcon size={10} color="var(--pragna-gold-soft)" /> : <CopyIcon size={10} />}
                              </button>

                              <a
                                href={imgSource}
                                download={`pragna-${item.id || Date.now()}.png`}
                                title="Download Artwork"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  padding: '4px 6px',
                                  borderRadius: '5px',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  color: 'var(--pragna-text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  textDecoration: 'none',
                                }}
                              >
                                <DownloadIcon size={10} />
                              </a>
                            </div>

                            <button
                              onClick={(e) => handleDeleteItem(e, item.id)}
                              disabled={isItemDeleting}
                              title="Delete Artwork"
                              style={{
                                padding: '4px 6px',
                                borderRadius: '5px',
                                border: 'none',
                                background: 'transparent',
                                color: 'rgba(220,110,100,0.6)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              className="hover:text-red-400"
                            >
                              <TrashIcon size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* FULL PREVIEW LIGHTBOX MODAL */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '12px' : '32px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '960px',
              width: '100%',
              maxHeight: '92vh',
              background: '#14120E',
              border: '1.5px solid rgba(212,175,55,0.3)',
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: isTabletOrMobile ? 'column' : 'row',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                zIndex: 10,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.65)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              <CloseIcon size={15} />
            </button>

            {/* Left: High-Res Image View */}
            <div
              style={{
                flex: 1.3,
                background: '#080706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: isTabletOrMobile ? '280px' : '480px',
                padding: '16px',
              }}
            >
              <img
                src={selectedImage.image_url || selectedImage.image}
                alt={selectedImage.prompt || 'Artwork'}
                style={{
                  maxWidth: '100%',
                  maxHeight: isTabletOrMobile ? '40vh' : '75vh',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                }}
              />
            </div>

            {/* Right: Detailed Metadata & Inspector */}
            <div
              style={{
                flex: 1,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                overflowY: 'auto',
                maxHeight: isTabletOrMobile ? '45vh' : '80vh',
              }}
              className="custom-scrollbar"
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--pragna-gold-soft)',
                      letterSpacing: '1px',
                      background: 'rgba(212,175,55,0.12)',
                      padding: '3px 9px',
                      borderRadius: '8px',
                      border: '1px solid rgba(212,175,55,0.25)',
                    }}
                  >
                    {selectedImage.style || 'Custom Style'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--pragna-text-muted)' }}>
                    {formatTimestamp(selectedImage.created_at)}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 600, color: 'var(--pragna-text)', lineHeight: 1.4 }}>
                  Prompt Details
                </h3>

                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--pragna-text)', lineHeight: 1.55, background: 'var(--pragna-surface)', padding: '12px', borderRadius: '10px', border: '1px solid var(--pragna-border)', whiteSpace: 'pre-wrap' }}>
                  {selectedImage.prompt}
                </p>

                {selectedImage.effective_prompt && selectedImage.effective_prompt !== selectedImage.prompt && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: 'var(--pragna-gold-soft)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      LLM-Refined Prompt
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--pragna-text-muted)', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {selectedImage.effective_prompt}
                    </p>
                  </div>
                )}

                {/* Specs / Meta Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11.5px', color: 'var(--pragna-text-muted)', marginBottom: '16px' }}>
                  <div style={{ background: 'var(--pragna-surface)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--pragna-border)' }}>
                    <span style={{ display: 'block', opacity: 0.6, fontSize: '10px', textTransform: 'uppercase' }}>Dimensions</span>
                    <strong style={{ color: 'var(--pragna-text)' }}>{selectedImage.size || '1024x1024'}</strong>
                  </div>
                  <div style={{ background: 'var(--pragna-surface)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--pragna-border)' }}>
                    <span style={{ display: 'block', opacity: 0.6, fontSize: '10px', textTransform: 'uppercase' }}>Model / Engine</span>
                    <strong style={{ color: 'var(--pragna-text)' }}>{selectedImage.model || selectedImage.provider || 'DALL-E 3'}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleRemix(selectedImage)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, var(--pragna-gold-soft), var(--pragna-gold-deep))',
                      color: 'var(--pragna-bg)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <ZapIcon size={14} /> Remix in Studio
                  </button>

                  <a
                    href={selectedImage.image_url || selectedImage.image}
                    download={`pragna-art-${selectedImage.id || Date.now()}.png`}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(212,175,55,0.3)',
                      background: 'rgba(212,175,55,0.08)',
                      color: 'var(--pragna-gold-soft)',
                      fontWeight: 600,
                      fontSize: '13px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <DownloadIcon size={14} /> Download
                  </a>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleCopyPrompt(selectedImage.id, selectedImage.effective_prompt || selectedImage.prompt)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--pragna-border)',
                      background: 'transparent',
                      color: 'var(--pragna-text-muted)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    {copiedId === selectedImage.id ? <CheckIcon size={13} color="var(--pragna-gold-soft)" /> : <CopyIcon size={13} />}
                    <span>{copiedId === selectedImage.id ? 'Copied to Clipboard' : 'Copy Prompt'}</span>
                  </button>

                  {selectedImage.id && (
                    <button
                      onClick={(e) => handleDeleteItem(e, selectedImage.id)}
                      disabled={deletingId === selectedImage.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(220,110,100,0.3)',
                        background: 'transparent',
                        color: '#e8a598',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <TrashIcon size={13} />
                      <span>{deletingId === selectedImage.id ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageStudioPage
