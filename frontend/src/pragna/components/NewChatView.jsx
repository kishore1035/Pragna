import { useContext, useState, useRef, useEffect, useCallback } from 'react'
import { ChatContext } from '../../context/ChatContext'
import {
  generateAIImage,
  generateDocument,
  sendOrchestratedMessageStream,
  sendOrchestratedUploadMessage,
  sendOrchestratedMessage,
} from '../../api/api'
import { normalizeLanguageCode } from '../../utils/language'
import { useMediaQuery } from '../hooks/useMediaQuery'
import pragnaShield from '../../assets/pragna-shield-icon.png'
import {
  PaperclipIcon,
  MicIcon,
  MicOffIcon,
  SendIcon,
  ChevronDownIcon,
  BookOpenIcon,
  PenLineIcon,
  SearchIcon,
  LightbulbIcon,
  CodeIcon,
  CreateImageIcon,
  FileTextIcon,
  CloseIcon,
  CheckIcon,
  SparklesIcon,
  ThinkIcon,
} from './PragnaIcon'

const IMAGE_REQUEST_RE =
  /(create|generate|make|design)\s+(an?\s+)?(ai\s+)?image|image\s+of|illustration\s+of|poster\s+of|logo\s+of/i

const extractImagePrompt = (text) => {
  const raw = (text || '').trim()
  if (!raw) return ''
  return (
    raw
      .replace(
        /^(please\s+)?(create|generate|make|design)\s+(an?\s+)?(ai\s+)?(image|picture|photo|illustration)\s+(of|for)?\s*/i,
        ''
      )
      .trim() || raw
  )
}

const DOCUMENT_VERB_RE =
  /\b(create|generate|make|write|draft|build|export|give\s+me)\b.*\b(word(\s*(doc(ument)?|file))?|\bdocx\b|\bdoc(ument)?\b|report|excel(\s*(sheet|spreadsheet|file))?|spreadsheet|\bxlsx\b|\bpdf(\s*file)?\b|power\s*point(\s*(presentation|deck|file|slides?))?|presentation|slides?|\bpptx\b)\b/i

const DOCUMENT_FORMAT_PATTERNS = [
  { format: 'pptx', re: /power\s*point|presentation|slides?|\bpptx\b/i },
  { format: 'xlsx', re: /excel|spreadsheet|sheet|\bxlsx\b/i },
  { format: 'pdf', re: /\bpdf\b/i },
  { format: 'docx', re: /word(\s*(doc(ument)?|file))?|\bdoc(ument)?\b|\bdocx\b|report/i },
]

const extractDocumentRequest = (text) => {
  const raw = (text || '').trim()
  if (!raw || !DOCUMENT_VERB_RE.test(raw)) return null
  const match = DOCUMENT_FORMAT_PATTERNS.find((p) => p.re.test(raw))
  if (!match) return null
  const subject =
    raw
      .replace(
        /^(please\s+)?(create|generate|make|write|draft|build|export|give\s+me)\s+(me\s+)?(an?\s+)?(ms\s*)?((word(\s*(doc(ument)?|file))?|\bdocx\b|\bdoc(ument)?\b|excel(\s*(sheet|spreadsheet|file))?|spreadsheet|\bxlsx\b|pdf(\s*file)?|power\s*point(\s*(presentation|deck|file))?|presentation|slides?|\bpptx\b|report))\s*(about|on|for|regarding|with|containing|and|to|,)?\s*/i,
        ''
      )
      .trim() || raw
  return { format: match.format, subject }
}

const CHAT_MODES = [
  { id: 'general', label: 'General', icon: SparklesIcon },
  { id: 'explain_concepts', label: 'Explain', icon: BookOpenIcon },
  { id: 'write_content', label: 'Write', icon: PenLineIcon },
  { id: 'generate_ideas', label: 'Brainstorm', icon: LightbulbIcon },
  { id: 'code_assistance', label: 'Code', icon: CodeIcon },
  { id: 'ask_questions', label: 'Questions', icon: SearchIcon },
  { id: 'creative_writing', label: 'Story', icon: PenLineIcon },
]

const QUICK_ACTIONS = [
  {
    id: 'explain',
    label: 'Explain concepts',
    icon: BookOpenIcon,
    mode: 'explain_concepts',
    promptPrefix: 'Explain how ',
  },
  {
    id: 'write',
    label: 'Draft content',
    icon: PenLineIcon,
    mode: 'write_content',
    promptPrefix: 'Help me write ',
  },
  {
    id: 'research',
    label: 'Research topics',
    icon: SearchIcon,
    mode: 'general',
    promptPrefix: 'Research and analyze ',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm ideas',
    icon: LightbulbIcon,
    mode: 'generate_ideas',
    promptPrefix: 'Brainstorm ideas for ',
  },
  {
    id: 'code',
    label: 'Write code',
    icon: CodeIcon,
    mode: 'code_assistance',
    promptPrefix: 'Write code to ',
  },
  {
    id: 'create_image',
    label: 'Create image',
    icon: CreateImageIcon,
    mode: 'general',
    promptPrefix: 'Create an image of ',
  },
]

