import { useContext, useEffect, useState } from 'react'
import { ChevronDownIcon } from '../components/PragnaIcon'
import { ChatContext } from '../../context/ChatContext'
import { getModelsCatalog, runCompare } from '../../api/api'
import { normalizeLanguageCode } from '../../utils/language'
import { useMediaQuery } from '../hooks/useMediaQuery'

const MAX_MODELS = 4

const ComparePage = () => {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const { language } = useContext(ChatContext)

  const [catalog, setCatalog] = useState([])
  const [catalogError, setCatalogError] = useState('')
  const [selected, setSelected] = useState([])
  const [message, setMessage] = useState('')
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [collapsedCards, setCollapsedCards] = useState(new Set())

  const toggleCard = (modelKey) => {
    setCollapsedCards((prev) => {
      const next = new Set(prev)
      if (next.has(modelKey)) next.delete(modelKey)
      else next.add(modelKey)
      return next
    })
  }

  useEffect(() => {
    getModelsCatalog()
      .then((data) => {
        const models = data?.models || []
        setCatalog(models)
        // Default to the configured primary model plus its declared fallbacks,
        // capped at MAX_MODELS, so the picker starts pre-populated with models
        // that are actually likely to be reachable in this deployment.
        const preferred = [...new Set([data?.default_model_key, ...(data?.fallback_models || [])].filter(Boolean))]
        const known = new Set(models.map((m) => m.key))
        const initial = preferred.filter((key) => known.has(key)).slice(0, MAX_MODELS)
        setSelected(initial.length ? initial : models.slice(0, 2).map((m) => m.key))
      })
      .catch((err) => setCatalogError(err.message || 'Failed to load model catalog.'))
  }, [])

  const toggleModel = (key) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (prev.length >= MAX_MODELS) return prev
      return [...prev, key]
    })
  }

  const handleCompare = async () => {
    if (!message.trim() || selected.length === 0 || running) return
    setRunning(true)
    setError('')
    setResults(null)
    setCollapsedCards(new Set())
    try {
      const data = await runCompare({
        message: message.trim(),
        models: selected,
        language: normalizeLanguageCode(language),
      })
      setResults(data.results || [])
    } catch (err) {
      setError(err.message || 'Failed to run comparison.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '20px 16px 36px 16px' : '40px 48px 48px 48px',
        animation: 'fadeUp 0.35s ease',
        height: '100%',
        position: 'relative',
        background: 'var(--pragna-bg)',
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

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '28px', fontWeight: 700, color: 'var(--pragna-text)' }}>
          Compare Models
        </h1>
        <p style={{ margin: '0 0 26px 0', fontSize: '14.5px', color: 'var(--pragna-text-muted)' }}>
          Send one prompt to up to {MAX_MODELS} models at once and see their answers side-by-side.
        </p>

        <div
          style={{
            maxWidth: '820px',
            padding: isMobile ? '16px 14px' : '24px',
            borderRadius: '20px',
            background: 'rgba(18, 16, 12, 0.85)',
            border: '1.5px solid rgba(212, 175, 55, 0.28)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.08)',
            marginBottom: '28px',
          }}
        >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something to compare across models…"
          rows="3"
          style={{ width: '100%', resize: 'vertical', borderRadius: '12px', border: '1px solid var(--pragna-border)', background: 'var(--pragna-surface)', color: 'var(--pragna-text)', fontFamily: 'inherit', fontSize: isMobile ? '16px' : '14.5px', lineHeight: 1.55, padding: '14px 16px', marginBottom: '16px' }}
        />

        {catalogError && (
          <div style={{ fontSize: '13px', color: '#e8a598', marginBottom: '12px' }}>{catalogError}</div>
        )}

        <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--pragna-text)', marginBottom: '10px' }}>
          Models ({selected.length}/{MAX_MODELS})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {catalog.map((model) => {
            const active = selected.includes(model.key)
            const disabled = !active && selected.length >= MAX_MODELS
            return (
              <button
                key={model.key}
                type="button"
                disabled={disabled}
                onClick={() => toggleModel(model.key)}
                title={model.key}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: active ? '1px solid rgba(212,175,55,0.5)' : '1px solid var(--pragna-border)',
                  background: active ? 'linear-gradient(135deg, rgba(212,175,55,0.16), rgba(184,134,11,0.08))' : 'transparent',
                  color: active ? 'var(--pragna-gold-soft)' : 'var(--pragna-text-muted)',
                  fontSize: '12.5px',
                  fontWeight: active ? 650 : 500,
                  cursor: disabled ? 'default' : 'pointer',
                  opacity: disabled ? 0.45 : 1,
                }}
              >
                {model.display_name || model.key}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleCompare}
          disabled={!message.trim() || selected.length === 0 || running}
          style={{
            padding: '11px 22px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--pragna-gold-soft), var(--pragna-gold-deep))',
            color: 'var(--pragna-on-gold)',
            fontWeight: 650,
            fontSize: '14px',
            cursor: (!message.trim() || selected.length === 0 || running) ? 'default' : 'pointer',
            opacity: (!message.trim() || selected.length === 0 || running) ? 0.6 : 1,
          }}
        >
          {running ? 'Comparing…' : 'Compare'}
        </button>

        {error && (
          <div style={{ fontSize: '13px', color: '#e8a598', marginTop: '14px' }}>{error}</div>
        )}
      </div>

      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', maxWidth: '1200px' }}>
          {results.map((result) => (
            <div
              key={result.model}
              style={{
                borderRadius: '16px',
                padding: '18px',
                background: 'var(--pragna-surface)',
                border: result.error ? '1px solid rgba(220,110,100,0.35)' : '1px solid var(--pragna-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                minWidth: 0,
              }}
            >
              <div
                onClick={() => toggleCard(result.model)}
                title={collapsedCards.has(result.model) ? 'Expand' : 'Minimize'}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', cursor: 'pointer' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <ChevronDownIcon
                    size={13}
                    style={{
                      color: 'var(--pragna-text-muted)',
                      flexShrink: 0,
                      transform: collapsedCards.has(result.model) ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--pragna-gold-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {result.display_name || result.model}
                  </span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--pragna-text-muted)', flexShrink: 0 }}>
                  {result.elapsed_ms != null ? `${result.elapsed_ms}ms` : ''}
                </span>
              </div>
              {!collapsedCards.has(result.model) && (
                result.error ? (
                  <div style={{ fontSize: '13px', color: '#e8a598', lineHeight: 1.5 }}>{result.error}</div>
                ) : (
                  <div style={{ fontSize: '14px', color: result.response ? 'var(--pragna-text)' : 'var(--pragna-text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontStyle: result.response ? 'normal' : 'italic' }}>
                    {result.response || '(empty response)'}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

export default ComparePage
