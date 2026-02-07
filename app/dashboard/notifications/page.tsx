'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'


interface Reminder {
  id: string
  title: string
  message?: string
  reminder_type: string
  scheduled_for: string
  is_sent: boolean
}

interface Notification {
  id: string
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
  link?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setError('Usuario no autenticado')
          return
        }

        // Get notifications
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        setNotifications(notificationsData || [])

        // Get reminders
        const { data: remindersData } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', user.id)
          .order('scheduled_for', { ascending: true })
          .limit(20)

        setReminders(remindersData || [])
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err?.message || 'Error al cargar notificaciones')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleMarkAsRead = async (notifId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId)

    if (!error) {
      setNotifications(
        notifications.map((n) =>
          n.id === notifId ? { ...n, is_read: true } : n
        )
      )
    }
  }

  const handleDelete = async (notifId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notifId)

    if (!error) {
      setNotifications(notifications.filter((n) => n.id !== notifId))
    }
  }

  const handleMarkReminder = async (reminderId: string) => {
    const { error } = await supabase
      .from('reminders')
      .update({ is_sent: true })
      .eq('id', reminderId)

    if (!error) {
      setReminders(
        reminders.map((r) =>
          r.id === reminderId ? { ...r, is_sent: true } : r
        )
      )
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-foreground">Notificaciones</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">{unreadCount} nuevo</Badge>
          )}
        </div>
        <p className="text-muted-foreground">Gestiona tus notificaciones y recordatorios</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">
            Notificaciones {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="reminders">Recordatorios</TabsTrigger>
        </TabsList>

        {/* Notificaciones Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
              <CardContent className="pt-8">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No hay notificaciones</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <Card
                  key={notif.id}
                  className={`border-border/50 backdrop-blur-xl transition-all ${
                    notif.is_read ? 'bg-card/30 opacity-75' : 'bg-card/50 border-primary/20'
                  }`}
                >
                  <CardContent className="pt-6 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{notif.title}</h3>
                        {!notif.is_read && (
                          <Badge className="bg-primary text-primary-foreground text-xs">Nuevo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground/60">
                        {new Date(notif.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!notif.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(notif.id)}
                          title="Marcar como leído"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(notif.id)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recordatorios Tab */}
        <TabsContent value="reminders" className="space-y-4">
          {reminders.length === 0 ? (
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
              <CardContent className="pt-8">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No hay recordatorios pendientes</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <Card
                  key={reminder.id}
                  className={`border-border/50 backdrop-blur-xl transition-all ${
                    reminder.is_sent ? 'bg-card/30 opacity-75' : 'bg-card/50 border-primary/20'
                  }`}
                >
                  <CardContent className="pt-6 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{reminder.title}</h3>
                        {!reminder.is_sent && (
                          <Badge className="bg-primary text-primary-foreground text-xs">Pendiente</Badge>
                        )}
                      </div>
                      {reminder.message && (
                        <p className="text-sm text-muted-foreground mb-2">{reminder.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60">
                        {new Date(reminder.scheduled_for).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!reminder.is_sent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkReminder(reminder.id)}
                          title="Marcar como enviado"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
