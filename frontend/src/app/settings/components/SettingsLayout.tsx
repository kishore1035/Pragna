'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Monitor,
  Download,
  Keyboard,
  Info,
  Brain,
  ChevronRight,
  Sparkles,
  Gauge,
  Plug,
} from 'lucide-react';
import ModelsSettings from './ModelsSettings';
import InterfaceSettings from './InterfaceSettings';
import ExportSettings from './ExportSettings';
import ShortcutsSettings from './ShortcutsSettings';
import AboutSettings from './AboutSettings';
import MemorySettings from './MemorySettings';
import SkillsSettings from './SkillsSettings';
import UsageSettings from './UsageSettings';
import McpSettings from './McpSettings';

const categories = [
  { id: 'models', label: 'Models', icon: Cpu, description: 'API keys & defaults' },
  { id: 'skills', label: 'Skills', icon: Sparkles, description: 'Custom agent skills & guides' },
  { id: 'mcp', label: 'MCP Servers', icon: Plug, description: 'External tool servers' },
  { id: 'memory', label: 'Memory', icon: Brain, description: 'Personalized user memory' },
  { id: 'usage', label: 'Usage', icon: Gauge, description: 'Token usage & estimated cost' },
  { id: 'interface', label: 'Interface', icon: Monitor, description: 'Appearance & behavior' },
  { id: 'export', label: 'Export', icon: Download, description: 'Format & filename' },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard, description: 'Keyboard reference' },
  { id: 'about', label: 'About', icon: Info, description: 'Version & credits' },
];

export default function SettingsLayout() {
  const [active, setActive] = useState('models');

  const renderPanel = () => {
    switch (active) {
      case 'models': return <ModelsSettings />;
      case 'skills': return <SkillsSettings />;
      case 'mcp': return <McpSettings />;
      case 'memory': return <MemorySettings />;
      case 'usage': return <UsageSettings />;
      case 'interface': return <InterfaceSettings />;
      case 'export': return <ExportSettings />;
      case 'shortcuts': return <ShortcutsSettings />;
      case 'about': return <AboutSettings />;
      default: return <ModelsSettings />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0">
      {/* Left nav — sidebar on desktop, horizontal scroll tab strip on mobile */}
      <div className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border flex flex-col bg-muted/20">
        <div className="px-4 h-14 hidden md:flex items-center border-b border-border shrink-0">
          <h1 className="text-base font-semibold text-foreground">Settings</h1>
        </div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-y-auto scrollbar-thin py-2 md:py-3 px-2 gap-1 md:gap-0">
          {categories?.map((cat) => (
            <button
              key={`settings-nav-${cat?.id}`}
              onClick={() => setActive(cat?.id)}
              className={`shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-sm transition-colors md:mb-0.5 text-left whitespace-nowrap ${
                active === cat?.id
                  ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <cat.icon size={16} className="shrink-0" />
              <div className="flex-1 min-w-0 hidden md:block">
                <p className="font-medium leading-none">{cat?.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat?.description}</p>
              </div>
              <span className="md:hidden font-medium">{cat?.label}</span>
              {active === cat?.id && <ChevronRight size={13} className="hidden md:block" />}
            </button>
          ))}
        </nav>
      </div>
      {/* Right panel */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {renderPanel()}
      </div>
    </div>
  );
}
