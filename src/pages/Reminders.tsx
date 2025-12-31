import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Calendar,
  Clock,
  User,
  DollarSign,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Loader2,
  CalendarClock,
  RotateCcw,
} from 'lucide-react';
import { useReminders, useUpcomingReminders, useCancelReminder, useRescheduleReminder, type PaymentReminder } from '@/hooks/useReminders';
import { ReminderSettings } from '@/components/reminders/ReminderSettings';
import { formatCurrency } from '@/lib/currency';
import { EmptyState } from '@/components/ui/empty-state';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

const statusConfig = {
  scheduled: { label: 'Programado', variant: 'secondary' as const, icon: Clock },
  sent: { label: 'Enviado', variant: 'success' as const, icon: CheckCircle2 },
  failed: { label: 'Fallido', variant: 'destructive' as const, icon: XCircle },
  cancelled: { label: 'Cancelado', variant: 'outline' as const, icon: XCircle },
};

const reminderTypeConfig = {
  before_due: { label: 'Antes del vencimiento', color: 'text-primary' },
  on_due: { label: 'Dia de vencimiento', color: 'text-warning' },
  after_due: { label: 'Vencido', color: 'text-destructive' },
  custom: { label: 'Personalizado', color: 'text-muted-foreground' },
};

export default function Reminders() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const { data: allReminders, isLoading } = useReminders();
  const { data: upcomingReminders } = useUpcomingReminders(7);
  const cancelReminder = useCancelReminder();
  const rescheduleReminder = useRescheduleReminder();

  const scheduledReminders = allReminders?.filter(r => r.status === 'scheduled') || [];
  const sentReminders = allReminders?.filter(r => r.status === 'sent') || [];
  const failedReminders = allReminders?.filter(r => r.status === 'failed') || [];

  const handleCancel = async (id: string) => {
    try {
      await cancelReminder.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleReschedule = async (id: string) => {
    // For now, reschedule to tomorrow at 9am
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    try {
      await rescheduleReminder.mutateAsync({ id, scheduledAt: tomorrow.toISOString() });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const formatScheduledDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Hoy a las ${format(date, 'HH:mm')}`;
    }
    if (isTomorrow(date)) {
      return `Manana a las ${format(date, 'HH:mm')}`;
    }
    return format(date, "d 'de' MMMM 'a las' HH:mm", { locale: es });
  };

  const ReminderCard = ({ reminder }: { reminder: PaymentReminder }) => {
    const status = statusConfig[reminder.status as keyof typeof statusConfig];
    const type = reminderTypeConfig[reminder.reminder_type as keyof typeof reminderTypeConfig];
    const StatusIcon = status.icon;
    const isScheduled = reminder.status === 'scheduled';
    const isPastDue = isPast(new Date(reminder.scheduled_at)) && isScheduled;

    return (
      <Card className={`glass-card ${isPastDue ? 'border-warning/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                reminder.status === 'scheduled' ? 'bg-primary/10' :
                reminder.status === 'sent' ? 'bg-success/10' :
                reminder.status === 'failed' ? 'bg-destructive/10' : 'bg-muted'
              }`}>
                <Bell className={`h-5 w-5 ${
                  reminder.status === 'scheduled' ? 'text-primary' :
                  reminder.status === 'sent' ? 'text-success' :
                  reminder.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{reminder.contacts?.name || 'Contacto'}</span>
                  <Badge variant={status.variant} className="text-xs">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatCurrency(reminder.payments?.amount || 0, reminder.payments?.currency || 'PEN')}
                  </span>
                  <span className={`flex items-center gap-1 ${type.color}`}>
                    <Calendar className="h-3.5 w-3.5" />
                    {type.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {isScheduled ? formatScheduledDate(reminder.scheduled_at) : format(new Date(reminder.sent_at || reminder.scheduled_at), "d MMM yyyy HH:mm", { locale: es })}
                </div>
                {isPastDue && (
                  <div className="flex items-center gap-1 text-warning text-sm">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Debio enviarse {formatDistanceToNow(new Date(reminder.scheduled_at), { locale: es, addSuffix: true })}
                  </div>
                )}
                {reminder.error_message && (
                  <p className="text-sm text-destructive">{reminder.error_message}</p>
                )}
              </div>
            </div>
            {isScheduled && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReschedule(reminder.id)}
                  disabled={rescheduleReminder.isPending}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleCancel(reminder.id)}
                  disabled={cancelReminder.isPending}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
            {reminder.status === 'failed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReschedule(reminder.id)}
                disabled={rescheduleReminder.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reintentar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recordatorios</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los recordatorios automaticos de pago
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-sm py-1">
              <Bell className="h-4 w-4 mr-1" />
              {scheduledReminders.length} programados
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{scheduledReminders.length}</p>
                  <p className="text-sm text-muted-foreground">Programados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Send className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sentReminders.length}</p>
                  <p className="text-sm text-muted-foreground">Enviados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{failedReminders.length}</p>
                  <p className="text-sm text-muted-foreground">Fallidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Calendar className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{upcomingReminders?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Proximos 7 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="upcoming">Proximos</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="settings">Configuracion</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : scheduledReminders.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="Sin recordatorios programados"
                description="Los recordatorios se programaran automaticamente cuando agregues pagos con fecha de vencimiento."
              />
            ) : (
              <div className="space-y-3">
                {scheduledReminders.map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : [...sentReminders, ...failedReminders].length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Sin historial de recordatorios"
                description="Aqui aparecera el historial de recordatorios enviados y fallidos."
              />
            ) : (
              <div className="space-y-3">
                {[...sentReminders, ...failedReminders]
                  .sort((a, b) => new Date(b.sent_at || b.scheduled_at).getTime() - new Date(a.sent_at || a.scheduled_at).getTime())
                  .map((reminder) => (
                    <ReminderCard key={reminder.id} reminder={reminder} />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <ReminderSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
