import React from 'react'
import { Link } from 'react-router-dom'

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  return (
    <aside className={`w-64 ${className}`}>
      <div className="p-4 space-y-3">
        <div className="text-xs text-muted uppercase">Main</div>
        <nav className="flex flex-col space-y-1">
          <Link to="/dashboard" className="px-3 py-2 rounded-md hover:bg-white/5">Dashboard</Link>
          <Link to="/explore" className="px-3 py-2 rounded-md hover:bg-white/5">Explore</Link>
        </nav>
        <div className="pt-4 text-xs text-muted uppercase">Tools</div>
        <nav className="flex flex-col space-y-1">
          <Link to="#" className="px-3 py-2 rounded-md hover:bg-white/5">All Tools</Link>
          <Link to="#" className="px-3 py-2 rounded-md hover:bg-white/5">Bookmarks</Link>
        </nav>
      </div>
    </aside>
  )
}
