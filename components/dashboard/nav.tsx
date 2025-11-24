'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  BookOpen, 
  Settings, 
  Users, 
  BarChart3,
  Menu,
  Code
} from 'lucide-react'
import { useState } from 'react'

const studentNavItems = [
  { href: '/dashboard', label: 'Обзор', icon: Home },
  { href: '/dashboard/modules', label: 'Модули', icon: BookOpen },
  { href: '/dashboard/practice', label: 'Практика', icon: Code },
  { href: '/dashboard/profile', label: 'Профиль', icon: Settings },
]

const adminNavItems = [
  { href: '/dashboard', label: 'Обзор', icon: Home },
  { href: '/dashboard/modules', label: 'Модули', icon: BookOpen },
  { href: '/dashboard/admin', label: 'Админ-панель', icon: BarChart3 },
  { href: '/dashboard/users', label: 'Пользователи', icon: Users },
  { href: '/dashboard/profile', label: 'Профиль', icon: Settings },
]

interface DashboardNavProps {
  role?: string
  mobile?: boolean
}

export function DashboardNav({ role, mobile = false }: DashboardNavProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  const navItems = role === 'admin' ? adminNavItems : studentNavItems

  const NavContent = () => (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => mobile && setIsMobileOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  if (mobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2"
          aria-label="Меню"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {isMobileOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/20" 
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="absolute right-0 top-12 z-50 w-48 rounded-md border bg-white p-4 shadow-lg">
              <NavContent />
            </div>
          </>
        )}
      </>
    )
  }

  return <NavContent />
}