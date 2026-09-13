import { useContext, useState } from 'react'
import { MenuIcon, PanelExpandIcon } from '../components/PragnaIcon'
import Sidebar from '../components/Sidebar'
import ArtifactPanel from '../../components/artifact/ArtifactPanel'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { ChatContext } from '../../context/ChatContext'
import { motion, AnimatePresence } from 'framer-motion'
import pragnaLogo from '../../assets/pragna-logo-full.png'

const MainLayout = ({
  children,
  activeView,
  onViewChange,
  recentChats,
  activeChatId,
  onSelectRecent,
  onDeleteRecent,
  onNewChat,
  onLogout,
  userProfile,
  onOpenSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { sidebarOpen, toggleSidebar, isArtifactOpen, activeArtifact, closeArtifact } = useContext(ChatContext)

  return (
    <div className="pragna-shell flex h-screen h-[100dvh] overflow-hidden bg-transparent">
      {/* Desktop Sidebar */}
      {isDesktop && sidebarOpen && (
        <div style={{ width: '270px' }} className="flex-shrink-0">
          <Sidebar
            activeView={activeView}
            onViewChange={onViewChange}
            recentChats={recentChats}
            activeChatId={activeChatId}
            onSelectRecent={onSelectRecent}
            onDeleteRecent={onDeleteRecent}
            onNewChat={onNewChat}
            onLogout={onLogout}
            userProfile={userProfile}
            onOpenSettings={onOpenSettings}
          />
        </div>
      )}

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {!isDesktop && mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-[320px] z-50 shadow-premium-lg"
            >
              <Sidebar
                activeView={activeView}
                onViewChange={onViewChange}
                recentChats={recentChats}
                activeChatId={activeChatId}
                onSelectRecent={onSelectRecent}
                onDeleteRecent={onDeleteRecent}
                onNewChat={onNewChat}
                onLogout={onLogout}
                userProfile={userProfile}
                onOpenSettings={onOpenSettings}
                onClose={() => setMobileMenuOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Reopen sidebar button (desktop only, shown when sidebar is closed) */}
        {isDesktop && !sidebarOpen && (
          <button
            onClick={toggleSidebar}
            title="Open sidebar"
            className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-surface/80 backdrop-blur-sm border border-border hover:bg-surface-subtle transition-colors"
          >
            <PanelExpandIcon size={18} color="var(--pragna-text-muted)" />
          </button>
        )}

        {/* Mobile Header */}
        {!isDesktop && (
          <div className="sticky top-0 z-20 bg-surface/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-surface-subtle transition-colors"
            >
              <MenuIcon size={20} color="var(--pragna-text-muted)" />
            </button>
            <img src={pragnaLogo} alt="Pragna-1 A" className="h-8 w-auto object-contain" />
            <div className="w-8" />
          </div>
        )}
        
        {/* Content & Split-Screen Canvas */}
        <div className="flex-1 flex flex-row min-h-0 min-w-0 overflow-hidden relative">
          <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            {children}
          </main>

          {/* Side-by-Side Artifact Studio Panel */}
          <ArtifactPanel
            artifact={activeArtifact}
            isOpen={isArtifactOpen}
            onClose={closeArtifact}
          />
        </div>
      </div>
    </div>
  )
}

export default MainLayout
