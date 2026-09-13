import React from 'react'

/**
 * Standardized Pragna Icon System
 * 
 * Design Characteristics:
 * - Minimal, outline-based (1.8px consistent stroke)
 * - Geometric, clean, subtle futuristic feel
 * - Follows Pragna black + gold visual language
 * - Fully accessible and responsive with customizable size/color/strokeWidth
 */

const baseSvg = (d, { size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style = {}, extra, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
    {...props}
  >
    {Array.isArray(d) ? d.map((pathStr, i) => <path key={i} d={pathStr} />) : d ? <path d={d} /> : null}
    {extra}
  </svg>
)

// ── Navigation Icons ──────────────────────────────────────────────────────────

export const PlusIcon = (props) =>
  baseSvg('M12 5v14M5 12h14', props)

export const NewChatIcon = (props) =>
  baseSvg('M12 5v14M5 12h14', props)

export const ChatsIcon = (props) =>
  baseSvg('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', props)

export const ModesIcon = (props) =>
  baseSvg(
    'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    props
  )

export const ImagesIcon = (props) =>
  baseSvg(
    'M21 15l-5-5L5 21',
    {
      ...props,
      extra: (
        <>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
        </>
      ),
    }
  )

export const GptsIcon = (props) =>
  baseSvg(
    null,
    {
      ...props,
      extra: (
        <>
          <circle cx="12" cy="7.5" r="3.2" />
          <circle cx="12" cy="16.5" r="3.2" />
          <circle cx="7.5" cy="12" r="3.2" />
          <circle cx="16.5" cy="12" r="3.2" />
        </>
      ),
    }
  )

export const StarredIcon = ({ filled = false, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 18}
    height={props.size || 18}
    viewBox="0 0 24 24"
    fill={filled ? (props.color || 'currentColor') : 'none'}
    stroke={props.color || 'currentColor'}
    strokeWidth={props.strokeWidth || 1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className || ''}
    style={{ flexShrink: 0, ...(props.style || {}) }}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

export const SearchIcon = (props) =>
  baseSvg(
    'M21 21l-4.35-4.35',
    {
      ...props,
      extra: <circle cx="11" cy="11" r="7" />,
    }
  )

export const SettingsIcon = (props) =>
  baseSvg(
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
    {
      ...props,
      extra: <circle cx="12" cy="12" r="3" />,
    }
  )

export const UserIcon = (props) =>
  baseSvg(
    'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
    {
      ...props,
      extra: <circle cx="12" cy="7" r="4" />,
    }
  )

export const LogoutIcon = (props) =>
  baseSvg(
    ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
    props
  )

export const PanelCollapseIcon = (props) =>
  baseSvg(
    ['M9 3v18', 'M14 9l3 3-3 3'],
    {
      ...props,
      extra: <rect width="18" height="18" x="3" y="3" rx="2" />,
    }
  )

export const PanelExpandIcon = (props) =>
  baseSvg(
    ['M9 3v18', 'M16 15l-3-3 3-3'],
    {
      ...props,
      extra: <rect width="18" height="18" x="3" y="3" rx="2" />,
    }
  )

export const MenuIcon = (props) =>
  baseSvg('M4 12h16M4 6h16M4 18h16', props)

export const CompassIcon = (props) =>
  baseSvg(
    'M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
    {
      ...props,
      extra: <circle cx="12" cy="12" r="10" />,
    }
  )

export const CompareIcon = (props) =>
  baseSvg(
    null,
    {
      ...props,
      extra: (
        <>
          <rect x="3" y="4" width="8" height="16" rx="1.5" />
          <rect x="13" y="4" width="8" height="16" rx="1.5" />
        </>
      ),
    }
  )

// ── Chat & Prompt Action Icons ────────────────────────────────────────────────

export const PaperclipIcon = (props) =>
  baseSvg('M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48', props)

export const MicIcon = (props) =>
  baseSvg(
    ['M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M12 19v3', 'M8 22h8'],
    props
  )

export const MicOffIcon = (props) =>
  baseSvg(
    ['M1 1l22 22', 'M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.68-1.33', 'M19 10v2a7 7 0 0 1-1.39 4.19', 'M12 19v3', 'M8 22h8'],
    props
  )

export const HeadphoneIcon = (props) =>
  baseSvg(
    'M3 18v-6a9 9 0 0 1 18 0v6',
    {
      ...props,
      extra: (
        <>
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </>
      ),
    }
  )

export const SoundwaveIcon = (props) =>
  baseSvg(
    ['M12 2v20', 'M17 5v14', 'M7 5v14', 'M2 9v6', 'M22 9v6'],
    props
  )

export const SendIcon = (props) =>
  baseSvg(
    ['M22 2L11 13', 'M22 2l-7 20-4-9-9-4 20-7z'],
    props
  )

export const StopIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 18}
    height={props.size || 18}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className || ''}
    style={{ flexShrink: 0, ...(props.style || {}) }}
  >
    <rect x="5" y="5" width="14" height="14" rx="2.5" />
  </svg>
)

