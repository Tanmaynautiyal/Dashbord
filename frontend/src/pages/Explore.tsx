import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Filter, Star, ExternalLink, Bookmark, BookmarkCheck,
  Bot, Code, Loader2, AlertTriangle, RefreshCw, X, Tag, DollarSign,
  Sparkles, Compass
} from 'lucide-react'
import { Input, Button, Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui'
import { toolsService, type AITool } from '../services/toolsService'
import { useAuth } from '../ui/AuthContext'
import ChatWidget from '../components/ChatWidget'

const CATEGORIES = ['All', 'AI Chatbot', 'Coding Assistant', 'Image Generation', 'Video Generation', 'Developer Tool', 'AI Agent']
const CATEGORY_LABELS: Record<string, string> = {
  'AI Chatbot': 'AI Chatbots',
  'Coding Assistant': 'Coding Assistants',
  'Image Generation': 'Image Generation',
  'Video Generation': 'Video Generation',
  'Developer Tool': 'Developer Tools',
  'AI Agent': 'AI Agents',
}

const FALLBACK_TOOLS = [
  { id: '1', name: 'ChatGPT', slug: 'chatgpt', category: 'chatbot', pricing_type: 'freemium', description: "OpenAI's conversational AI assistant capable of writing code, explaining concepts, and answering complex questions.", official_url: 'https://chat.openai.com', logo_url: null, is_featured: true, is_active: true, created_at: '' },
  { id: '2', name: 'Cursor', slug: 'cursor', category: 'coding_assistant', pricing_type: 'freemium', description: 'AI-first code editor built on VS Code with deep context awareness and multi-file editing powered by GPT-4.', official_url: 'https://cursor.sh', logo_url: null, is_featured: true, is_active: true, created_at: '' },
  { id: '3', name: 'GitHub Copilot', slug: 'copilot', category: 'coding_assistant', pricing_type: 'paid', description: 'AI pair programmer that suggests code completions inside your editor, supporting dozens of languages.', official_url: 'https://github.com/features/copilot', logo_url: null, is_featured: false, is_active: true, created_at: '' },
  { id: '4', name: 'Claude', slug: 'claude', category: 'chatbot', pricing_type: 'freemium', description: "Anthropic's intelligent assistant with advanced reasoning, coding abilities, and long context understanding.", official_url: 'https://claude.ai', logo_url: null, is_featured: true, is_active: true, created_at: '' },
  { id: '5', name: 'v0 by Vercel', slug: 'v0', category: 'developer_tool', pricing_type: 'freemium', description: 'Generate full React UI from simple text descriptions instantly, powered by AI.', official_url: 'https://v0.dev', logo_url: null, is_featured: false, is_active: true, created_at: '' },
  { id: '6', name: 'Perplexity AI', slug: 'perplexity', category: 'chatbot', pricing_type: 'freemium', description: 'AI answer engine with real-time web search and cited responses for research and discovery.', official_url: 'https://perplexity.ai', logo_url: null, is_featured: false, is_active: true, created_at: '' },
]

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

/* ─── Toast notification ─────────────────────────────────────────────────── */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2.5 border border-white/20"
    >
      <BookmarkCheck className="w-4 h-4 text-purple-400" />
      {message}
    </motion.div>
  )
}

