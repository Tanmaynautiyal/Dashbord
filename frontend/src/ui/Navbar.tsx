import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  Bookmark,
  Shield,
  Compass,
  Sparkles,
  ChevronDown,
  Bell
} from "lucide-react";
import { Button } from "./index";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setUserMenuOpen(false);
  };

  const navLinks = [
    { name: "Explore Tools", path: "/explore", icon: Compass },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ...(isAdmin ? [{ name: "Admin", path: "/admin", icon: Shield }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 glass transition-all">
      <div className="container mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <motion.div
            whileHover={{ scale: 1.06, rotate: 4 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-lg leading-tight bg-gradient-to-r from-foreground via-foreground to-purple-700 dark:to-purple-300 bg-clip-text text-transparent">
              DevProductivity
            </span>
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 tracking-wider uppercase">
              Developer Hub
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1.5 bg-secondary/40 p-1 rounded-2xl border border-border/40 backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== "/" && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5
                  ${
                    isActive
                      ? "bg-white dark:bg-card text-purple-600 dark:text-purple-300 shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-card/50"
                  }`}
              >
                <link.icon className="w-3.5 h-3.5" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-xl hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors"
            title="AI Tools & Tech Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-background animate-pulse" />
          </Link>

          {/* Theme Switcher */}
          <Button
            variant="ghost"
            size="icon"
            className="relative w-9 h-9 rounded-xl hover:bg-secondary/70 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-purple-400" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl hover:bg-secondary/70 border border-transparent hover:border-purple-200 dark:hover:border-purple-800/50 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-purple-500/20">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold max-w-[110px] truncate leading-tight">
                    {user?.name?.split(" ")[0] || "User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {isAdmin ? "Admin" : "Member"}
                  </span>
                </div>
                <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-xl shadow-purple-500/10 overflow-hidden z-50 p-1.5"
                  >
                    <div className="px-3 py-2.5 mb-1 rounded-xl bg-secondary/50 border border-border/30">
                      <p className="text-xs font-bold truncate text-foreground">{user?.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {user?.email}
                      </p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400">
                          Administrator
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-0.5">
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-purple-500" />
                        Dashboard
                      </Link>
                      <Link
                        to="/notifications"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors"
                      >
                        <Bell className="w-4 h-4 text-purple-500" />
                        Notifications
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors"
                      >
                        <User className="w-4 h-4 text-purple-500" />
                        Profile
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-purple-500" />
                        My Bookmarks
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                    </div>

                    <div className="mt-1 pt-1 border-t border-border/40">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-semibold">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden w-9 h-9 rounded-xl"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t border-border/60 bg-card/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1.5">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 flex items-center gap-2.5 transition-colors"
                >
                  <link.icon className="w-4 h-4 text-purple-500" />
                  {link.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="flex gap-2.5 pt-3 mt-1 border-t border-border/40">
                  <Link
                    to="/login"
                    className="flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button variant="outline" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