export default function NewChatView({ onNavigateToImages }) {
  const {
    chats,
    setChats,
    activeChatId,
    setActiveChatId,
    language,
    isLoading,
    setIsLoading,
    chatMode,
    setChatMode,
    personas,
    activePersonaId,
    extendedThinking,
    toggleExtendedThinking,
    openArtifact,
  } = useContext(ChatContext)

  const [inputVal, setInputVal] = useState('')
  const [attachments, setAttachments] = useState([])
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')

  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const modeDropdownRef = useRef(null)
  const recognitionRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const scrollHeight = el.scrollHeight
    const minHeight = 36
    const maxHeight = 160
    const targetHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
    el.style.height = `${targetHeight}px`
    el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [inputVal])

  // Close mode dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target)) {
        setModeDropdownOpen(false)
      }
    }
    if (modeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [modeDropdownOpen])

  // Speech recognition
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.')
      return
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
      return
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRec()
    recognitionRef.current = recognition
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = language || 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('')
      setInputVal(transcript)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
  }

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const newAttachments = files.map((file) => ({
      file,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }))

    setAttachments((prev) => [...prev, ...newAttachments])
    e.target.value = ''
    if (textareaRef.current) textareaRef.current.focus()
  }

  const removeAttachment = (index) => {
    setAttachments((prev) => {
      const updated = [...prev]
      if (updated[index]?.previewUrl) {
        URL.revokeObjectURL(updated[index].previewUrl)
      }
      updated.splice(index, 1)
      return updated
    })
  }

  // Main submission handler
  const handleSubmit = useCallback(
    async (overrideText, overrideAttachments) => {
      const promptText = (overrideText !== undefined ? overrideText : inputVal).trim()
      const promptAttachments = overrideAttachments !== undefined ? overrideAttachments : attachments

      if ((!promptText && promptAttachments.length === 0) || isLoading) return

      let targetChatId = activeChatId
      let currentChat = chats.find((c) => c.id === activeChatId)

      if (!targetChatId || !currentChat) {
        const newId = Date.now().toString()
        const newChatObj = {
          id: newId,
          title: 'New chat',
          messages: [],
        }
        setChats((prev) => [newChatObj, ...prev])
        setActiveChatId(newId)
        targetChatId = newId
        currentChat = newChatObj
      }

      const attachmentMeta = promptAttachments.map((a) => ({
        name: a.name,
        type: a.type,
        previewUrl: a.previewUrl,
      }))

      const updatedMessages = [
        ...currentChat.messages,
        { sender: 'user', text: promptText, attachments: attachmentMeta },
      ]
      const botMsg = { sender: 'bot', text: '', isStreaming: true }

      setChats((prev) =>
        prev.map((c) => (c.id === targetChatId ? { ...c, messages: [...updatedMessages, botMsg] } : c))
      )

      setInputVal('')
      setAttachments([])
      setIsLoading(true)

      const normalizedLanguage = normalizeLanguageCode(language)

      try {
        const docRequest = promptAttachments.length === 0 ? extractDocumentRequest(promptText) : null
        if (docRequest) {
          const docResult = await generateDocument({
            format: docRequest.format,
            prompt: docRequest.subject,
            language: normalizedLanguage,
          })

          setIsLoading(false)
          openArtifact?.({
            id: `doc-${Date.now()}`,
            title: docResult.filename || `${docRequest.subject}.${docRequest.format}`,
            type: docRequest.format === 'pdf' ? 'pdf' : 'document',
            format: docRequest.format,
            downloadUrl: docResult.download_url,
            content: `# ${docResult.filename || 'Generated Document'}\n\nDocument ready for preview and download.\n- Format: ${docRequest.format?.toUpperCase()}\n- File: ${docResult.filename}\n- Status: Ready`,
          })
          setChats((prev) =>
            prev.map((c) =>
              c.id === targetChatId
                ? {
                    ...c,
                    messages: c.messages.map((m, idx) =>
                      idx === c.messages.length - 1
                        ? {
                            ...m,
                            text: 'Generated document ready.',
                            isStreaming: false,
                            attachments: [
                              {
                                name: docResult.filename,
                                type: 'document',
                                downloadUrl: docResult.download_url,
                                format: docRequest.format,
                              },
                            ],
                          }
                        : m
                    ),
                  }
                : c
            )
          )
          return
        }

        const isImageRequest = IMAGE_REQUEST_RE.test(promptText) && promptAttachments.length === 0
        if (isImageRequest) {
          const imagePrompt = extractImagePrompt(promptText)
          const imageResult = await generateAIImage({
            prompt: imagePrompt,
            style: 'cinematic',
            quality: 'hd',
            size: '1024x1024',
          })

          setIsLoading(false)
          setChats((prev) =>
            prev.map((c) =>
              c.id === targetChatId
                ? {
                    ...c,
                    messages: c.messages.map((m, idx) =>
                      idx === c.messages.length - 1
                        ? {
                            ...m,
                            text: `Generated image for "${imagePrompt}":`,
                            isStreaming: false,
                            attachments: [
                              {
                                name: `${imagePrompt.slice(0, 24)}.png`,
                                type: 'image',
                                previewUrl: imageResult?.image_url || imageResult?.url,
                              },
                            ],
                          }
                        : m
                    ),
                  }
                : c
            )
          )
          return
        }

        const activePersona = personas?.find((p) => p.id === activePersonaId)
        const systemPrompt = activePersona?.systemPrompt || ''

        if (promptAttachments.length > 0) {
          const res = await sendOrchestratedUploadMessage({
            files: promptAttachments.map((a) => a.file).filter(Boolean),
            message: promptText,
            language: normalizedLanguage,
            chatMode,
            systemPrompt,
          })

          setIsLoading(false)
          setChats((prev) =>
            prev.map((c) =>
              c.id === targetChatId
                ? {
                    ...c,
                    messages: c.messages.map((m, idx) =>
                      idx === c.messages.length - 1
                        ? {
                            ...m,
                            text: res.reply || res.text || 'Response received.',
                            isStreaming: false,
                            sources: res.sources || [],
                          }
                        : m
                    ),
                  }
                : c
            )
          )
          return
        }

        let accumulatedText = ''
        let streamSources = []
        let streamThinking = ''

        await sendOrchestratedMessageStream(
          {
            message: promptText,
            language: normalizedLanguage,
            chatMode,
            systemPrompt,
            extendedThinking,
          },
          (chunk) => {
            if (chunk.type === 'token') {
              accumulatedText += chunk.token || ''
              setChats((prev) =>
                prev.map((c) =>
                  c.id === targetChatId
                    ? {
                        ...c,
                        messages: c.messages.map((m, idx) =>
                          idx === c.messages.length - 1
                            ? {
                                ...m,
                                text: accumulatedText,
                                thinking: streamThinking,
                                isStreaming: true,
                              }
                            : m
                        ),
                      }
                    : c
                )
              )
            } else if (chunk.type === 'thinking') {
              streamThinking += chunk.token || ''
              setChats((prev) =>
                prev.map((c) =>
                  c.id === targetChatId
                    ? {
                        ...c,
                        messages: c.messages.map((m, idx) =>
                          idx === c.messages.length - 1
                            ? {
                                ...m,
                                text: accumulatedText,
                                thinking: streamThinking,
                                isStreaming: true,
                              }
                            : m
                        ),
                      }
                    : c
                )
              )
            } else if (chunk.type === 'sources') {
              streamSources = chunk.sources || []
            } else if (chunk.type === 'artifact') {
              openArtifact?.(chunk.artifact || chunk)
            } else if (chunk.type === 'done') {
              setIsLoading(false)

              // Auto-detect artifacts if present in markdown output
              const antMatch = accumulatedText.match(/<(?:antArtifact|artifact)\s+([^>]*?)>([\s\S]*?)<\/(?:antArtifact|artifact)>/i)
              if (antMatch) {
                const attrs = antMatch[1]
                const content = antMatch[2]
                const titleMatch = attrs.match(/title=["']([^"']+)["']/i)
                const typeMatch = attrs.match(/type=["']([^"']+)["']/i)
                const langMatch = attrs.match(/language=["']([^"']+)["']/i)
                const title = titleMatch ? titleMatch[1] : 'Interactive Artifact'
                const type = typeMatch ? typeMatch[1] : (langMatch ? langMatch[1] : 'html')
                openArtifact?.({ title, type, content: content.trim() })
              }

              setChats((prev) =>
                prev.map((c) =>
                  c.id === targetChatId
                    ? {
                        ...c,
                        messages: c.messages.map((m, idx) =>
                          idx === c.messages.length - 1
                            ? {
                                ...m,
                                text: accumulatedText,
                                thinking: streamThinking,
                                sources: streamSources,
                                isStreaming: false,
                              }
                            : m
                        ),
                      }
                    : c
                )
              )
            }
          }
        )
      } catch (err) {
        console.error('Error submitting prompt in NewChatView:', err)
        setIsLoading(false)
        setChats((prev) =>
          prev.map((c) =>
            c.id === targetChatId
              ? {
                  ...c,
                  messages: c.messages.map((m, idx) =>
                    idx === c.messages.length - 1
                      ? {
                          ...m,
                          text: 'Server error. Please try again.',
                          isStreaming: false,
                          error: true,
                        }
                      : m
                  ),
                }
              : c
          )
        )
      }
    },
    [
      inputVal,
      attachments,
      isLoading,
      activeChatId,
      chats,
      setChats,
      setActiveChatId,
      setIsLoading,
      language,
      chatMode,
      personas,
      activePersonaId,
      extendedThinking,
    ]
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleQuickAction = (action) => {
    if (action.mode && action.mode !== chatMode) {
      setChatMode(action.mode)
    }

    if (action.id === 'create_image' && onNavigateToImages) {
      setInputVal(action.promptPrefix)
      if (textareaRef.current) {
        textareaRef.current.focus()
        setTimeout(() => {
          textareaRef.current?.setSelectionRange(
            action.promptPrefix.length,
            action.promptPrefix.length
          )
        }, 10)
      }
      return
    }

    setInputVal(action.promptPrefix)
    if (textareaRef.current) {
      textareaRef.current.focus()
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(
          action.promptPrefix.length,
          action.promptPrefix.length
        )
      }, 10)
    }
  }

  const currentModeObj = CHAT_MODES.find((m) => m.id === chatMode) || CHAT_MODES[0]
  const CurrentModeIcon = currentModeObj.icon
  const hasContent = inputVal.trim().length > 0 || attachments.length > 0

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'var(--pragna-bg, #09090b)',
        overflowY: 'auto',
        overflowX: 'hidden',
        fontFamily: 'var(--font-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif)',
      }}
      className="custom-scrollbar"
    >
      {/* Subtle Apple Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '340px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(212, 175, 55, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Center Content Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '24px 16px' : '40px 24px',
          zIndex: 1,
          width: '100%',
          maxWidth: '820px',
          margin: '0 auto',
          boxSizing: 'border-box',
          animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Minimal Shield Logo Mark */}
        <div
          style={{
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={pragnaShield}
            alt="Pragna"
            style={{
              width: isMobile ? '42px' : '48px',
              height: isMobile ? '42px' : '48px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 14px rgba(212, 175, 55, 0.25))',
            }}
          />
        </div>

        {/* Clean Apple Heading */}
        <h1
          style={{
            margin: '0 0 8px 0',
            fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px',
            fontWeight: 650,
            color: 'var(--pragna-text, #f5f5f7)',
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          How can I help you today?
        </h1>

        {/* Quiet Subtitle */}
        <p
          style={{
            margin: '0 0 28px 0',
            fontSize: isMobile ? '13px' : '14px',
            color: 'var(--pragna-text-muted, #8e8e93)',
            textAlign: 'center',
            maxWidth: '480px',
            lineHeight: 1.4,
          }}
        >
          Search, brainstorm, write, or analyze.
        </p>

        {/* Apple Frosted Composer Capsule */}
        <div
          style={{
            width: '100%',
            maxWidth: '740px',
            background: 'rgba(18, 18, 22, 0.88)',
            border: isFocused
              ? '1px solid rgba(212, 175, 55, 0.55)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            boxShadow: isFocused
              ? '0 0 0 1.5px rgba(212, 175, 55, 0.2), 0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 4px 24px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            transition: 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
            padding: isMobile ? '6px 10px 6px 14px' : '8px 12px 8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '6px' : '10px',
            position: 'relative',
            marginBottom: '20px',
            boxSizing: 'border-box',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".docx,.xlsx,.pdf,.pptx,.txt,.md,.csv,.json,image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file or image"
            style={{
              padding: '6px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: attachments.length > 0 ? 'var(--pragna-gold)' : 'var(--pragna-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.12s ease',
            }}
          >
            <PaperclipIcon size={18} strokeWidth={1.8} />
          </button>

          {/* Attachment Chips */}
          {attachments.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'rgba(212, 175, 55, 0.14)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                fontSize: '11px',
                color: '#ffffff',
                maxWidth: '120px',
                flexShrink: 0,
              }}
            >
              <FileTextIcon size={11} className="text-[var(--pragna-gold-soft)] flex-shrink-0" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {attachments.length} file{attachments.length > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => setAttachments([])}
                style={{ background: 'transparent', border: 'none', color: 'var(--pragna-text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <CloseIcon size={10} />
              </button>
            </div>
          )}

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask Pragna anything..."
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--pragna-text, #f5f5f7)',
              caretColor: 'var(--pragna-gold, #d4af37)',
              fontSize: isMobile ? '13.5px' : '14.5px',
              fontFamily: 'inherit',
              lineHeight: '22px',
              resize: 'none',
              padding: '6px 4px',
              minHeight: '34px',
              height: '34px',
              margin: 0,
              boxSizing: 'border-box',
              maxHeight: '120px',
            }}
          />

          {/* Right Action Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '6px', flexShrink: 0 }}>
            {/* Mode selector */}
            <div style={{ position: 'relative' }} ref={modeDropdownRef}>
              <button
                type="button"
                onClick={() => setModeDropdownOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 9px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  color: 'var(--pragna-text-muted, #8e8e93)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
              >
                <span>{currentModeObj.label}</span>
                <ChevronDownIcon
                  size={11}
                  style={{
                    transform: modeDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                    opacity: 0.7,
                  }}
                />
              </button>

              {/* Mode Dropdown Popover */}
              {modeDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: '0',
                    zIndex: 40,
                    width: '160px',
                    borderRadius: '12px',
                    background: 'rgba(20, 20, 24, 0.96)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(20px)',
                    padding: '5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    animation: 'fadeUp 0.14s ease',
                  }}
                >
                  {CHAT_MODES.map((mode) => {
                    const active = chatMode === mode.id
                    const ModeIcon = mode.icon
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setChatMode(mode.id)
                          setModeDropdownOpen(false)
                          if (textareaRef.current) textareaRef.current.focus()
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          padding: '6px 9px',
                          borderRadius: '7px',
                          border: 'none',
                          background: active ? 'rgba(212, 175, 55, 0.14)' : 'transparent',
                          color: active ? 'var(--pragna-gold)' : 'var(--pragna-text)',
                          fontSize: '12px',
                          fontWeight: active ? 600 : 400,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <ModeIcon size={12} />
                          <span>{mode.label}</span>
                        </div>
                        {active && <CheckIcon size={11} className="text-[var(--pragna-gold)]" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Extended Thinking Toggle */}
            <button
              type="button"
              onClick={toggleExtendedThinking}
              title={extendedThinking ? "Extended Thinking enabled" : "Enable Extended Thinking"}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '5px 7px',
                borderRadius: '999px',
                background: extendedThinking ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                border: extendedThinking ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid transparent',
                color: extendedThinking ? 'var(--pragna-gold)' : 'var(--pragna-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              <ThinkIcon size={14} />
            </button>

            {/* Mic / Voice Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isRecording ? 'Stop recording' : 'Voice input'}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: isRecording ? '1px solid rgba(239, 68, 68, 0.6)' : 'none',
                background: isRecording ? 'rgba(239, 68, 68, 0.16)' : 'transparent',
                color: isRecording ? '#ef4444' : 'var(--pragna-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              {isRecording ? <MicOffIcon size={15} /> : <MicIcon size={15} />}
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!hasContent || isLoading}
              title="Send message"
              style={{
                width: isMobile ? '34px' : '36px',
                height: isMobile ? '34px' : '36px',
                borderRadius: '50%',
                border: 'none',
                background: hasContent
                  ? 'var(--pragna-gold, #d4af37)'
                  : 'rgba(255, 255, 255, 0.08)',
                color: hasContent ? '#0a0800' : 'var(--pragna-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: hasContent && !isLoading ? 'pointer' : 'default',
                opacity: hasContent && !isLoading ? 1 : 0.5,
                boxShadow: hasContent ? '0 2px 10px rgba(212, 175, 55, 0.35)' : 'none',
                transition: 'all 0.14s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <SendIcon size={15} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Apple Quick Action Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '6px' : '8px',
            width: '100%',
            maxWidth: '740px',
          }}
        >
          {QUICK_ACTIONS.map((action) => {
            const IconComponent = action.icon
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleQuickAction(action)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '6px 12px' : '7px 14px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--pragna-text-muted, #8e8e93)',
                  fontSize: isMobile ? '12px' : '12.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.14s cubic-bezier(0.16, 1, 0.3, 1)',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                  e.currentTarget.style.color = 'var(--pragna-text, #f5f5f7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'var(--pragna-text-muted, #8e8e93)';
                }}
              >
                <IconComponent size={13} style={{ opacity: 0.8 }} />
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
