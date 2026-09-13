import { useMediaQuery } from '../hooks/useMediaQuery'
import {
  SparklesIcon,
  BookOpenIcon,
  LightbulbIcon,
  PenLineIcon,
  CodeIcon,
  SearchIcon,
  StoryIcon,
} from '../components/PragnaIcon'

const CHAT_MODE_ITEMS = [
  { id: 'general', label: 'General', description: 'Standard helpful assistant', icon: SparklesIcon },
  { id: 'explain_concepts', label: 'Explain', description: 'Break down complex ideas', icon: BookOpenIcon },
  { id: 'generate_ideas', label: 'Ideas', description: 'Creative brainstorming', icon: LightbulbIcon },
  { id: 'write_content', label: 'Write', description: 'Professional writing & drafting', icon: PenLineIcon },
  { id: 'code_assistance', label: 'Code', description: 'Programming, debugging & review', icon: CodeIcon },
  { id: 'ask_questions', label: 'Questions', description: 'Deep analytical inquiry', icon: SearchIcon },
  { id: 'creative_writing', label: 'Story', description: 'Storytelling and creative narrative', icon: StoryIcon },
]

const GptModesPage = ({ chatMode, onSelectMode }) => {
  const isMobile = useMediaQuery('(max-width: 640px)')

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '24px 16px 36px 16px' : '40px 48px 48px 48px',
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
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 700, color: 'var(--pragna-text)' }}>
          Pragna Modes
        </h1>
        <p style={{ margin: '0 0 32px 0', fontSize: '14.5px', color: 'var(--pragna-text-muted)' }}>
          Choose a specialized behavior profile for your assistant.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 280px))',
            gap: '18px',
            maxWidth: '960px',
          }}
        >
          {CHAT_MODE_ITEMS.map((mode) => {
            const active = chatMode === mode.id
            const Icon = mode.icon

            return (
              <button
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                style={{
                  padding: '24px',
                  borderRadius: '18px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: active
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.16), rgba(18,16,12,0.95))'
                    : 'rgba(18, 16, 12, 0.75)',
                  border: active
                    ? '1.5px solid rgba(212,175,55,0.55)'
                    : '1px solid rgba(212,175,55,0.18)',
                  boxShadow: active
                    ? '0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.15)'
                    : '0 4px 14px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
                className="hover:border-accent-500/60 hover:shadow-[0_0_16px_rgba(212,175,55,0.2)] hover:-translate-y-0.5"
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: active ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--pragna-gold-soft)',
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '16.5px',
                      fontWeight: 700,
                      color: active ? 'var(--pragna-gold-soft)' : 'var(--pragna-text)',
                      marginBottom: '4px',
                    }}
                  >
                    {mode.label}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--pragna-text-muted)', lineHeight: 1.45 }}>
                    {mode.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GptModesPage
