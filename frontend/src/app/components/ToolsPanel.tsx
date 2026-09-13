'use client';

import React, { useState } from 'react';
import {
  X, Search, Globe, Monitor, FolderOpen, Terminal, Brain,
  Bot, BookOpen, Eye, Calendar, Wrench, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';

interface Tool {
  name: string;
  description: string;
  requiresConfirm?: boolean;
}

interface Category {
  key: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  tools: Tool[];
}

const CATEGORIES: Category[] = [
  {
    key: 'web',
    icon: <Globe size={16} />,
    label: 'Web & Search',
    color: 'text-blue-500',
    tools: [
      { name: 'web_search', description: 'Search the web for real-time info, news, and docs' },
      { name: 'web_extract', description: 'Extract and read text/markdown content from any URL' },
      { name: 'x_search', description: 'Search public X (Twitter) posts, threads, and updates' },
      { name: 'open_url', description: "Open a URL directly in the user's own browser tab" },
    ],
  },
  {
    key: 'browser',
    icon: <Monitor size={16} />,
    label: 'Browser Automation',
    color: 'text-purple-500',
    tools: [
      { name: 'browser_navigate', description: 'Navigate the headless browser to a URL' },
      { name: 'browser_snapshot', description: 'Take an accessibility + visual snapshot of the page' },
      { name: 'browser_click', description: 'Click buttons, links, or elements by CSS selector', requiresConfirm: true },
      { name: 'browser_type', description: 'Enter text into form fields and inputs', requiresConfirm: true },
      { name: 'browser_scroll', description: 'Scroll pages up, down, or to a specific element' },
      { name: 'browser_back', description: 'Navigate backward in browser history' },
      { name: 'browser_press', description: 'Send key presses (Enter, Tab, Escape, Arrows…)' },
      { name: 'browser_get_images', description: 'Extract image assets and URLs from the current page' },
      { name: 'browser_screenshot', description: 'Take a screenshot of the current browser page' },
      { name: 'browser_console', description: 'Access browser JavaScript console logs and errors' },
      { name: 'browser_dialog', description: 'Handle alert, prompt, and confirm dialog popups' },
      { name: 'browser_exec', description: 'Run autonomous multi-step browser workflows', requiresConfirm: true },
      { name: 'browser_act', description: 'Perform low-level click/type action sequences', requiresConfirm: true },
    ],
  },
  {
    key: 'files',
    icon: <FolderOpen size={16} />,
    label: 'File Operations',
    color: 'text-amber-500',
    tools: [
      { name: 'read_file', description: 'View contents of local text or code files (with line slicing)' },
      { name: 'write_file', description: 'Create or overwrite files on the filesystem', requiresConfirm: true },
      { name: 'patch', description: 'Apply precise fuzzy-matched diff edits to files', requiresConfirm: true },
      { name: 'search_files', description: 'Search filenames or file contents across directories' },
    ],
  },
  {
    key: 'terminal',
    icon: <Terminal size={16} />,
    label: 'Terminal & Process',
    color: 'text-green-500',
    tools: [
      { name: 'terminal', description: 'Execute shell commands (PowerShell/Bash) and return output', requiresConfirm: true },
      { name: 'process', description: 'Monitor, inspect, list, or terminate running processes' },
    ],
  },
  {
    key: 'productivity',
    icon: <Brain size={16} />,
    label: 'Planning & Memory',
    color: 'text-rose-500',
    tools: [
      { name: 'todo', description: 'Track and manage task checklists for multi-step goals' },
      { name: 'memory', description: 'Store and recall persistent notes and profile details' },
      { name: 'session_search', description: 'Search past session histories and conversation logs' },
      { name: 'cronjob', description: 'Schedule one-time timers or recurring background cron tasks' },
      { name: 'clarify', description: 'Ask structured clarifying questions (multiple-choice or open-ended)' },
    ],
  },
  {
    key: 'code',
    icon: <Bot size={16} />,
    label: 'Code & Subagents',
    color: 'text-cyan-500',
    tools: [
      { name: 'execute_code', description: 'Execute Python code programmatically and call tools in sequence' },
      { name: 'run_python_code', description: 'Run Python in a sandboxed interpreter (stdout/stderr)' },
      { name: 'delegate_task', description: 'Spawn isolated subagents for parallel or long-running work' },
    ],
  },
  {
    key: 'skills',
    icon: <BookOpen size={16} />,
    label: 'Skills Management',
    color: 'text-indigo-500',
    tools: [
      { name: 'skills_list', description: 'List all available skills and domain instruction sets' },
      { name: 'skill_view', description: 'View the full content and guidelines of a skill by name' },
      { name: 'skill_manage', description: 'Create, edit, or disable project skills' },
      { name: 'use_skill', description: 'Load and execute an agent skill template by name' },
    ],
  },
  {
    key: 'media',
    icon: <Eye size={16} />,
    label: 'Vision & Media',
    color: 'text-pink-500',
    tools: [
      { name: 'vision_analyze', description: 'Analyze images, diagrams, and visual inputs' },
      { name: 'image_generate', description: 'Generate creative images from text prompts (FLUX / Stability)' },
      { name: 'edit_image', description: 'Edit the most recently generated image with a natural instruction' },
      { name: 'video_generate', description: 'Generate videos from text prompts or reference images' },
      { name: 'text_to_speech', description: 'Convert text to audio (Edge TTS / OpenAI / ElevenLabs)' },
    ],
  },
  {
    key: 'kanban',
    icon: <Wrench size={16} />,
    label: 'Kanban Board',
    color: 'text-orange-500',
    tools: [
      { name: 'create_kanban_task', description: 'Create a new task on the project Kanban board' },
      { name: 'update_kanban_task', description: 'Update the status or details of a Kanban task' },
      { name: 'list_kanban_tasks', description: 'List all tasks on the Kanban board with optional filters' },
    ],
  },
  {
    key: 'scheduler',
    icon: <Calendar size={16} />,
    label: 'Scheduler',
    color: 'text-teal-500',
    tools: [
      { name: 'schedule_task', description: 'Schedule a background automated task or reminder' },
    ],
  },
];

const TOTAL_TOOLS = CATEGORIES.reduce((n, c) => n + c.tools.length, 0);

interface ToolsPanelProps {
  onClose: () => void;
  onInsertTool?: (name: string) => void;
}

export default function ToolsPanel({ onClose, onInsertTool }: ToolsPanelProps) {
  const [search, setSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['web', 'browser']));

  const toggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filtered = search.trim().toLowerCase();

  const matchingCats = CATEGORIES.map((cat) => {
    if (!filtered) return cat;
    const tools = cat.tools.filter(
      (t) => t.name.includes(filtered) || t.description.toLowerCase().includes(filtered)
    );
    const catMatch = cat.label.toLowerCase().includes(filtered);
    return { ...cat, tools: catMatch ? cat.tools : tools };
  }).filter((cat) => cat.tools.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex flex-col bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wrench size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Agent Tools</h2>
              <p className="text-xs text-muted-foreground">
                {TOTAL_TOOLS} tools across {CATEGORIES.length} categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools…"
              className="bg-transparent outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-5 py-2 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 size={12} className="text-green-500" />
            Auto-execute
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle size={12} className="text-amber-500" />
            Requires confirmation
          </div>
        </div>

        {/* Categories list */}
        <div className="overflow-y-auto flex-1 scrollbar-thin py-2">
          {matchingCats.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">No tools match &ldquo;{search}&rdquo;</p>
          )}
          {matchingCats.map((cat) => {
            const isOpen = filtered ? true : expandedKeys.has(cat.key);
            return (
              <div key={cat.key} className="border-b border-border/50 last:border-0">
                {/* Category header */}
                <button
                  onClick={() => toggle(cat.key)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors group"
                >
                  <span className={cat.color}>{cat.icon}</span>
                  <span className="flex-1 text-left text-sm font-semibold text-foreground">{cat.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-mono">
                    {cat.tools.length}
                  </span>
                  {isOpen ? (
                    <ChevronDown size={14} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={14} className="text-muted-foreground" />
                  )}
                </button>

                {/* Tools grid */}
                {isOpen && (
                  <div className="px-4 pb-3 grid grid-cols-1 gap-1">
                    {cat.tools.map((tool) => (
                      <button
                        key={tool.name}
                        onClick={() => onInsertTool?.(tool.name)}
                        title={onInsertTool ? `Insert "${tool.name}" into chat` : tool.description}
                        className="group flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                      >
                        {/* Status dot */}
                        <div className="mt-0.5 shrink-0">
                          {tool.requiresConfirm ? (
                            <AlertTriangle size={13} className="text-amber-500" />
                          ) : (
                            <CheckCircle2 size={13} className="text-green-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <code className="text-xs font-mono font-semibold text-primary group-hover:text-primary/80 transition-colors">
                            {tool.name}
                          </code>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                        {onInsertTool && (
                          <span className="shrink-0 ml-auto text-[10px] text-muted-foreground bg-muted group-hover:bg-primary/10 group-hover:text-primary px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                            insert
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Click any tool to insert its name into your message. Tools marked{' '}
            <AlertTriangle size={10} className="inline text-amber-500" /> require your confirmation before executing.
          </p>
        </div>
      </div>
    </div>
  );
}
