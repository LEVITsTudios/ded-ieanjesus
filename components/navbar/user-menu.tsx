'use client'

import { useState, useEffect } from 'react'
import { Bell, LogOut, Settings, User, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function NavbarUser() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initUser = async () => {
      const supabase = await createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
        fetchUnreadNotifications()
      }
      setLoading(false)
    }
    initUser()
  }, [])

  const fetchUnreadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const { notifications } = await res.json()
        const unread = notifications?.filter((n: any) => !n.is_read).length || 0
        setUnreadNotifications(unread)
      }
    } catch (e) {
      console.error('Error fetching notifications', e)
    }
  }

  const handleLogout = async () => {
    const supabase = await createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading || !user) return null

  const initials = user.email?.substring(0, 2).toUpperCase() || '?'

  return (
    <div className="flex items-center gap-4">
      {/* Notifications Bell */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => router.push('/dashboard/notifications')}
      >
        <Bell className="h-5 w-5" />
        {unreadNotifications > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadNotifications}
          </span>
        )}
      </Button>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium text-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {user.user_metadata?.role || 'Usuario'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard/security')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Seguridad</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
