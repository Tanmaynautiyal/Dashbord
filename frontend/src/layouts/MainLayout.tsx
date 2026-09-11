import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import Navbar from '../ui/Navbar'
import { Sparkles, Heart } from 'lucide-react'

export default function MainLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-page">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 bg-card/60 backdrop-blur-md py-10">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-purple-500/30">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-foreground">
              DevProductivity
            </span>
            <span className="text-xs text-muted-foreground">
              — The modern developer hub
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <Link to="/explore" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Explore Tools
            </Link>
            <Link to="/dashboard" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Dashboard
            </Link>
            <Link to="/profile" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Profile
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
            <span>for developers worldwide</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
