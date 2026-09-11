import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Flame, BookOpen, Target, ArrowRight, Play,
  CheckCircle2, Code2, Loader2, RefreshCw, AlertTriangle,
  Activity, Wrench, Sparkles, ExternalLink,
  GraduationCap, Zap, Star, TrendingUp, Bot, X,
  Copy, Check, Search, Calendar
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui'
import { useAuth } from '../ui/AuthContext'
import { dashboardService, type LearningTopic } from '../services/dashboardService'
import { useQuery } from '@tanstack/react-query'
import ChatWidget from '../components/ChatWidget'
import QuizWidget from '../components/QuizWidget'

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Intermediate: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Advanced: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

/* ─── Topic + AI Chat Modal ──────────────────────────────────────────────── */
function TopicModal({ topic, onClose }: { topic: any; onClose: () => void }) {
  const autoQuery = `Explain "${topic.title}" in a concise and beginner-friendly way with a short code example if applicable.`

  return (
    <AnimatePresence>
      <motion.div
        className="widget-fullscreen-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="w-full max-w-2xl h-[88vh] flex flex-col"
          initial={{ scale: 0.92, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 25 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          <Card className="border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col h-full rounded-3xl bg-card">

            {/* ── Topic Header ───────────────────────────────────────────── */}
            <div className="relative bg-gradient-to-br from-purple-500/12 via-purple-500/5 to-transparent p-6 border-b border-border/60 shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full pointer-events-none" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black leading-snug">{topic.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${DIFFICULTY_COLORS[topic.difficulty_level] || 'bg-secondary'}`}>
                      {topic.difficulty_level}
                    </span>
                    {topic.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{topic.description}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Embedded AI Chat ───────────────────────────────────────── */}
            <div className="flex-1 min-h-0 p-0">
              <ChatWidget
                initialQuery={autoQuery}
                embedded={true}
                heightClass="h-full"
              />
            </div>

          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── All Topics Catalog Modal ───────────────────────────────────────────── */
function AllTopicsModal({
  isOpen,
  onClose,
  onSelectTopic,
}: {
  isOpen: boolean
  onClose: () => void
  onSelectTopic: (topic: any) => void
}) {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('All')

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['all-topics', search, difficulty],
    queryFn: () => dashboardService.getAllTopics(search, difficulty),
    enabled: isOpen,
  })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="widget-fullscreen-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="w-full max-w-4xl h-[88vh] flex flex-col p-2 sm:p-4"
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <Card className="border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col h-full rounded-3xl bg-card">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-border/70 bg-gradient-to-r from-purple-500/10 to-transparent flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight">Learning Topics Catalog</h2>
                  <p className="text-xs text-muted-foreground">
                    Browse modern programming, system design, cloud, DevOps, and AI topics.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter and Search */}
            <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-3 items-center justify-between bg-secondary/15 shrink-0">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search topics, keywords..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-background/80 border border-border/70 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {['All', 'Beginner', 'Intermediate', 'Advanced'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      difficulty === diff
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                        : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics Grid */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl animate-pulse bg-secondary/30" />
                ))
              ) : topics.length > 0 ? (
                topics.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onClose()
                      onSelectTopic(t)
                    }}
                    className="glass-card p-4 rounded-2xl border border-border/70 hover:border-purple-400/60 cursor-pointer transition-all hover:-translate-y-1 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="font-bold text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {t.title}
                        </h4>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold shrink-0 ${DIFFICULTY_COLORS[t.difficulty_level] || 'bg-secondary'}`}>
                          {t.difficulty_level}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5" /> Study with AI Tutor
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-16 text-muted-foreground text-sm">
                  No learning topics found matching your criteria.
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  }),
}

function StatCard({ title, value, icon: Icon, trend, subtitle, gradient, onClick }: any) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
      <Card className="glass-card relative overflow-hidden border border-border/70 hover:border-purple-400/60 rounded-2xl">
        <CardContent className="p-5 sm:p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{title}</p>
              <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${gradient || 'bg-purple-500/10 text-purple-600 dark:text-purple-400'} shadow-sm`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          {(subtitle || trend) && (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
              {trend && <span className="text-purple-600 dark:text-purple-400">{trend}</span>}
              {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

const PRICING_COLORS: Record<string, string> = {
  'Free': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'Freemium': 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  'Paid': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
}

const ACTIVITY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  topic_studied: {
    icon: BookOpen,
    color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    label: 'Topic Studied',
  },
  quiz_completed: {
    icon: Target,
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    label: 'Daily Quiz',
  },
  ai_chat: {
    icon: Bot,
    color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    label: 'AI Tutor Session',
  },
  tool_viewed: {
    icon: Wrench,
    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    label: 'Tool Explored',
  },
  login: {
    icon: CheckCircle2,
    color: 'bg-secondary text-muted-foreground',
    label: 'Signed In',
  },
  default: {
    icon: Code2,
    color: 'bg-purple-500/10 text-purple-600',
    label: 'Developer Activity',
  },
}

function formatActivityLabel(act: any) {
  if (act.action === 'topic_studied') {
    return act.resource_id ? `Studied: ${act.resource_id}` : 'Studied Learning Topic'
  }
  if (act.action === 'quiz_completed') {
    return act.resource_id ? `Completed Daily Quiz (${act.resource_id})` : 'Completed Daily Quiz'
  }
  if (act.action === 'ai_chat') {
    return act.resource_id ? `Asked AI: "${act.resource_id}..."` : 'AI Tutor Consultation'
  }
  if (act.action === 'tool_viewed') {
    return act.resource_id ? `Explored Tool: ${act.resource_id}` : 'Explored AI Tool'
  }
  if (act.action === 'login') {
    return 'Signed into DevProductivity'
  }
  return act.action.replace(/_/g, ' ')
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSec < 45) return 'Just now'
  if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 172800) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.name?.split(' ')[0] || 'Developer'
  const [selectedTopic, setSelectedTopic] = useState<any>(null)
  const [shuffledTopics, setShuffledTopics] = useState<any[] | null>(null)
  const [shuffleOffset, setShuffleOffset] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getMyDashboard,
    retry: 1,
  })

  const stats = data?.stats
  const recentActivity = data?.recent_activity || []
  const featuredTools = data?.featured_tools || []
  const latestTopics = data?.latest_topics || []
  const todayContent = data?.today_content

  const activeTopics = shuffledTopics || latestTopics

  const handleOpenTopic = (topic: any) => {
    setSelectedTopic(topic)
    // Record real-time activity and immediately refresh dashboard
    dashboardService.recordActivity({
      action: 'topic_studied',
      resource_type: 'learning_topic',
      resource_id: topic.title,
    }).then(() => {
      refetch()
    })
  }

  const handleShuffleTopics = async () => {
    setIsShuffling(true)
    const nextOffset = shuffleOffset + 1
    try {
      const newTopics = await dashboardService.shuffleTopics(nextOffset)
      setShuffledTopics(newTopics)
      setShuffleOffset(nextOffset)
    } catch (e) {
      console.error(e)
    } finally {
      setIsShuffling(false)
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const greetingEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙'

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 space-y-9">

      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> DEVELOPER OVERVIEW
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            {greeting}, <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{displayName}</span> {greetingEmoji}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
            {isLoading
              ? 'Loading your dashboard...'
              : isError
              ? 'Welcome back! Ready to level up your engineering skills today?'
              : <><span className="text-foreground font-bold">{stats?.total_tools || 0} AI tools</span> and <span className="text-foreground font-bold">{(stats as any)?.total_topics || 0} learning topics</span> available for you.</>
            }
          </p>
          {!isLoading && data?.ai_insight && (
            <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 mt-2 font-medium italic flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0" /> "{data.ai_insight}"
            </p>
          )}
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Button variant="default" onClick={() => navigate('/explore')} className="shadow-lg shadow-purple-500/25">
            <TrendingUp className="w-4 h-4 mr-1.5" /> Browse Catalog
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-secondary/30 border-border/40 rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <motion.div
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="AI Tools Available"
            value={stats.total_tools.toLocaleString()}
            icon={Wrench}
            trend={`${stats.featured_tools} featured`}
            subtitle="in catalog"
            gradient="bg-purple-500/15 text-purple-600 dark:text-purple-400"
            onClick={() => navigate('/explore')}
          />
          <StatCard
            title="Your Activity (7 days)"
            value={stats.user_activity_week}
            icon={Activity}
            trend={`${stats.user_activity_month} actions`}
            subtitle="this month"
            gradient="bg-blue-500/15 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Learning Topics"
            value={(stats as any)?.total_topics || 0}
            icon={GraduationCap}
            trend="All skill levels"
            subtitle="curated tracks"
            gradient="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            title="Learning Streak"
            value={`${stats.learning_streak ?? 0}d`}
            icon={Flame}
            trend={(stats.learning_streak ?? 0) > 0 ? '🔥 Active!' : 'Start today!'}
            subtitle={(stats.learning_streak ?? 0) > 0 ? ((stats.learning_streak ?? 0) === 1 ? '1 day streak' : `${stats.learning_streak} days streak`) : 'act today to build streak'}
            gradient="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          />
        </motion.div>
      ) : null}

      {isError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Could not load dashboard data.
          <button onClick={() => refetch()} className="ml-auto flex items-center gap-1 hover:underline font-bold">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT — Main content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Today's Learning Focus */}
          {todayContent && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="glass-card border border-purple-500/20 relative overflow-hidden rounded-3xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/15 via-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                      <CardTitle className="text-lg font-black flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Today's Learning Focus
                      </CardTitle>
                      {todayContent.date_formatted && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {todayContent.date_formatted}
                        </span>
                      )}
                      {todayContent.difficulty_level && (
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${DIFFICULTY_COLORS[todayContent.difficulty_level] || 'bg-secondary'}`}>
                          {todayContent.difficulty_level}
                        </span>
                      )}
                      {(todayContent.is_beginner_onboarding || data?.is_new_user) && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm flex items-center gap-1">
                          🌱 Starter Journey
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(todayContent.content_text)
                          setCopiedCode(true)
                          setTimeout(() => setCopiedCode(false), 2000)
                        }}
                        className="text-xs h-7 px-2.5 font-semibold gap-1"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? 'Copied' : 'Copy'}
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleOpenTopic({
                          id: todayContent.topic_id,
                          title: todayContent.topic_title || "Today's Topic",
                          difficulty_level: todayContent.difficulty_level || "Intermediate",
                          description: todayContent.content_text.slice(0, 120),
                        })}
                        className="text-xs h-7 px-3 font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-500/20 gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Learn with AI
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary/40 border border-border/50 rounded-2xl p-5 relative z-10 whitespace-pre-line text-xs sm:text-sm leading-relaxed font-mono overflow-x-auto shadow-inner">
                    {todayContent.content_text}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      Topic rotates automatically every calendar day
                    </span>
                    <button
                      type="button"
                      className="text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                      onClick={() => setIsCatalogOpen(true)}
                    >
                      Browse full catalog &rarr;
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Featured AI Tools */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Featured AI Tools
              </h2>
              <Button variant="link" className="text-purple-600 dark:text-purple-400 p-0 h-auto text-xs font-bold"
                onClick={() => navigate('/explore')}>
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="h-28 animate-pulse bg-secondary/30 rounded-2xl" />
                ))}
              </div>
            ) : featuredTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuredTools.slice(0, 6).map((tool: any, i: number) => (
                  <motion.div key={tool.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                    <Card className="glass-card hover:border-purple-400/50 transition-all rounded-2xl h-full flex flex-col justify-between p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 min-w-[2.75rem] min-h-[2.75rem] max-w-[2.75rem] max-h-[2.75rem] rounded-xl bg-white dark:bg-card border border-border/70 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                          {tool.logo_url ? (
                            <img
                              src={tool.logo_url}
                              alt={tool.name}
                              className="w-full h-full object-contain p-1.5"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.parentElement) {
                                  e.currentTarget.parentElement.className = 'w-11 h-11 min-w-[2.75rem] min-h-[2.75rem] max-w-[2.75rem] max-h-[2.75rem] rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-sm shrink-0';
                                  e.currentTarget.parentElement.innerText = tool.name.slice(0, 2).toUpperCase();
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-purple-500/15 flex items-center justify-center text-purple-600 dark:text-purple-400 font-black text-xs">
                              {tool.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-sm truncate">{tool.name}</h4>
                          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">{tool.category}</span>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{tool.description}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase">
                          {tool.pricing_type}
                        </span>
                        {tool.official_url && (
                          <a href={tool.official_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 hover:underline">
                            Website <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-2xl border border-dashed border-border/70 p-6">
                <p className="text-sm text-muted-foreground mb-3">No tools featured currently.</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/explore')}>
                  Browse Catalog
                </Button>
              </div>
            )}
          </motion.div>

          {/* Daily Learning Challenge (QuizWidget) */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Daily Learning Challenge
            </h2>
            <QuizWidget />
          </motion.div>
        </div>

        {/* RIGHT — Sidebar */}
        <div className="space-y-8">

          {/* Learn Today — Topics */}
          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card rounded-3xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Learn Today
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {data?.is_new_user ? '🌱 Curated Beginner Track' : 'Personalized & shuffled for you'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleShuffleTopics}
                    disabled={isShuffling}
                    className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 gap-1.5 transition-colors"
                    title="Shuffle today's recommended topics"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin text-purple-600' : ''}`} />
                    Shuffle
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-xl animate-pulse bg-secondary/30" />
                  ))
                ) : activeTopics.length > 0 ? activeTopics.map((topic: any, i: number) => (
                  <motion.div key={topic.id || i}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    onClick={() => handleOpenTopic(topic)}
                    className="flex items-start gap-3 p-3 rounded-2xl hover:bg-purple-500/10 cursor-pointer group transition-all border border-transparent hover:border-purple-300/40">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors mt-0.5 text-purple-600 dark:text-purple-400">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug">{topic.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 inline-block ${DIFFICULTY_COLORS[topic.difficulty_level] || 'bg-secondary'}`}>
                        {topic.difficulty_level}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
                  </motion.div>
                )) : (
                  <p className="text-xs text-muted-foreground text-center py-3">No topics available yet.</p>
                )}
                <div className="pt-2">
                  <Button variant="outline" className="w-full text-xs font-bold"
                    onClick={() => setIsCatalogOpen(true)}>
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Browse Topics Catalog
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card rounded-3xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Your Activity
                  </CardTitle>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-xl animate-pulse bg-secondary/30" />
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((act: any, i: number) => {
                    const config = ACTIVITY_CONFIG[act.action] || ACTIVITY_CONFIG.default
                    const Icon = config.icon
                    return (
                      <motion.div key={act.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.03 }}
                        className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-secondary/60 transition-colors border border-border/40 group">
                        <div className={`w-8 h-8 rounded-xl ${config.color} flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">
                              {config.label}
                            </span>
                            <time className="text-[10px] text-muted-foreground font-semibold shrink-0">
                              {formatRelativeTime(act.created_at)}
                            </time>
                          </div>
                          <p className="text-xs font-bold leading-snug text-foreground line-clamp-1 mt-0.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {formatActivityLabel(act)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <div className="text-center py-6">
                    <Play className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      No activity yet. Start exploring AI tools or studying topics!
                    </p>
                    <Button size="sm" className="mt-3" onClick={() => navigate('/explore')}>
                      Explore Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Chat Assistant */}
          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <ChatWidget />
          </motion.div>

        </div>
      </div>

      {/* Topic Detail Modal */}
      {selectedTopic && (
        <TopicModal
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
        />
      )}

      {/* All Topics Catalog Modal */}
      <AllTopicsModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectTopic={(t) => handleOpenTopic(t)}
      />
    </div>
  )
}
