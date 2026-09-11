import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Trash2,
  Shield,
  Mail,
  Calendar,
  Activity,
  Wrench,
  Bot,
  ArrowRight,
  BookOpen,
  X,
  Sparkles,
  Lock,
  KeyRound,
  Server,
  Send,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  HelpCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Input } from '../ui'
import { useAuth } from '../ui/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { toolsService, type AITool } from '../services/toolsService'
import { authService, type SMTPConfigInfo, type SMTPConfigUpdate } from '../services/authService'
import ChatWidget from '../components/ChatWidget'

const AVATAR_COLORS: Record<string, string> = {
  chatbot: 'from-violet-500 to-purple-700',
  coding_assistant: 'from-blue-500 to-indigo-700',
  image_generation: 'from-pink-500 to-rose-600',
  writing: 'from-amber-400 to-orange-500',
  developer_tool: 'from-emerald-400 to-teal-600',
  data_analysis: 'from-cyan-400 to-blue-500',
  agent: 'from-fuchsia-500 to-violet-600',
}

const PRICING_COLORS: Record<string, string> = {
  free: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  freemium: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  paid: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
}

const CATEGORY_LABELS: Record<string, string> = {
  chatbot: 'AI Chatbot',
  coding_assistant: 'Coding Assistant',
  image_generation: 'Image Generation',
  developer_tool: 'Developer Tool',
  agent: 'AI Agent',
}

