'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  ScrollText,
  Settings,
  UserCircle,
  Radio,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',               label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/dashboard/menus',         label: 'จัดการเมนู',     icon: MessageSquare },
  { href: '/dashboard/notifications', label: 'การแจ้งเตือน',   icon: Bell },
  { href: '/dashboard/broadcast',     label: 'Broadcast',      icon: Radio },
  { href: '/dashboard/customers',     label: 'ข้อมูลลูกค้า',   icon: UserCircle },
  { href: '/dashboard/logs',          label: 'ประวัติ Log',     icon: ScrollText },
  { href: '/dashboard/settings',      label: 'ตั้งค่า',         icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="bg-line p-1.5 rounded-lg">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">LINE Bot Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-green-50 text-line'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-muted-foreground text-center">LINE Chatbot Admin v1.0</p>
      </div>
    </aside>
  )
}
