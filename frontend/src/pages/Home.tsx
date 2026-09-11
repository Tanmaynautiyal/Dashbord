import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, TrendingUp, Brain, Zap, Code, Box, Cpu, Globe, Shield, Star, RefreshCw, CheckCircle } from 'lucide-react'
import { Button, Card, CardContent } from '../ui'
import { toolsService, type AITool } from '../services/toolsService'

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
}

const TECH_CARDS = [
  { name: 'AI Agents', desc: 'Autonomous AI systems that act on your behalf.', icon: Brain, color: 'from-violet-500 to-purple-700', badge: '🔥 Hot' },
  { name: 'LLMs', desc: 'Large language models powering next-gen apps.', icon: Cpu, color: 'from-purple-500 to-indigo-600', badge: '⚡ Trending' },
  { name: 'FastAPI', desc: 'High-performance Python APIs at lightning speed.', icon: Zap, color: 'from-emerald-400 to-teal-600', badge: '🚀 Rising' },
  { name: 'React', desc: 'The library for web and native user interfaces.', icon: Code, color: 'from-sky-400 to-blue-600', badge: '💎 Popular' },
  { name: 'Docker', desc: 'Package and deploy apps with ease.', icon: Box, color: 'from-indigo-400 to-purple-600', badge: '🔧 Essential' },
  { name: 'LangChain', desc: 'Build powerful LLM-powered applications.', icon: Globe, color: 'from-amber-400 to-orange-500', badge: '✨ New' },
  { name: 'Kubernetes', desc: 'Orchestrate containers at massive scale.', icon: Shield, color: 'from-blue-600 to-indigo-700', badge: '💡 Must-Know' },
  { name: 'MCP', desc: 'Model Context Protocol for AI tooling.', icon: Sparkles, color: 'from-pink-400 to-rose-600', badge: '🆕 New' },
]

const STATS = [
  { value: '200+', label: 'AI Tools Listed' },
  { value: '50+', label: 'Tech Stacks' },
  { value: '10K+', label: 'Developers Growing' },
  { value: 'Daily', label: 'Fresh Challenges' },
]