/* ─── Tool Chat Modal ───────────────────────────────────────────────────── */
function ToolChatModal({ tool, onClose }: { tool: AITool; onClose: () => void }) {
  const color = AVATAR_COLORS[tool.category] || 'from-violet-600 to-purple-800'
  const initials = tool.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const autoQuery = `Give me a quick overview of "${tool.name}" as a developer tool: what it does, main features, and when to use it.`

  return (
    <AnimatePresence>
      <motion.div
        className="widget-fullscreen-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          className="w-full max-w-2xl h-[88vh] flex flex-col"
          initial={{ scale: 0.92, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 25 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          <Card className="border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col h-full rounded-3xl bg-card">
            <div className="relative bg-gradient-to-br from-purple-500/12 via-purple-500/5 to-transparent p-6 border-b border-border/60 shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full pointer-events-none" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4 pr-10">
                <div
                  className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-sm shadow-md shrink-0`}
                >
                  {tool.logo_url ? (
                    <img
                      src={tool.logo_url}
                      alt={tool.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black">{tool.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold capitalize ${
                        PRICING_COLORS[tool.pricing_type] || 'bg-secondary'
                      }`}
                    >
                      {tool.pricing_type}
                    </span>
                    {tool.official_url && (
                      <a
                        href={tool.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Visit Site
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ChatWidget initialQuery={autoQuery} embedded={true} heightClass="h-full" />
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Profile Page ──────────────────────────────────────────────────────── */
export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null)
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'security' | 'smtp'>('bookmarks')

  // Load bookmark IDs from localStorage
  const [bookmarkIds, setBookmarkIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bookmarked_tools')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Fetch all tools to match bookmark IDs against real data
  const { data } = useQuery({
    queryKey: ['tools-all'],
    queryFn: () => toolsService.list({ page_size: 100 }),
  })

  const allTools: AITool[] = data?.items ?? []
  const bookmarkedTools = allTools.filter((t) => bookmarkIds.includes(t.id))

  const removeBookmark = (toolId: string) => {
    const next = bookmarkIds.filter((id) => id !== toolId)
    setBookmarkIds(next)
    localStorage.setItem('bookmarked_tools', JSON.stringify(next))
  }

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfigInfo | null>(null)
  const [smtpServer, setSmtpServer] = useState('smtp.gmail.com')
  const [smtpPort, setSmtpPort] = useState(587)
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpFrom, setSmtpFrom] = useState('noreply@devproductivity.com')
  const [smtpFromName, setSmtpFromName] = useState('Dev Productivity')
  const [smtpStartTLS, setSmtpStartTLS] = useState(true)
  const [smtpSSL, setSmtpSSL] = useState(false)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [smtpLoading, setSmtpLoading] = useState(false)
  const [smtpSaving, setSmtpSaving] = useState(false)
  const [smtpError, setSmtpError] = useState('')
  const [smtpSuccess, setSmtpSuccess] = useState('')

  // SMTP Test State
  const [testEmail, setTestEmail] = useState(user?.email || '')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Load SMTP Settings
  useEffect(() => {
    let cancelled = false
    setSmtpLoading(true)
    authService
      .getSmtpSettings()
      .then((cfg) => {
        if (!cancelled) {
          setSmtpConfig(cfg)
          setSmtpServer(cfg.mail_server || 'smtp.gmail.com')
          setSmtpPort(cfg.mail_port || 587)
          setSmtpUsername(cfg.mail_username || '')
          setSmtpFrom(cfg.mail_from || 'noreply@devproductivity.com')
          setSmtpFromName(cfg.mail_from_name || 'Dev Productivity')
          setSmtpStartTLS(cfg.mail_starttls)
          setSmtpSSL(cfg.mail_ssl_tls)
          setSmtpLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setSmtpLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Handle Password Change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }

    setPasswordLoading(true)
    try {
      const res = await authService.changePassword(currentPassword, newPassword)
      setPasswordSuccess(res.message || 'Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordError(err?.response?.data?.detail || 'Failed to update password. Verify current password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle Save SMTP Settings
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSmtpError('')
    setSmtpSuccess('')
    setTestResult(null)

    setSmtpSaving(true)
    try {
      const payload: SMTPConfigUpdate = {
        mail_server: smtpServer,
        mail_port: Number(smtpPort),
        mail_username: smtpUsername,
        mail_from: smtpFrom,
        mail_from_name: smtpFromName,
        mail_starttls: smtpStartTLS,
        mail_ssl_tls: smtpSSL,
      }
      if (smtpPassword.trim()) {
        payload.mail_password = smtpPassword.trim()
      }

      const updated = await authService.updateSmtpSettings(payload)
      setSmtpConfig(updated)
      setSmtpSuccess('SMTP configuration updated successfully! Credentials saved.')
      setSmtpPassword('')
    } catch (err: any) {
      setSmtpError(err?.response?.data?.detail || 'Failed to save SMTP settings.')
    } finally {
      setSmtpSaving(false)
    }
  }

  // Handle Test SMTP Send
  const handleTestSmtp = async () => {
    if (!testEmail.trim()) {
      setTestResult({ success: false, message: 'Please enter a valid destination email.' })
      return
    }
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await authService.testSmtp(testEmail.trim())
      setTestResult({ success: true, message: res.message || 'Test email dispatched successfully!' })
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.response?.data?.detail || 'SMTP test failed. Check your credentials and server port.',
      })
    } finally {
      setTestLoading(false)
    }
  }

  const initials =
    user?.name
      ?.split(' ')
      .map((w: string) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 space-y-8 max-w-4xl">
      {/* ── Profile Header ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="glass-card relative overflow-hidden border border-purple-500/20 rounded-3xl p-2 sm:p-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />

          <CardContent className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-purple-500/30 shrink-0"
              >
                {initials}
              </motion.div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black">{user?.name || 'Developer'}</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    {user?.role || 'Member'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-purple-500" /> {user?.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-500" /> Active Member
                  </span>
                </div>
              </div>

              {/* Navigation Tabs Pill Bar */}
              <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center shrink-0 w-full">
                  <p className="text-xl font-black text-purple-600 dark:text-purple-400">{bookmarkIds.length}</p>
                  <p className="text-[11px] text-muted-foreground font-semibold">Bookmarks</p>
                </div>
              </div>
            </div>

            {/* Tab Selection */}
            <div className="flex items-center gap-2 mt-6 pt-5 border-t border-border/50 overflow-x-auto">
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'bookmarks'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Saved Bookmarks ({bookmarkIds.length})
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'security'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                Change Password
              </button>

              <button
                onClick={() => setActiveTab('smtp')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'smtp'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Server className="w-4 h-4" />
                SMTP & Gmail Settings
                {smtpConfig?.is_configured && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Tab 1: Bookmarks Section ───────────────────────────────────── */}
      {activeTab === 'bookmarks' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="glass-card border border-border/70 rounded-3xl">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <Bookmark className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Saved Bookmarks
                {bookmarkIds.length > 0 && (
                  <span className="ml-auto text-xs font-bold px-3 py-1 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-full">
                    {bookmarkIds.length} Saved
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {bookmarkIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-muted-foreground text-center">
                  <Bookmark className="w-12 h-12 opacity-25 text-purple-500 mb-3" />
                  <p className="font-bold text-base text-foreground">No bookmarks saved yet</p>
                  <p className="text-xs sm:text-sm mt-1 mb-5 max-w-sm">
                    Bookmark your favorite tools from the Explore page to access them quickly here.
                  </p>
                  <Button onClick={() => navigate('/explore')} className="font-bold">
                    <Wrench className="w-4 h-4 mr-2" /> Explore Tools
                  </Button>
                </div>
              ) : allTools.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bookmarkIds.map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl animate-pulse bg-secondary/30" />
                  ))}
                </div>
              ) : bookmarkedTools.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Loading your bookmarked tools...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {bookmarkedTools.map((tool, i) => {
                      const color = AVATAR_COLORS[tool.category] || 'from-violet-600 to-purple-800'
                      const initials = tool.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                      return (
                        <motion.div
                          key={tool.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, height: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/70 hover:border-purple-400/50 hover:bg-secondary/40 transition-all group"
                        >
                          {/* Logo */}
                          <div className="w-11 h-11 min-w-[2.75rem] min-h-[2.75rem] max-w-[2.75rem] max-h-[2.75rem] rounded-xl bg-white dark:bg-card border border-border/70 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                            {tool.logo_url ? (
                              <img
                                src={tool.logo_url}
                                alt={tool.name}
                                className="w-full h-full object-contain p-1.5"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  if (e.currentTarget.parentElement) {
                                    e.currentTarget.parentElement.className = `w-11 h-11 min-w-[2.75rem] min-h-[2.75rem] max-w-[2.75rem] max-h-[2.75rem] rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm`
                                    e.currentTarget.parentElement.innerText = initials
                                  }
                                }}
                              />
                            ) : (
                              <div
                                className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-xs`}
                              >
                                {initials}
                              </div>
                            )}
                          </div>

                          {/* Name + category */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {tool.name}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {CATEGORY_LABELS[tool.category] || tool.category}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedTool(tool)}
                              className="p-2 rounded-xl hover:bg-purple-500/10 text-muted-foreground hover:text-purple-600 transition-colors"
                              title="Chat with AI about this tool"
                            >
                              <Bot className="w-4 h-4" />
                            </button>
                            {tool.official_url && (
                              <a href={tool.official_url} target="_blank" rel="noopener noreferrer">
                                <button
                                  className="p-2 rounded-xl hover:bg-purple-500/10 text-muted-foreground hover:text-purple-600 transition-colors"
                                  title="Open website"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </a>
                            )}
                            <button
                              onClick={() => removeBookmark(tool.id)}
                              className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove bookmark"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Bookmarked badge */}
                          <BookmarkCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 group-hover:hidden" />
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}

              {bookmarkIds.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border/50">
                  <button
                    onClick={() => navigate('/explore')}
                    className="flex items-center gap-2 text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-bold hover:underline"
                  >
                    <Wrench className="w-4 h-4" /> Browse more tools in catalog
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Tab 2: Change Password Section ─────────────────────────────── */}
      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="glass-card border border-border/70 rounded-3xl">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-lg font-black">
                <KeyRound className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Change Account Password
              </CardTitle>
              <CardDescription className="text-xs">
                Update your account credentials to keep your workspace secure
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {passwordError && (
                <div className="mb-5 flex items-center gap-2 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-5 flex items-center gap-2 text-xs sm:text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground" htmlFor="cur-pass">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      id="cur-pass"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="Enter your current password"
                      className="h-11 rounded-xl bg-card border-border/70 pr-11 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground" htmlFor="new-pass">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="new-pass"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      className="h-11 rounded-xl bg-card border-border/70 pr-11 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground" htmlFor="conf-pass">
                    Confirm New Password
                  </label>
                  <Input
                    id="conf-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-type new password"
                    className="h-11 rounded-xl bg-card border-border/70 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={passwordLoading}
                  className="mt-2 h-11 font-bold shadow-lg shadow-purple-500/25 bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" /> Update Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Tab 3: SMTP / Gmail Configuration Section ─────────────────── */}
      {activeTab === 'smtp' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="glass-card border border-border/70 rounded-3xl">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-black">
                    <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    SMTP & Gmail Email Configuration
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure your mail server and Gmail app password to deliver real verification OTPs
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                      smtpConfig?.is_configured
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        smtpConfig?.is_configured ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {smtpConfig?.is_configured ? 'Live SMTP Ready' : 'Dev Console Mode'}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Helpful Gmail instructions banner */}
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-400">
                  <HelpCircle className="w-4 h-4" />
                  <span>How to use Gmail SMTP:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>
                    Server: <code className="text-foreground font-mono">smtp.gmail.com</code> | Port:{' '}
                    <code className="text-foreground font-mono">587</code> (STARTTLS)
                  </li>
                  <li>Mail Username: Your full Gmail address (e.g. yourname@gmail.com)</li>
                  <li>
                    Mail Password: Use a <strong>16-character App Password</strong> generated from{' '}
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 underline font-semibold inline-flex items-center gap-0.5"
                    >
                      Google Security &gt; App Passwords <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    If credentials are blank, the backend automatically uses <strong>Safe Dev Mode</strong> and logs OTPs
                    to stdout and local responses so you're never blocked!
                  </li>
                </ul>
              </div>

              {smtpError && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{smtpError}</span>
                </div>
              )}

              {smtpSuccess && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{smtpSuccess}</span>
                </div>
              )}

              {/* Provider Quick Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground block">Quick Provider Presets</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSmtpServer('smtp.gmail.com')
                      setSmtpPort(587)
                      setSmtpStartTLS(true)
                      setSmtpSSL(false)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      smtpServer === 'smtp.gmail.com'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-secondary/40 border-border/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🔴 Gmail (smtp.gmail.com:587)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSmtpServer('smtp.office365.com')
                      setSmtpPort(587)
                      setSmtpStartTLS(true)
                      setSmtpSSL(false)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      smtpServer === 'smtp.office365.com'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-secondary/40 border-border/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🔵 Outlook (smtp.office365.com:587)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSmtpServer('smtp.mail.yahoo.com')
                      setSmtpPort(587)
                      setSmtpStartTLS(true)
                      setSmtpSSL(false)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      smtpServer === 'smtp.mail.yahoo.com'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-secondary/40 border-border/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🟣 Yahoo Mail (smtp.mail.yahoo.com:587)
                  </button>
                </div>
              </div>

              {/* Notice if Gmail is selected with a non-gmail username */}
              {smtpServer === 'smtp.gmail.com' && smtpUsername && !smtpUsername.toLowerCase().includes('@gmail') && !smtpUsername.toLowerCase().includes('@googlemail') && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <strong className="block font-bold mb-0.5">Gmail Authentication Notice:</strong>
                    Because SMTP Server is set to <code className="font-mono text-amber-200">smtp.gmail.com</code>, your <strong>Mail Username</strong> must be your real personal Google account (e.g. <code className="font-mono text-amber-200">yourname@gmail.com</code>) that generated your 16-letter App Password, not a custom domain like <code className="font-mono text-amber-200">noreply@devproductivity.com</code>.
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveSmtp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">SMTP Server Host</label>
                  <Input
                    type="text"
                    value={smtpServer}
                    onChange={(e) => setSmtpServer(e.target.value)}
                    placeholder="smtp.gmail.com"
                    required
                    className="h-11 rounded-xl bg-card border-border/70 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">SMTP Port</label>
                  <Input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                    required
                    className="h-11 rounded-xl bg-card border-border/70 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Mail Username / Gmail</label>
                  <Input
                    type="text"
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                    placeholder="username@gmail.com"
                    className="h-11 rounded-xl bg-card border-border/70 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Mail / App Password</label>
                  <div className="relative">
                    <Input
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder={smtpConfig?.is_configured ? '•••••••••••• (saved)' : 'Enter 16-character App Password'}
                      className="h-11 rounded-xl bg-card border-border/70 pr-11 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Sender "From" Email</label>
                  <Input
                    type="email"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    placeholder="noreply@devproductivity.com"
                    className="h-11 rounded-xl bg-card border-border/70 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Sender "From" Name</label>
                  <Input
                    type="text"
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                    placeholder="Dev Productivity"
                    className="h-11 rounded-xl bg-card border-border/70 text-sm"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={smtpStartTLS}
                      onChange={(e) => setSmtpStartTLS(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Enable STARTTLS (Port 587 recommended)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={smtpSSL}
                      onChange={(e) => setSmtpSSL(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Enable SSL / TLS (Port 465)</span>
                  </label>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <Button
                    type="submit"
                    disabled={smtpSaving}
                    className="h-11 font-bold shadow-lg shadow-purple-500/25 bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    {smtpSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving SMTP Settings...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Save SMTP Settings
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Test Email Section */}
              <div className="pt-6 border-t border-border/60 space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Send className="w-4 h-4 text-purple-400" />
                  Test Email Transmission
                </h4>
                <p className="text-xs text-muted-foreground">
                  Send a test email to verify your SMTP server connection and credentials.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter email to receive test"
                    className="h-11 rounded-xl bg-card border-border/70 text-sm"
                  />
                  <Button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testLoading || !smtpConfig?.is_configured}
                    variant="outline"
                    className="h-11 font-bold shrink-0"
                  >
                    {testLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Send Test Mail
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`mt-2 flex items-center gap-2 text-xs rounded-xl px-4 py-3 border ${
                      testResult.success
                        ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-destructive bg-destructive/10 border-destructive/20'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tool Chat Modal */}
      {selectedTool && <ToolChatModal tool={selectedTool} onClose={() => setSelectedTool(null)} />}
    </div>
  )
}
