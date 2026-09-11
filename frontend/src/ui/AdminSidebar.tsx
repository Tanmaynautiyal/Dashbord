import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Users, Wrench, Bell, Search, Activity, Download, Shield, ArrowLeft } from 'lucide-react'
import { useAuth } from './AuthContext'

export default function AdminSidebar() {
  const { user } = useAuth()

  const links = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'AI Tools', path: '/admin/tools', icon: Wrench },
    { name: 'Content', path: '/admin/content', icon: LayoutDashboard },
    { name: 'Activity', path: '/admin/activities', icon: Activity },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Search', path: '/admin/search', icon: Search },
    { name: 'Scraper', path: '/admin/scraper', icon: Download },
  ]

  return (
    <aside className="w-64 bg-card text-card-foreground h-screen border-r sticky top-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-sm">
            AD
          </div>
          <div>
            <div className="font-bold tracking-tight">Admin Panel</div>
            <div className="text-xs text-muted-foreground">DevProductivity</div>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`
              }
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-border/50 space-y-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to User Dashboard</span>
        </Link>

        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium shrink-0">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name || 'System Admin'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@mail.com'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
