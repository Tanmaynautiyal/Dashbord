import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Explore from './pages/Explore'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import AdminLayout from './layouts/AdminLayout'
import AdminOverview from './pages/admin/Overview'
import AdminUsers from './pages/admin/Users'
import AdminTools from './pages/admin/Tools'
import AdminActivities from './pages/admin/Activities'
import AdminContentManagement from './pages/admin/ContentManagement'
import AdminNotifications from './pages/admin/Notifications'
import AdminSearch from './pages/admin/Search'
import AdminScraper from './pages/admin/Scraper'
import { useAuth } from './ui/AuthContext'

function RequireAdmin({ children }: { children: React.JSX.Element }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function RequireAuth({ children }: { children: React.JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="explore" element={<Explore />} />
        <Route path="dashboard" element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        } />
        <Route path="notifications" element={
          <RequireAuth>
            <AdminNotifications />
          </RequireAuth>
        } />
        <Route path="profile" element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        } />
      </Route>

      <Route path="/admin" element={
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      }>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="tools" element={<AdminTools />} />
        <Route path="activities" element={<AdminActivities />} />
        <Route path="content" element={<AdminContentManagement />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="search" element={<AdminSearch />} />
        <Route path="scraper" element={<AdminScraper />} />
      </Route>
    </Routes>
  )
}
