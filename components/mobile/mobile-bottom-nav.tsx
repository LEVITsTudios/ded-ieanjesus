// components/mobile/mobile-bottom-nav.tsx - Bottom navigation para móvil
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Bell,
} from 'lucide-react'

const navigationItems = [
  {
    title: 'Inicio',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Cursos',
    href: '/dashboard/courses',
    icon: BookOpen,
  },
  {
    title: 'Horarios',
    href: '/dashboard/schedules',
    icon: Calendar,
  },
  {
    title: 'Asistencia',
    href: '/dashboard/attendance',
    icon: ClipboardCheck,
  },
  {
    title: 'Alertas',
    href: '/dashboard/notifications',
    icon: Bell,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border/50 bg-card/95 backdrop-blur-xl z-40">
      <div className="flex items-center justify-around">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary border-t-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="hidden xs:inline">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
