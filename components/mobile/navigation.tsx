'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Bell,
  User,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/dashboard/courses', label: 'Cursos', icon: BookOpen },
  { href: '/dashboard/grades', label: 'Calificaciones', icon: BarChart3 },
  { href: '/dashboard/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/dashboard/profile', label: 'Perfil', icon: User },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Footer bar para móviles */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-around">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden xs:inline">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

    </>
  )
}
