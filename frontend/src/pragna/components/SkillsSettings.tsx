import { useEffect, useState, useRef } from 'react'
import {
  fetchSkills,
  createSkill,
  uploadSkill,
  reloadSkills,
  deleteSkill,
} from '../../api/api'
import {
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  SearchIcon,
} from './PragnaIcon'
import { RefreshCw, Upload, FileText, Code2, AlertCircle } from 'lucide-react'

export default function SkillsSettings() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [msg, setMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const loadSkills = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const list = await fetchSkills()
      setSkills(list || [])
    } catch (err) {
      console.error('Failed to load skills:', err)
      setErrorMsg('Failed to load skills from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSkills()
  }, [])

  const handleCreateSkill = async (e) => {
    e.preventDefault()
    if (!name.trim() || !instructions.trim()) return
    setErrorMsg('')

    try {
      await createSkill({
        name: name.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
      })
      setMsg(`Skill '${name.trim()}' created successfully!`)
      setName('')
      setDescription('')
      setInstructions('')
      setIsAdding(false)
      loadSkills()
      setTimeout(() => setMsg(''), 3500)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create skill.')
    }
  }

  const handleDeleteSkill = async (skillName) => {
    if (!window.confirm(`Delete skill "${skillName}"? This action cannot be undone.`)) return
    setErrorMsg('')
    try {
      await deleteSkill(skillName)
      setMsg(`Skill '${skillName}' removed.`)
      if (selectedSkill?.name === skillName) setSelectedSkill(null)
      loadSkills()
      setTimeout(() => setMsg(''), 3500)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete skill.')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setErrorMsg('')
    try {
      const res = await uploadSkill(file)
      setMsg(res.message || `File ${file.name} uploaded successfully!`)
      loadSkills()
      setTimeout(() => setMsg(''), 3500)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload skill file.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleHotReload = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await reloadSkills()
      setSkills(res.skills || [])
      setMsg(res.message || 'Skills hot-reloaded successfully.')
      setTimeout(() => setMsg(''), 3500)
    } catch (err) {
      setErrorMsg(err.message || 'Failed to hot reload skills.')
    } finally {
      setLoading(false)
    }
  }

  const filteredSkills = skills.filter((s) => {
    const q = searchQuery.toLowerCase()
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.filename || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--pragna-border)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--pragna-text)] flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[rgba(212,175,55,0.15)] text-[var(--pragna-gold-soft)]">
              <SparklesIcon size={18} />
            </span>
            Agent Skills Engine
          </h2>
          <p className="text-xs text-[var(--pragna-text-muted)] mt-1">
            Manage Python capabilities, agent tools, prompt workflows, and domain skills for Pragna.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.py,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--pragna-border)] bg-[var(--pragna-surface-2)] text-[var(--pragna-text-soft)] text-xs font-medium hover:text-[var(--pragna-text)] transition-colors cursor-pointer"
            title="Upload custom Python or Markdown skill script"
          >
            <Upload size={14} className={uploading ? 'animate-bounce' : ''} />
            {uploading ? 'Uploading…' : 'Upload Skill Script'}
          </button>

          <button
            type="button"
            onClick={handleHotReload}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--pragna-border)] bg-[var(--pragna-surface-2)] text-[var(--pragna-text-soft)] text-xs font-medium hover:text-[var(--pragna-text)] transition-colors cursor-pointer"
            title="Hot-reload skills from filesystem"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Hot Reload
          </button>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[var(--pragna-gold-soft)] to-[var(--pragna-gold-deep)] text-[var(--pragna-on-gold)] text-xs font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
          >
            <PlusIcon size={14} />
            {isAdding ? 'Cancel' : 'Create Skill'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircleIcon size={16} />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Create New Skill Form */}
      {isAdding && (
        <form onSubmit={handleCreateSkill} className="p-5 border border-[var(--pragna-border)] rounded-xl bg-[var(--pragna-surface-2)] space-y-4 shadow-md">
          <h3 className="font-semibold text-sm text-[var(--pragna-gold-soft)] flex items-center gap-2">
            <Code2 size={16} />
            New Agent Skill Specification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[var(--pragna-text-muted)] uppercase tracking-wider">Skill Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. data_analyst, latex_compiler"
                className="w-full mt-1.5 px-3 py-2 bg-[var(--pragna-surface)] border border-[var(--pragna-border)] rounded-lg text-xs text-[var(--pragna-text)] outline-none focus:border-[var(--pragna-gold-soft)]"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--pragna-text-muted)] uppercase tracking-wider">Short Description / Docstring</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this skill enables Pragna to do..."
                className="w-full mt-1.5 px-3 py-2 bg-[var(--pragna-surface)] border border-[var(--pragna-border)] rounded-lg text-xs text-[var(--pragna-text)] outline-none focus:border-[var(--pragna-gold-soft)]"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[var(--pragna-text-muted)] uppercase tracking-wider">Skill Instructions & Execution Guide</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Step-by-step instructions, parameters, and python prompt guidance..."
              rows={6}
              className="w-full mt-1.5 px-3 py-2 bg-[var(--pragna-surface)] border border-[var(--pragna-border)] rounded-lg text-xs font-mono text-[var(--pragna-text)] outline-none focus:border-[var(--pragna-gold-soft)]"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 bg-[var(--pragna-surface)] text-[var(--pragna-text-muted)] rounded-lg text-xs hover:text-[var(--pragna-text)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-gradient-to-r from-[var(--pragna-gold-soft)] to-[var(--pragna-gold-deep)] text-[var(--pragna-on-gold)] rounded-lg text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
            >
              Save Skill
            </button>
          </div>
        </form>
      )}

      {/* Search & Stats Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pragna-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills by name, description…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--pragna-surface-2)] border border-[var(--pragna-border)] rounded-lg text-[var(--pragna-text)] outline-none focus:border-[var(--pragna-gold-soft)]"
          />
        </div>
        <div className="text-xs text-[var(--pragna-text-muted)] font-mono">
          {filteredSkills.length} of {skills.length} skills active
        </div>
      </div>

      {/* Skills List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--pragna-text-muted)]">Loading skills from engine…</div>
        ) : filteredSkills.length === 0 ? (
          <div className="p-8 border border-dashed border-[var(--pragna-border)] rounded-xl text-center text-[var(--pragna-text-muted)] space-y-1 bg-[var(--pragna-surface-2)]/30">
            <FileText size={28} className="mx-auto mb-2 opacity-40 text-[var(--pragna-gold-soft)]" />
            <p className="font-semibold text-xs text-[var(--pragna-text)]">
              {searchQuery ? 'No matching skills found' : 'No custom agent skills loaded'}
            </p>
            <p className="text-[11px]">
              {searchQuery ? 'Try another search query.' : 'Click "Create Skill" or "Upload Skill Script" to expand Pragna capabilities.'}
            </p>
          </div>
        ) : (
          filteredSkills.map((skill) => (
            <div
              key={skill.name}
              className="p-3.5 border border-[var(--pragna-border)] rounded-xl bg-[var(--pragna-surface-2)]/50 hover:bg-[var(--pragna-surface-2)] transition-all flex items-start justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-[var(--pragna-gold-soft)]">
                    {skill.name}
                  </span>
                  {skill.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(212,175,55,0.1)] text-[var(--pragna-gold-soft)] font-mono">
                      {skill.category}
                    </span>
                  )}
                  {skill.filename && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--pragna-surface)] text-[var(--pragna-text-muted)] font-mono">
                      {skill.filename}
                    </span>
                  )}
                  {typeof skill.size_bytes === 'number' && (
                    <span className="text-[10px] text-[var(--pragna-text-muted)] font-mono">
                      {skill.size_bytes > 1024 ? `${(skill.size_bytes / 1024).toFixed(1)} KB` : `${skill.size_bytes} B`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--pragna-text-soft)] line-clamp-2 leading-relaxed">
                  {skill.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedSkill(selectedSkill?.name === skill.name ? null : skill)}
                  className="px-2.5 py-1 text-[11px] rounded-lg border border-[var(--pragna-border)] bg-[var(--pragna-surface)] text-[var(--pragna-text-muted)] hover:text-[var(--pragna-text)] transition-colors cursor-pointer"
                >
                  {selectedSkill?.name === skill.name ? 'Hide' : 'Inspect'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSkill(skill.name)}
                  className="p-1.5 text-[var(--pragna-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Delete skill"
                >
                  <TrashIcon size={14} />
                </button>
              </div>

              {/* Inspector drawer if expanded */}
              {selectedSkill?.name === skill.name && (
                <div className="w-full mt-3 pt-3 border-t border-[var(--pragna-border)] text-[11px] space-y-1.5">
                  <div className="flex justify-between font-mono text-[var(--pragna-text-muted)]">
                    <span>Path: data/skills/{skill.path || skill.filename}</span>
                    <span>Bytes: {skill.size_bytes} bytes</span>
                  </div>
                  <div className="p-2.5 bg-[var(--pragna-surface)] rounded-lg font-mono text-[var(--pragna-text)] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {skill.description}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