export default function Home() {
  const [tools, setTools] = React.useState<AITool[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    toolsService.list({ page_size: 6 })
      .then((res) => {
        if (!cancelled) setTools(res.items)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const CATEGORY_LABELS: Record<string, string> = {
    AI_CHATBOT: 'AI Chatbot',
    CODING_ASSISTANT: 'Coding Assistant',
    IMAGE_GENERATION: 'Image Generation',
    VIDEO_GENERATION: 'Video Generation',
    DEVELOPER_TOOL: 'Developer Tool',
    AI_AGENT: 'AI Agent',
  }

  const AVATAR_COLORS: Record<string, string> = {
    AI_CHATBOT: 'from-violet-500 to-purple-700',
    CODING_ASSISTANT: 'from-blue-500 to-indigo-700',
    IMAGE_GENERATION: 'from-pink-500 to-rose-600',
    VIDEO_GENERATION: 'from-amber-400 to-orange-500',
    DEVELOPER_TOOL: 'from-emerald-400 to-teal-600',
    AI_AGENT: 'from-fuchsia-500 to-violet-600',
  }

  return (
    <div className="flex flex-col items-center overflow-hidden">

      {/* ─── Hero Section ─── */}
      <section className="w-full relative flex flex-col items-center justify-center text-center px-4 pt-20 pb-28 min-h-[85vh]">
        {/* Animated background glowing orbs with vibrant purple */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-purple-500/20 rounded-full blur-[140px]"
          />
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] bg-indigo-500/20 rounded-full blur-[140px]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(139,92,246,0.18),rgba(255,255,255,0))]" />
          {/* Subtle geometric dot grid */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(124,58,237,0.1)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70" />
        </div>

        {/* Top Pill Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-300 mb-8 backdrop-blur-md shadow-sm shadow-purple-500/10"
        >
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
          The Modern Developer Platform & AI Hub
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight max-w-5xl mb-6 leading-[1.08]"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/95 to-foreground/75">
            Discover. Learn.
          </span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">
            Build. Grow.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed font-normal"
        >
          Stay ahead in modern engineering. Discover vetted AI tools, master emerging stacks,
          tackle daily quizzes, and accelerate your productivity — all in one curated hub.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto"
        >
          <Link to="/explore" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base font-bold shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 group">
              Explore 200+ Tools
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 text-base font-bold glass-card">
              Get Started Free
            </Button>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-4xl"
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="p-4 rounded-2xl border border-purple-500/15 bg-card/70 backdrop-blur-md shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all text-center"
            >
              <div className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600">
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-semibold">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── Trending Technologies ─── */}
      <section className="w-full py-20 px-4 container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            TRENDING IN TECH
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
            Technologies Developers Love
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            From autonomous AI agents to modern cloud frameworks — explore what’s shaping tomorrow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TECH_CARDS.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              <Card className="glass-card group h-full cursor-pointer overflow-hidden border border-border/70 hover:border-purple-400/50">
                <div className={`h-1.5 w-full bg-gradient-to-r ${tech.color}`} />
                <CardContent className="p-5 flex flex-col justify-between h-[calc(100%-6px)]">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <tech.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-bold bg-secondary/80 text-secondary-foreground px-2.5 py-1 rounded-full border border-border/60">
                        {tech.badge}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-lg mb-1.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {tech.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {tech.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                    Explore Stack <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Featured AI Tools ─── */}
      <section className="w-full py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                CURATED FOR BUILDERS
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2">
                Supercharge Your Stack
              </h2>
              <p className="text-muted-foreground max-w-lg text-sm sm:text-base">
                Discover tested AI tools verified by engineers to save hours each week.
              </p>
            </div>
            <Link to="/explore">
              <Button variant="outline" className="shrink-0 font-bold glass-card">
                View All Tools
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </motion.div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-60 animate-pulse bg-secondary/30 border-border/40 rounded-2xl" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive mb-4 text-sm font-semibold">Failed to load tools. Showing highlights.</p>
              <Button variant="outline" onClick={() => toolsService.list({ page_size: 6 }).then(r => setTools(r.items)).catch(() => {}).finally(() => setLoading(false))}>
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool, i) => {
                const color = AVATAR_COLORS[tool.category] || 'from-violet-600 to-purple-800'
                const initials = tool.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <Card className="glass-card group h-full border border-border/70 hover:border-purple-400/60 rounded-2xl flex flex-col justify-between">
                      <CardContent className="p-6 flex flex-col h-full justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 min-w-[3.5rem] min-h-[3.5rem] max-w-[3.5rem] max-h-[3.5rem] rounded-2xl bg-white dark:bg-card border border-border/70 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0 overflow-hidden">
                                {tool.logo_url ? (
                                  <img
                                    src={tool.logo_url}
                                    alt={tool.name}
                                    className="w-full h-full object-contain p-2 rounded-2xl"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.parentElement) {
                                        e.currentTarget.parentElement.className = `w-14 h-14 min-w-[3.5rem] min-h-[3.5rem] max-w-[3.5rem] max-h-[3.5rem] rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0`;
                                        e.currentTarget.parentElement.innerText = initials;
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-sm`}>
                                    {initials}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-extrabold text-base sm:text-lg leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {tool.name}
                                </h3>
                                <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                                  {CATEGORY_LABELS[tool.category] || tool.category}
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full capitalize font-bold border border-border/50">
                              {tool.pricing_type}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-5">
                            {tool.description}
                          </p>
                        </div>
                        <Link to="/explore">
                          <Button variant="outline" className="w-full font-bold group-hover:border-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            Explore Tool
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Why Use This Platform ─── */}
      <section className="w-full py-20 px-4 container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/8 via-background to-indigo-500/8 p-10 md:p-16 text-center backdrop-blur-md shadow-xl"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-card px-3.5 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 mb-4 shadow-sm">
            DEVPRODUCTIVITY ADVANTAGE
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
            Everything A Developer Needs To Grow
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-12 text-sm sm:text-base">
            One platform to find top tools, master skills with quizzes, and monitor learning.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { icon: '🚀', title: 'Discover & Bookmark', desc: 'Browse hundreds of AI tools, filter by category and pricing, and bookmark favorites.' },
              { icon: '🧠', title: 'Interactive AI Assistant', desc: 'Ask questions, test tools, and get code examples directly with the integrated AI companion.' },
              { icon: '🎯', title: 'Daily Quizzes & Streaks', desc: 'Sharpen your tech skills daily with 10-question challenges and track your streak.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col items-start p-6 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md hover:border-purple-400/50 transition-all shadow-sm hover:shadow-md"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-extrabold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Call to Action Banner ─── */}
      <section className="w-full py-16 px-4 mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="container mx-auto relative rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
          <div className="relative z-10 py-16 px-6 md:px-16 text-center text-white">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3">
              Start Leveling Up Today
            </h2>
            <p className="text-white/90 text-sm sm:text-base mb-8 max-w-xl mx-auto">
              Join developers discovering AI tools, mastering programming, and building faster.
            </p>
            <Link to="/register">
              <Button size="lg" className="h-13 px-9 text-base font-bold bg-white text-purple-700 hover:bg-white/90 shadow-2xl hover:scale-105 transition-all">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  )
}
