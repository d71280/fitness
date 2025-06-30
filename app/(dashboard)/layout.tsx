'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/sidebar'
import AdminHeader from '@/components/admin/header'
import AuthGuard from '@/components/auth/auth-guard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="lg:pl-64">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
          
          <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl w-full mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}