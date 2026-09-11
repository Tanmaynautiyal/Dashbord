import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../ui/AdminSidebar'

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-bg">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
