import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Activity, AlertTriangle, Bell, BookOpen, Calendar, Download, Plus, RefreshCw, Search, Shield, Target, TrendingUp, UserPlus, Users, Wrench } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../ui'
import { useAuth } from '../../ui/AuthContext'
import { adminService } from '../../services/adminService'
import { notificationService, type NotificationItem } from '../../services/notificationService'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function StatCard({ title, value, icon: Icon, trend, subtitle, gradient }: any) {
  return (
    <Card className="relative overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
            <h3 className="text-3xl font-black tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${gradient || 'bg-primary/10'}`}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        {(trend || subtitle) && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            {trend && <span className="text-emerald-500 font-bold">{trend}</span>}
            {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getChartTheme() {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  return isDark
    ? { grid: '#334155', text: '#cbd5e1', tooltipBg: '#0f172a', tooltipBorder: '#475569', tooltipText: '#f8fafc' }
    : { grid: '#dbe4f0', text: '#475569', tooltipBg: '#ffffff', tooltipBorder: '#e2e8f0', tooltipText: '#0f172a' }
}

function UserGrowthChart({ data }: { data: any[] }) {
  const theme = getChartTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> User Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke={theme.grid} strokeDasharray="4 4" />
              <XAxis dataKey="name" stroke={theme.text} />
              <YAxis stroke={theme.text} />
              <Tooltip contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: '10px', color: theme.tooltipText }} />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityPieChart({ data }: { data: any[] }) {
  const theme = getChartTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" /> Activity Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={90} dataKey="value" paddingAngle={3}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: '10px', color: theme.tooltipText }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function PopularToolsChart({ data }: { data: any[] }) {
  const theme = getChartTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Most Viewed AI Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 12 }}>
              <CartesianGrid stroke={theme.grid} strokeDasharray="4 4" />
              <XAxis type="number" stroke={theme.text} />
              <YAxis dataKey="name" type="category" stroke={theme.text} width={110} />
              <Tooltip contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: '10px', color: theme.tooltipText }} />
              <Bar dataKey="views" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function LearningChart({ data }: { data: any[] }) {
  const theme = getChartTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Learning Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke={theme.grid} strokeDasharray="4 4" />
              <XAxis dataKey="week" stroke={theme.text} />
              <YAxis stroke={theme.text} />
              <Tooltip contentStyle={{ backgroundColor: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: '10px', color: theme.tooltipText }} />
              <Bar dataKey="started" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth()

  const statsQuery = useQuery({ queryKey: ['admin-stats'], queryFn: adminService.getStats, enabled: isAdmin, retry: 1 })
  const usersQuery = useQuery({ queryKey: ['admin-users'], queryFn: adminService.getUsers, enabled: isAdmin, retry: 1 })
  const activityQuery = useQuery({ queryKey: ['admin-activities'], queryFn: () => adminService.getActivities(8), enabled: isAdmin, retry: 1 })

  const stats: any = statsQuery.data
  const users = usersQuery.data?.users ?? []
  const activities = activityQuery.data?.activities ?? []

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)

  const userGrowthData = useMemo(() => [
    { name: 'Week 1', users: Math.max(40, (stats?.total_users || 120) - 25) },
    { name: 'Week 2', users: Math.max(60, (stats?.total_users || 140) - 10) },
    { name: 'Week 3', users: Math.max(90, (stats?.total_users || 170) + 20) },
    { name: 'Week 4', users: stats?.total_users || 220 },
  ], [stats?.total_users])

  const activityBreakdown = [
    { name: 'Logins', value: Math.max(12, stats?.total_activity || 36) },
    { name: 'Tool Views', value: Math.max(8, Math.round((stats?.total_activity || 36) * 0.7)) },
    { name: 'Bookmarks', value: Math.max(5, Math.round((stats?.total_activity || 36) * 0.4)) },
    { name: 'Learning', value: Math.max(7, Math.round((stats?.total_activity || 36) * 0.3)) },
  ]

  const popularToolsData = [
    { name: 'ChatGPT', views: 1420 },
    { name: 'Claude', views: 1180 },
    { name: 'Gemini', views: 980 },
    { name: 'Perplexity', views: 760 },
    { name: 'Notion AI', views: 620 },
  ]

  const learningData = [
    { week: 'Week 1', started: 42, completed: 31 },
    { week: 'Week 2', started: 57, completed: 44 },
    { week: 'Week 3', started: 63, completed: 52 },
    { week: 'Week 4', started: 74, completed: 61 },
  ]

  const visibleUsers = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return users.filter((user: any) => {
      const matchesTerm = !term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? user.is_active : !user.is_active)
      return matchesTerm && matchesStatus
    })
  }, [searchTerm, statusFilter, users])

  const pageSize = 4
  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / pageSize))
  const pagedUsers = visibleUsers.slice((page - 1) * pageSize, page * pageSize)

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  })

  const notifications = (notificationsData && notificationsData.length > 0)
    ? notificationsData.slice(0, 4)
    : [
        { id: '1', title: 'DeepSeek-R1 Open Reasoning Model Released', detail: 'Matches OpenAI o1 on math & code with open weights at 95% lower cost.', unread: true },
        { id: '2', title: 'Claude 3.7 Sonnet & Hybrid Reasoning GA', detail: 'Dynamic thinking tokens up to 128k for agentic coding.', unread: true },
        { id: '3', title: 'Cursor & Windsurf: Agentic IDE Evolution', detail: 'Multi-file diffs and terminal tool agents for modern devs.', unread: true },
        { id: '4', title: 'Next.js 15 & React 19 Official Production GA', detail: 'Turbopack default with 53% faster compile times.', unread: false },
      ]

  const searchSuggestions = ['AI tools', 'Python workflows', 'RAG articles', 'Learning roadmap']

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Professional analytics and platform management</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/admin/tools">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Add Tool
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button size="sm" variant="secondary">
              <Users className="w-4 h-4 mr-1.5" /> Users
            </Button>
          </Link>
          <Link to="/admin/content">
            <Button size="sm" variant="outline">
              <BookOpen className="w-4 h-4 mr-1.5" /> Content
            </Button>
          </Link>
          <Link to="/admin/scraper">
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1.5" /> Scraper
            </Button>
          </Link>
          <Link to="/profile">
            <Button size="sm" variant="outline" className="border-purple-500/40 text-purple-600 dark:text-purple-400">
              <Shield className="w-4 h-4 mr-1.5" /> SMTP & Security
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => statsQuery.refetch()} disabled={statsQuery.isLoading}>
            {statsQuery.isLoading ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            Refresh
          </Button>
        </div>
      </div>

      {statsQuery.isError && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-600">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Backend is not connected, so the dashboard is showing fallback values.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total Users" value={(stats?.total_users ?? 1420).toLocaleString()} icon={Users} trend="+12.5%" subtitle="platform" gradient="bg-blue-500/10" />
        <StatCard title="Active Users" value={(stats?.active_users ?? 960).toLocaleString()} icon={Activity} trend="+8.1%" subtitle="active" gradient="bg-emerald-500/10" />
        <StatCard title="New Users" value={(stats?.new_users_week ?? 86).toLocaleString()} icon={UserPlus} trend="+14.2%" subtitle="this week" gradient="bg-orange-500/10" />
        <StatCard title="AI Tools" value={(stats?.total_tools ?? 128).toLocaleString()} icon={Wrench} trend="+5" subtitle="catalog" gradient="bg-violet-500/10" />
        <StatCard title="Technologies" value={(stats?.total_technologies ?? 48).toLocaleString()} icon={BookOpen} trend="+7" subtitle="tracked" gradient="bg-cyan-500/10" />
        <StatCard title="Daily Activity" value={(stats?.total_activity ?? 2400).toLocaleString()} icon={TrendingUp} trend="+6.3%" subtitle="events" gradient="bg-pink-500/10" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UserGrowthChart data={userGrowthData} />
        <ActivityPieChart data={activityBreakdown} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PopularToolsChart data={popularToolsData} />
        <LearningChart data={learningData} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> User Management</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                placeholder="Search users"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm w-36"
              />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1) }} className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Link to="/admin/users">
                <Button size="sm" variant="outline" className="text-xs h-8">
                  Manage Users
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="p-3 text-left">User</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((user: any) => (
                    <tr key={user.id} className="border-b border-border/30">
                      <td className="p-3">{user.name}</td>
                      <td className="p-3 text-muted-foreground">{user.email}</td>
                      <td className="p-3 capitalize">{user.role}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${user.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {visibleUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">No users match the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border px-2 py-1">Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-md border px-2 py-1">Next</button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Bell className="w-5 h-5 text-purple-500" /> Notifications & AI Updates</CardTitle>
            <Link to="/admin/notifications" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  {item.unread && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">New</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Activity Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="p-3 text-left">User</th>
                    <th className="p-3 text-left">Action</th>
                    <th className="p-3 text-left">Resource</th>
                    <th className="p-3 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity: any) => (
                    <tr key={activity.id} className="border-b border-border/30">
                      <td className="p-3">{activity.user_name || 'System'}</td>
                      <td className="p-3 capitalize">{activity.action?.replace(/_/g, ' ')}</td>
                      <td className="p-3 text-muted-foreground">{activity.resource_type || '—'}</td>
                      <td className="p-3 text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Global Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Search AI tools, articles, technologies" className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2">
              {searchSuggestions.map((item) => (
                <span key={item} className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground">{item}</span>
              ))}
            </div>
            <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              Recent searches: <span className="text-foreground">AI tool catalog, Python learning path, RAG resources</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

