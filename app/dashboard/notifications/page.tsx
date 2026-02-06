'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Trash2, CheckCircle2 } from 'lucide-react'

interface Reminder {
  id: string;
  title: string;
  message: string;
  reminder_type: string;
  reminder_date: string;
  is_sent: boolean;
}

const notificationIcons: Record<string, typeof Bell> = {
  grade: GraduationCap,
  assignment: BookOpen,
  meeting: Calendar,
  announcement: Megaphone,
  reminder: Clock,
  system: AlertCircle,
};

const notificationColors: Record<string, string> = {
  grade: "bg-green-500/20 text-green-600",
  assignment: "bg-blue-500/20 text-blue-600",
  meeting: "bg-purple-500/20 text-purple-600",
  announcement: "bg-amber-500/20 text-amber-600",
  reminder: "bg-orange-500/20 text-orange-600",
  system: "bg-gray-500/20 text-gray-600",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    email_grades: true,
    email_assignments: true,
    email_meetings: true,
    email_announcements: true,
    push_enabled: true,
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get notifications
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications(notificationsData || []);

      // Get reminders
      const { data: remindersData } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .gte("reminder_date", new Date().toISOString())
        .order("reminder_date", { ascending: true })
        .limit(20);

      setReminders(remindersData || []);

      // Get preferences
      const { data: prefsData } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (prefsData) {
        setPreferences({
          email_grades: prefsData.email_grades ?? true,
          email_assignments: prefsData.email_assignments ?? true,
          email_meetings: prefsData.email_meetings ?? true,
          email_announcements: prefsData.email_announcements ?? true,
          push_enabled: prefsData.push_enabled ?? true,
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase.from("notifications").delete().eq("id", notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const updatePreference = async (key: string, value: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setPreferences((prev) => ({ ...prev, [key]: value }));

    await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      [key]: value,
      updated_at: new Date().toISOString(),
    });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Notificaciones
          </h1>
          <p className="text-muted-foreground">
            Mantente al día con tus clases y actividades
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Marcar todo como leído
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{notifications.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
              <BellRing className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sin leer</p>
              <p className="text-2xl font-bold">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recordatorios</p>
              <p className="text-2xl font-bold">{reminders.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leídas</p>
              <p className="text-2xl font-bold">
                {notifications.filter((n) => n.is_read).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="relative">
            Todas
            {unreadCount > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reminders">Recordatorios</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-1 h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">
                  No tienes notificaciones
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Las notificaciones de tus clases aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const Icon =
                notificationIcons[notification.type] || Bell;
              const colorClass =
                notificationColors[notification.type] ||
                "bg-gray-500/20 text-gray-600";

              return (
                <Card
                  key={notification.id}
                  className={`transition-all hover:shadow-md ${!notification.is_read ? "border-primary/50 bg-primary/5" : ""}`}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={`font-medium ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {notification.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Badge
                            variant="default"
                            className="shrink-0 text-xs"
                          >
                            Nueva
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            { addSuffix: true, locale: es }
                          )}
                        </span>
                        <div className="flex gap-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Marcar como leída
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          {reminders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">
                  No tienes recordatorios pendientes
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Los recordatorios de tus clases aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {reminders.map((reminder) => (
                <Card key={reminder.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{reminder.reminder_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reminder.reminder_date).toLocaleDateString(
                          "es-ES",
                          {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                    <CardTitle className="text-base">{reminder.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {reminder.message}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>
                Configura cómo y cuándo quieres recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notificaciones por Email</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Calificaciones</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibir emails cuando se publiquen nuevas calificaciones
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email_grades}
                      onCheckedChange={(v) =>
                        updatePreference("email_grades", v)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Tareas y Asignaciones</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibir emails sobre nuevas tareas o fechas límite
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email_assignments}
                      onCheckedChange={(v) =>
                        updatePreference("email_assignments", v)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reuniones</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibir emails sobre reuniones programadas
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email_meetings}
                      onCheckedChange={(v) =>
                        updatePreference("email_meetings", v)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Anuncios</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibir emails con anuncios importantes
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email_announcements}
                      onCheckedChange={(v) =>
                        updatePreference("email_announcements", v)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Notificaciones Push</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Habilitar notificaciones push</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir notificaciones en tiempo real en tu navegador
                    </p>
                  </div>
                  <Switch
                    checked={preferences.push_enabled}
                    onCheckedChange={(v) =>
                      updatePreference("push_enabled", v)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
