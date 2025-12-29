import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Clock,
  MessageSquare,
  Save,
  Loader2,
  Plus,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useReminderSettings, useUpdateReminderSettings } from '@/hooks/useReminders';
import { toast } from 'sonner';

export function ReminderSettings() {
  const { data: settings, isLoading } = useReminderSettings();
  const updateSettings = useUpdateReminderSettings();

  const [autoRemindEnabled, setAutoRemindEnabled] = useState(true);
  const [remindOnDue, setRemindOnDue] = useState(true);
  const [remindBeforeDays, setRemindBeforeDays] = useState<number[]>([3, 1]);
  const [remindAfterDays, setRemindAfterDays] = useState<number[]>([1, 3, 7]);
  const [preferredHour, setPreferredHour] = useState(9);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [beforeDueTemplate, setBeforeDueTemplate] = useState(
    'Hola {contact_name}, te recordamos que tienes un pago pendiente de {amount} con vencimiento el {due_date}.'
  );
  const [onDueTemplate, setOnDueTemplate] = useState(
    'Hola {contact_name}, hoy vence tu pago de {amount}. Por favor realiza el pago para evitar recargos.'
  );
  const [afterDueTemplate, setAfterDueTemplate] = useState(
    'Hola {contact_name}, tu pago de {amount} venció hace {days_overdue} días. Por favor regulariza tu situación.'
  );

  // Load settings when data is available
  useEffect(() => {
    if (settings) {
      setAutoRemindEnabled(settings.auto_remind_enabled ?? true);
      setRemindOnDue(settings.remind_on_due ?? true);
      setRemindBeforeDays(settings.remind_before_days || [3, 1]);
      setRemindAfterDays(settings.remind_after_days || [1, 3, 7]);
      setPreferredHour(settings.preferred_reminder_hour ?? 9);
      setWhatsappEnabled(settings.whatsapp_enabled ?? true);
      setEmailEnabled(settings.email_enabled ?? false);
      setBeforeDueTemplate(settings.before_due_template || beforeDueTemplate);
      setOnDueTemplate(settings.on_due_template || onDueTemplate);
      setAfterDueTemplate(settings.after_due_template || afterDueTemplate);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        auto_remind_enabled: autoRemindEnabled,
        remind_on_due: remindOnDue,
        remind_before_days: remindBeforeDays,
        remind_after_days: remindAfterDays,
        preferred_reminder_hour: preferredHour,
        whatsapp_enabled: whatsappEnabled,
        email_enabled: emailEnabled,
        before_due_template: beforeDueTemplate,
        on_due_template: onDueTemplate,
        after_due_template: afterDueTemplate,
      });
      toast.success('Configuración de recordatorios guardada');
    } catch (error) {
      toast.error('Error al guardar configuración');
    }
  };

  const addDay = (type: 'before' | 'after') => {
    if (type === 'before') {
      const newDays = [...remindBeforeDays, remindBeforeDays.length > 0 ? remindBeforeDays[remindBeforeDays.length - 1] + 1 : 1];
      setRemindBeforeDays(newDays.sort((a, b) => b - a));
    } else {
      const newDays = [...remindAfterDays, remindAfterDays.length > 0 ? remindAfterDays[remindAfterDays.length - 1] + 1 : 1];
      setRemindAfterDays(newDays.sort((a, b) => a - b));
    }
  };

  const removeDay = (type: 'before' | 'after', index: number) => {
    if (type === 'before') {
      setRemindBeforeDays(remindBeforeDays.filter((_, i) => i !== index));
    } else {
      setRemindAfterDays(remindAfterDays.filter((_, i) => i !== index));
    }
  };

  const updateDay = (type: 'before' | 'after', index: number, value: number) => {
    if (type === 'before') {
      const newDays = [...remindBeforeDays];
      newDays[index] = value;
      setRemindBeforeDays(newDays.sort((a, b) => b - a));
    } else {
      const newDays = [...remindAfterDays];
      newDays[index] = value;
      setRemindAfterDays(newDays.sort((a, b) => a - b));
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Settings */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Recordatorios Automaticos</CardTitle>
              <CardDescription>
                Configura cuando y como enviar recordatorios de pago
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Recordatorios automaticos</Label>
              <p className="text-sm text-muted-foreground">
                Enviar recordatorios automaticamente segun la configuracion
              </p>
            </div>
            <Switch
              checked={autoRemindEnabled}
              onCheckedChange={setAutoRemindEnabled}
            />
          </div>

          <Separator />

          {/* Channels */}
          <div className="space-y-4">
            <Label className="text-base">Canales de notificacion</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-success" />
                  <span>WhatsApp</span>
                </div>
                <Switch
                  checked={whatsappEnabled}
                  onCheckedChange={setWhatsappEnabled}
                  disabled={!autoRemindEnabled}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <span>Email</span>
                </div>
                <Switch
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                  disabled={!autoRemindEnabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Preferred Hour */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hora preferida para enviar recordatorios
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={23}
                value={preferredHour}
                onChange={(e) => setPreferredHour(Number(e.target.value))}
                className="w-20"
                disabled={!autoRemindEnabled}
              />
              <span className="text-muted-foreground">:00 hrs</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Los recordatorios se enviaran a esta hora (zona horaria local)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Timing Configuration */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle>Programacion de Recordatorios</CardTitle>
              <CardDescription>
                Configura los dias antes y despues del vencimiento
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Before Due */}
          <div className="space-y-3">
            <Label className="text-base">Antes del vencimiento</Label>
            <div className="flex flex-wrap gap-2">
              {remindBeforeDays.map((day, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={day}
                    onChange={(e) => updateDay('before', index, Number(e.target.value))}
                    className="w-16"
                    disabled={!autoRemindEnabled}
                  />
                  <span className="text-sm text-muted-foreground">dias</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeDay('before', index)}
                    disabled={!autoRemindEnabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addDay('before')}
                disabled={!autoRemindEnabled || remindBeforeDays.length >= 5}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>

          <Separator />

          {/* On Due Date */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">El dia del vencimiento</Label>
              <p className="text-sm text-muted-foreground">
                Enviar recordatorio el dia exacto del vencimiento
              </p>
            </div>
            <Switch
              checked={remindOnDue}
              onCheckedChange={setRemindOnDue}
              disabled={!autoRemindEnabled}
            />
          </div>

          <Separator />

          {/* After Due */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-base">Despues del vencimiento</Label>
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Vencido
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {remindAfterDays.map((day, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={day}
                    onChange={(e) => updateDay('after', index, Number(e.target.value))}
                    className="w-16"
                    disabled={!autoRemindEnabled}
                  />
                  <span className="text-sm text-muted-foreground">dias</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeDay('after', index)}
                    disabled={!autoRemindEnabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addDay('after')}
                disabled={!autoRemindEnabled || remindAfterDays.length >= 5}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
              <MessageSquare className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle>Plantillas de Mensajes</CardTitle>
              <CardDescription>
                Personaliza los mensajes de recordatorio
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/30 p-3 text-sm">
            <p className="font-medium mb-2">Variables disponibles:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{'{contact_name}'}</Badge>
              <Badge variant="secondary">{'{amount}'}</Badge>
              <Badge variant="secondary">{'{due_date}'}</Badge>
              <Badge variant="secondary">{'{days_until_due}'}</Badge>
              <Badge variant="secondary">{'{days_overdue}'}</Badge>
              <Badge variant="secondary">{'{business_name}'}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Antes del vencimiento</Label>
            <Textarea
              value={beforeDueTemplate}
              onChange={(e) => setBeforeDueTemplate(e.target.value)}
              rows={3}
              disabled={!autoRemindEnabled}
              placeholder="Mensaje para recordatorios antes del vencimiento..."
            />
          </div>

          <div className="space-y-2">
            <Label>El dia del vencimiento</Label>
            <Textarea
              value={onDueTemplate}
              onChange={(e) => setOnDueTemplate(e.target.value)}
              rows={3}
              disabled={!autoRemindEnabled}
              placeholder="Mensaje para el dia del vencimiento..."
            />
          </div>

          <div className="space-y-2">
            <Label>Despues del vencimiento (Vencido)</Label>
            <Textarea
              value={afterDueTemplate}
              onChange={(e) => setAfterDueTemplate(e.target.value)}
              rows={3}
              disabled={!autoRemindEnabled}
              placeholder="Mensaje para pagos vencidos..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={handleSave}
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar configuracion
        </Button>
      </div>
    </div>
  );
}