export const ThinkIcon = (props) =>
  baseSvg(
    ['M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z', 'M9 21h6'],
    props
  )

export const CopyIcon = (props) =>
  baseSvg(
    'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
    {
      ...props,
      extra: <rect x="8" y="8" width="13" height="13" rx="2" ry="2" />,
    }
  )

export const CheckIcon = (props) =>
  baseSvg('M20 6L9 17l-5-5', props)

export const EditIcon = (props) =>
  baseSvg(
    [
      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7',
      'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    ],
    props
  )

export const PencilIcon = (props) =>
  baseSvg(
    [
      'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
      'M15 5l4 4',
    ],
    props
  )

export const TrashIcon = (props) =>
  baseSvg(
    ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M10 11v6', 'M14 11v6'],
    props
  )

export const RetryIcon = (props) =>
  baseSvg(
    ['M23 4v6h-6', 'M20.49 15a9 9 0 1 1-2.12-9.36L23 10'],
    props
  )

export const MaximizeIcon = (props) =>
  baseSvg(
    [
      'M15 3h6v6',
      'M9 21H3v-6',
      'M21 3l-7 7',
      'M3 21l7-7',
    ],
    props
  )

export const MinimizeIcon = (props) =>
  baseSvg(
    [
      'M4 14h6v6',
      'M20 10h-6V4',
      'M14 10l7-7',
      'M3 21l7-7',
    ],
    props
  )

export const PdfIcon = (props) =>
  baseSvg(
    [
      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
      'M14 2v6h6',
      'M9 15h6',
      'M9 11h6',
    ],
    props
  )

export const ThumbsUpIcon = ({ filled = false, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 18}
    height={props.size || 18}
    viewBox="0 0 24 24"
    fill={filled ? (props.color || 'currentColor') : 'none'}
    stroke={props.color || 'currentColor'}
    strokeWidth={props.strokeWidth || 1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className || ''}
    style={{ flexShrink: 0, ...(props.style || {}) }}
  >
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
)

export const ThumbsDownIcon = ({ filled = false, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 18}
    height={props.size || 18}
    viewBox="0 0 24 24"
    fill={filled ? (props.color || 'currentColor') : 'none'}
    stroke={props.color || 'currentColor'}
    strokeWidth={props.strokeWidth || 1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className || ''}
    style={{ flexShrink: 0, ...(props.style || {}) }}
  >
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
)

export const SpeakIcon = (props) =>
  baseSvg(
    ['M11 5L6 9H2v6h4l5 4V5z', 'M15.54 8.46a5 5 0 0 1 0 7.07', 'M19.07 4.93a10 10 0 0 1 0 14.14'],
    props
  )

export const ShareIcon = (props) =>
  baseSvg(
    ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13'],
    props
  )

export const PinIcon = (props) =>
  baseSvg(
    ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'],
    {
      ...props,
      extra: <circle cx="12" cy="10" r="3" />,
    }
  )

export const ArchiveIcon = (props) =>
  baseSvg(
    ['M21 8v13H3V8', 'M1 3h22v5H1z', 'M10 12h4'],
    props
  )

export const PrinterIcon = (props) =>
  baseSvg(
    ['M6 9V2h12v7', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 14h12v8H6z'],
    props
  )

export const MoreVerticalIcon = (props) =>
  baseSvg(
    null,
    {
      ...props,
      extra: (
        <>
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </>
      ),
    }
  )

export const MoreHorizontalIcon = (props) =>
  baseSvg(
    null,
    {
      ...props,
      extra: (
        <>
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </>
      ),
    }
  )

export const CloseIcon = (props) =>
  baseSvg('M18 6L6 18M6 6l12 12', props)

export const XIcon = CloseIcon

export const ChevronDownIcon = (props) =>
  baseSvg('M6 9l6 6 6-6', props)

export const ChevronUpIcon = (props) =>
  baseSvg('M18 15l-6-6-6 6', props)

export const ChevronRightIcon = (props) =>
  baseSvg('M9 18l6-6-6-6', props)

export const ChevronLeftIcon = (props) =>
  baseSvg('M15 18l-6-6 6-6', props)

export const ExternalLinkIcon = (props) =>
  baseSvg(
    ['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6', 'M10 14L21 3'],
    props
  )

export const RefreshCwIcon = (props) =>
  baseSvg(
    ['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
    props
  )

// ── Mode & Quick Action Icons ─────────────────────────────────────────────────

export const SparklesIcon = (props) =>
  baseSvg('M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z', props)

export const BookOpenIcon = (props) =>
  baseSvg(
    ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
    props
  )

export const PenLineIcon = (props) =>
  baseSvg(
    ['M12 20h9', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'],
    props
  )

export const LightbulbIcon = (props) =>
  baseSvg(
    ['M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5', 'M9 18h6', 'M10 22h4'],
    props
  )

export const CodeIcon = (props) =>
  baseSvg(
    ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
    props
  )

export const CreateImageIcon = (props) =>
  baseSvg(
    'M21 15l-5-5L5 21',
    {
      ...props,
      extra: (
        <>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M19 2v4M17 4h4" />
        </>
      ),
    }
  )

export const QuestionsIcon = (props) =>
  baseSvg(
    ['M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4', 'M12 17.5v.1'],
    {
      ...props,
      extra: <circle cx="12" cy="12" r="10" />,
    }
  )

export const StoryIcon = (props) =>
  baseSvg(
    ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
    props
  )

export const BrainIcon = ThinkIcon

export const ZapIcon = (props) =>
  baseSvg('M13 2L3 14h9l-1 8 10-12h-9l1-8z', props)

export const PlayIcon = (props) =>
  baseSvg(null, {
    ...props,
    extra: <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />,
  })

export const BotIcon = (props) =>
  baseSvg(
    ['M12 2v4', 'M2 14h2', 'M20 14h2'],
    {
      ...props,
      extra: (
        <>
          <rect width="16" height="12" x="4" y="6" rx="2" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
        </>
      ),
    }
  )

export const WrenchIcon = (props) =>
  baseSvg('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', props)

export const HammerIcon = (props) =>
  baseSvg(
    ['M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9', 'M17.64 15L22 10.64l-5.64-5.64L12 9.36 17.64 15z'],
    props
  )

export const BugIcon = (props) =>
  baseSvg(
    [
      'M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 1 1 6 0v1',
      'M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z',
      'M12 20v-9M6 13H2M22 13h-4M6 17H3M21 17h-3M6 9H3M21 9h-3',
    ],
    props
  )

export const AlertTriangleIcon = (props) =>
  baseSvg(
    ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
    props
  )

export const CheckCircleIcon = (props) =>
  baseSvg(
    ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'M22 4L12 14.01l-3-3'],
    props
  )

export const XCircleIcon = (props) =>
  baseSvg(
    ['M15 9l-6 6M9 9l6 6'],
    {
      ...props,
      extra: <circle cx="12" cy="12" r="10" />,
    }
  )

// ── Files & Documents ─────────────────────────────────────────────────────────

export const FolderIcon = (props) =>
  baseSvg('M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z', props)

export const FolderPlusIcon = (props) =>
  baseSvg(
    ['M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z', 'M12 11v6', 'M9 14h6'],
    props
  )

export const FileTextIcon = (props) =>
  baseSvg(
    ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
    props
  )

export const DocumentIcon = FileTextIcon

export const DownloadIcon = (props) =>
  baseSvg(
    ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
    props
  )

export const UploadIcon = (props) =>
  baseSvg(
    ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
    props
  )

export const VideoIcon = (props) =>
  baseSvg(
    'M23 7l-7 5 7 5V7z',
    {
      ...props,
      extra: <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />,
    }
  )

// ── Auth, Settings & Status ───────────────────────────────────────────────────

export const MailIcon = (props) =>
  baseSvg(
    'M22 6l-10 7L2 6',
    {
      ...props,
      extra: <rect width="20" height="16" x="2" y="4" rx="2" />,
    }
  )

export const LockIcon = (props) =>
  baseSvg(
    'M7 11V7a5 5 0 0 1 10 0v4',
    {
      ...props,
      extra: <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />,
    }
  )

export const EyeIcon = (props) =>
  baseSvg(
    'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z',
    {
      ...props,
      extra: <circle cx="12" cy="12" r="3" />,
    }
  )

export const EyeOffIcon = (props) =>
  baseSvg(
    ['M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24', 'M1 1l22 22'],
    props
  )

export const ShieldIcon = (props) =>
  baseSvg('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', props)

export const GlobeIcon = (props) =>
  baseSvg(
    ['M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
    {
      ...props,
      extra: <circle cx="12" cy="12" r="10" />,
    }
  )

export const SunIcon = (props) =>
  baseSvg(
    ['M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'],
    {
      ...props,
      extra: <circle cx="12" cy="12" r="5" />,
    }
  )

export const MoonIcon = (props) =>
  baseSvg('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z', props)

export const BellIcon = (props) =>
  baseSvg(
    ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
    props
  )

export const ErrorIcon = (props) =>
  baseSvg(
    ['M12 8v4', 'M12 16h.01'],
    {
      ...props,
      extra: <circle cx="12" cy="12" r="10" />,
    }
  )

export const HelpIcon = (props) =>
  baseSvg(
    ['M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4', 'M12 17h.01'],
    {
      ...props,
      extra: <circle cx="12" cy="12" r="10" />,
    }
  )

export const InfoIcon = (props) =>
  baseSvg(
    ['M12 16v-4', 'M12 8h.01'],
    {
      ...props,
      extra: <circle cx="12" cy="12" r="10" />,
    }
  )

export const GoogleIcon = ({ size = 18, color = 'currentColor', className = '', style = {}, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ flexShrink: 0, ...style }}
    {...props}
  >
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
)

export const GithubIcon = ({ size = 18, color = 'currentColor', className = '', style = {}, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ flexShrink: 0, ...style }}
    {...props}
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)

// ── Universal Icon Component ──────────────────────────────────────────────────

const ICON_MAP = {
  // Navigation
  plus: PlusIcon,
  'new-chat': NewChatIcon,
  chats: ChatsIcon,
  chat: ChatsIcon,
  modes: ModesIcon,
  images: ImagesIcon,
  image: ImagesIcon,
  gpts: GptsIcon,
  starred: StarredIcon,
  star: StarredIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  gear: SettingsIcon,
  user: UserIcon,
  profile: UserIcon,
  logout: LogoutIcon,
  'panel-left': PanelCollapseIcon,
  'panel-close': PanelCollapseIcon,
  'panel-open': PanelExpandIcon,
  menu: MenuIcon,
  explore: CompassIcon,
  compare: CompareIcon,

  // Prompt / Chat actions
  paperclip: PaperclipIcon,
  attach: PaperclipIcon,
  mic: MicIcon,
  'mic-off': MicOffIcon,
  send: SendIcon,
  stop: StopIcon,
  think: ThinkIcon,
  copy: CopyIcon,
  check: CheckIcon,
  edit: EditIcon,
  pencil: PencilIcon,
  trash: TrashIcon,
  delete: TrashIcon,
  retry: RetryIcon,
  'thumbs-up': ThumbsUpIcon,
  'thumbs-down': ThumbsDownIcon,
  speak: SpeakIcon,
  voice: SpeakIcon,
  share: ShareIcon,
  pin: PinIcon,
  archive: ArchiveIcon,
  printer: PrinterIcon,
  'more-vertical': MoreVerticalIcon,
  'more-horizontal': MoreHorizontalIcon,
  close: CloseIcon,
  x: CloseIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-left': ChevronLeftIcon,
  'external-link': ExternalLinkIcon,
  maximize: MaximizeIcon,
  minimize: MinimizeIcon,
  pdf: PdfIcon,
  refresh: RefreshCwIcon,

  // Modes & Tools
  sparkles: SparklesIcon,
  explain: BookOpenIcon,
  'book-open': BookOpenIcon,
  write: PenLineIcon,
  'pen-line': PenLineIcon,
  research: SearchIcon,
  brainstorm: LightbulbIcon,
  lightbulb: LightbulbIcon,
  code: CodeIcon,
  'create-image': CreateImageIcon,
  questions: QuestionsIcon,
  story: StoryIcon,
  zap: ZapIcon,
  play: PlayIcon,
  bot: BotIcon,
  wrench: WrenchIcon,
  hammer: HammerIcon,
  bug: BugIcon,
  'alert-triangle': AlertTriangleIcon,
  'check-circle': CheckCircleIcon,
  'x-circle': XCircleIcon,

  // Documents / Files
  folder: FolderIcon,
  'folder-plus': FolderPlusIcon,
  file: FileTextIcon,
  document: FileTextIcon,
  download: DownloadIcon,
  upload: UploadIcon,
  video: VideoIcon,

  // Auth / Settings
  mail: MailIcon,
  email: MailIcon,
  lock: LockIcon,
  password: LockIcon,
  eye: EyeIcon,
  'eye-off': EyeOffIcon,
  shield: ShieldIcon,
  security: ShieldIcon,
  globe: GlobeIcon,
  language: GlobeIcon,
  sun: SunIcon,
  moon: MoonIcon,
  bell: BellIcon,
  notifications: BellIcon,
  error: ErrorIcon,
  help: HelpIcon,
  info: InfoIcon,
  google: GoogleIcon,
  github: GithubIcon,
}

export default function PragnaIcon({ name, ...props }) {
  const IconComponent = ICON_MAP[name?.toLowerCase()]
  if (!IconComponent) {
    console.warn(`[PragnaIcon] Unknown icon name: "${name}"`)
    return null
  }
  return <IconComponent {...props} />
}
