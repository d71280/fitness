'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  Settings,
  Activity,
  Dumbbell,
  Home
} from 'lucide-react'

const navigation = [
  {
    name: 'ダッシュボード',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'スケジュール管理',
    href: '/dashboard/schedule',
    icon: Calendar
  },
  {
    name: '予約・顧客管理',
    href: '/dashboard/reservations',
    icon: UserCheck
  },
  {
    name: 'プログラム・インストラクター管理',
    href: '/dashboard/programs',
    icon: Activity
  },
  {
    name: '設定',
    href: '/dashboard/settings',
    icon: Settings
  }
]

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <div className={`flex flex-col w-64 bg-white shadow-lg fixed h-full z-50 transform transition-transform lg:relative lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:block`}>
      {/* ロゴ */}
      <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
        <Link href="/dashboard" className="text-white font-bold text-lg">
          Studio Admin
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* 公開サイトへのリンク */}
      <div className="p-4 border-t">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Home className="h-5 w-5" />
          公開サイトへ
        </Link>
      </div>
    </div>
  )
}