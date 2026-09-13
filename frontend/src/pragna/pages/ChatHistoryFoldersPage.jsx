import HistoryLayout from '../components/chat-history-folders/HistoryLayout'

export default function ChatHistoryFoldersPage({ onSelectChat }) {
  return (
    <div className="flex-1 h-full w-full overflow-hidden flex flex-col bg-[var(--pragna-surface)]">
      <HistoryLayout onSelectChat={onSelectChat} />
    </div>
  )
}