function ToolModal({ tool, bookmarked, onToggleBookmark, onClose }: {
  tool: AITool
  bookmarked: boolean
  onToggleBookmark: () => void
  onClose: () => void
}) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      onClose()
      navigate('/login')
    }
  }, [isAuthenticated, navigate, onClose])

  const color = AVATAR_COLORS[tool.category] || 'from-violet-600 to-purple-800'
  const initials = tool.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const autoQuery = `Give me a quick overview of "${tool.name}" as a developer tool: what it does, main features, and when to use it.`

  return (
    <AnimatePresence>
      <motion.div
        className="widget-fullscreen-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="w-full max-w-2xl h-[88vh] flex flex-col"
          initial={{ scale: 0.92, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 25 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          <Card className="border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col h-full rounded-3xl bg-card">

            {/* Header */}
            <div className="relative bg-gradient-to-br from-purple-500/12 via-purple-500/5 to-transparent p-6 border-b border-border/60 shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full pointer-events-none" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 pr-10">
                <div className="w-14 h-14 min-w-[3.5rem] min-h-[3.5rem] max-w-[3.5rem] max-h-[3.5rem] rounded-2xl bg-white dark:bg-card border border-border/70 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0 overflow-hidden">
                  {tool.logo_url && !imgError ? (
                    <img
                      src={tool.logo_url}
                      alt={tool.name}
                      onError={() => setImgError(true)}
                      className="w-full h-full object-contain p-2 rounded-2xl"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-base`}>
                      {initials}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black">{tool.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tool.description}</p>
                </div>
              </div>

              {/* Action Row */}
              <div className="flex items-center gap-2.5 mt-5">
                <span className={`text-xs px-3 py-1 rounded-full font-bold capitalize ${PRICING_COLORS[tool.pricing_type] || 'bg-secondary'}`}>
                  {tool.pricing_type}
                </span>
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-secondary/90 text-secondary-foreground">
                  {CATEGORY_LABELS[tool.category] || tool.category}
                </span>
                <div className="flex-1" />
                <button
                  onClick={onToggleBookmark}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    bookmarked
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400'
                      : 'hover:bg-secondary border-border/70 text-muted-foreground hover:text-purple-600'
                  }`}
                  title={bookmarked ? 'Remove bookmark' : 'Bookmark this tool'}
                >
                  {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
                {tool.official_url && (
                  <a href={tool.official_url} target="_blank" rel="noopener noreferrer">
                    <button
                      className="p-2.5 rounded-xl border border-border/70 hover:bg-secondary text-muted-foreground hover:text-purple-600 transition-all cursor-pointer"
                      title="Open Official Website"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </a>
                )}
              </div>
            </div>

            {/* Embedded AI Chat about this tool */}
            <div className="flex-1 min-h-0">
              <ChatWidget initialQuery={autoQuery} embedded={true} heightClass="h-full" />
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Tool Card ──────────────────────────────────────────────────────────── */
function ToolCard({
  tool,
  index,
  bookmarked,
  onBookmark,
  onViewDetails,
}: {
  tool: AITool
  index: number
  bookmarked: boolean
  onBookmark: () => void
  onViewDetails: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const color = AVATAR_COLORS[tool.category] || 'from-violet-600 to-purple-800'
  const initials = tool.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="glass-card group flex flex-col h-full border border-border/70 hover:border-purple-400/60 rounded-3xl overflow-hidden justify-between">
        <div>
          <div className={`h-1.5 w-full bg-gradient-to-r ${color}`} />
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 min-w-[3.5rem] min-h-[3.5rem] max-w-[3.5rem] max-h-[3.5rem] rounded-2xl bg-white dark:bg-card border border-border/70 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0 overflow-hidden">
                {tool.logo_url && !imgError ? (
                  <img
                    src={tool.logo_url}
                    alt={tool.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-contain p-2 rounded-2xl"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-sm`}>
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-black text-foreground">4.8</span>
                </div>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full capitalize font-bold ${PRICING_COLORS[tool.pricing_type] || 'bg-secondary'}`}>
                  {tool.pricing_type}
                </span>
              </div>
            </div>
            <CardTitle className="text-base sm:text-lg leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors font-extrabold">
              {tool.name}
            </CardTitle>
            <CardDescription className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mt-1">
              {CATEGORY_LABELS[tool.category] || tool.category}
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-4">
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {tool.description}
            </p>
          </CardContent>
        </div>

        <CardFooter className="gap-2 pt-3 border-t border-border/50">
          <Button
            variant="secondary"
            className="flex-1 text-xs sm:text-sm font-bold group-hover:bg-purple-500/10 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
            onClick={onViewDetails}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`shrink-0 rounded-xl transition-all ${
              bookmarked
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400'
                : 'hover:text-purple-600 hover:border-purple-400/50'
            }`}
            title={bookmarked ? 'Bookmarked!' : 'Save to Library'}
            onClick={onBookmark}
          >
            {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </Button>
          {tool.official_url && (
            <a href={tool.official_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="shrink-0 rounded-xl hover:text-purple-600 hover:border-purple-400/50" title="Open Official Site">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default function Explore() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Local storage bookmarks
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('bookmarked_tools')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch {
      return new Set()
    }
  })

  // Category query mapping
  const categoryParam = activeCategory === 'All' ? undefined : activeCategory

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['tools', categoryParam, search],
    queryFn: () => toolsService.list({ category: categoryParam, search: search || undefined, page_size: 30 }),
    staleTime: 60_000,
  })

  const tools: AITool[] = data?.items ?? (isError ? FALLBACK_TOOLS as any : [])
  const usingFallback = isError

  const handleViewDetails = (tool: AITool) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setSelectedTool(tool)
  }

  const toggleBookmark = (toolId: string, toolName: string) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(toolId)) {
        next.delete(toolId)
        setToast(`Removed "${toolName}" from bookmarks`)
      } else {
        next.add(toolId)
        setToast(`"${toolName}" bookmarked!`)
      }
      localStorage.setItem('bookmarked_tools', JSON.stringify([...next]))
      return next
    })
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-10 space-y-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">
            <Compass className="w-3.5 h-3.5" /> EXPLORE CATALOG
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Tools & Technologies
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">Discover top-tier AI software curated for high-velocity developers.</p>
        </div>

        <div className="relative flex items-center w-full md:w-88">
          <Search className="absolute left-4 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 200+ tools by name or stack..."
            className="pl-11 h-12 rounded-2xl bg-card border border-border/80 focus:border-purple-500 focus-visible:ring-purple-500/20 shadow-sm text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold">✕</button>
          )}
        </div>
      </motion.div>

      {/* Bookmarks summary */}
      {bookmarks.size > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-bold bg-purple-500/10 px-4 py-2 rounded-xl w-fit border border-purple-500/20">
          <BookmarkCheck className="w-4 h-4" />
          {bookmarks.size} tool{bookmarks.size > 1 ? 's' : ''} saved in your library
        </motion.div>
      )}

      {/* API fallback notice */}
      {usingFallback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-xs sm:text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Backend not connected — showing demo tools.
          <button onClick={() => refetch()} className="ml-auto flex items-center gap-1 hover:underline font-bold">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </motion.div>
      )}

      {/* Category Pills */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="flex items-center gap-2 overflow-x-auto pb-2 custom-scroll">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0 ml-1" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 border transition-all duration-200 cursor-pointer
              ${activeCategory === cat
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white border-transparent shadow-md shadow-purple-500/30'
                : 'bg-card/70 text-muted-foreground border-border/70 hover:bg-secondary hover:text-foreground hover:border-purple-300'
              }`}>
            {cat === 'All' ? 'All Categories' : (CATEGORY_LABELS[cat] || cat)}
          </button>
        ))}
      </motion.div>

      {/* Results Count */}
      <div className="text-xs sm:text-sm text-muted-foreground font-semibold">
        {isLoading ? 'Searching catalog...' : `${tools.length} tool${tools.length === 1 ? '' : 's'} found${data?.total && data.total > tools.length ? ` (${data.total} total)` : ''}`}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-60 animate-pulse bg-secondary/30 border-border/40 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <AnimatePresence mode="popLayout">
          {tools.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 text-muted-foreground">
              <Bot className="w-16 h-16 mx-auto mb-4 opacity-30 text-purple-500" />
              <h3 className="text-xl font-bold mb-1 text-foreground">No tools found</h3>
              <p className="text-xs sm:text-sm">Try searching for a different keyword or select another category.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool, i) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  index={i}
                  bookmarked={bookmarks.has(tool.id)}
                  onBookmark={() => toggleBookmark(tool.id, tool.name)}
                  onViewDetails={() => handleViewDetails(tool)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Tool Detail Modal */}
      {selectedTool && (
        <ToolModal
          tool={selectedTool}
          bookmarked={bookmarks.has(selectedTool.id)}
          onToggleBookmark={() => toggleBookmark(selectedTool.id, selectedTool.name)}
          onClose={() => setSelectedTool(null)}
        />
      )}

      {/* Toast notification */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  )
}
