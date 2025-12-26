import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Webhook,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Bell,
  Shield,
  Zap,
  MessageSquare,
  Settings2,
  Loader2,
  Save
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSettings, useUpdateSettings, useTestWebhookConnection } from "@/hooks/useSettings";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const testConnection = useTestWebhookConnection();

  const [phoneId, setPhoneId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [verifyToken, setVerifyToken] = useState("paytrack_verify_2024");
  const [autoProcess, setAutoProcess] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [lowConfidenceAlert, setLowConfidenceAlert] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [timezone, setTimezone] = useState("America/Lima");
  const [currency, setCurrency] = useState("PEN");
  const [language, setLanguage] = useState("Español");

  // Load settings when data is available
  useEffect(() => {
    if (settings) {
      setPhoneId(settings.whatsapp_phone_id || "");
      setBusinessId(settings.whatsapp_business_id || "");
      setVerifyToken(settings.webhook_verify_token || "paytrack_verify_2024");
      setAutoProcess(settings.auto_process_messages ?? true);
      setNotifications(settings.notification_new_payment ?? true);
      setLowConfidenceAlert(settings.notification_low_confidence ?? true);
      setConfidenceThreshold(settings.ai_confidence_threshold || 70);
      setTimezone(settings.timezone || "America/Lima");
      setCurrency(settings.default_currency || "PEN");
      setLanguage(settings.language || "Español");
    }
  }, [settings]);

  // Generate the webhook URL for this project
  const projectWebhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const handleTestConnection = async () => {
    try {
      await testConnection.mutateAsync();
      toast.success('Conexión exitosa con WhatsApp Business API');
    } catch (error) {
      toast.error('Error al conectar');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        whatsapp_phone_id: phoneId || null,
        whatsapp_business_id: businessId || null,
        webhook_verify_token: verifyToken,
        auto_process_messages: autoProcess,
        notification_new_payment: notifications,
        notification_low_confidence: lowConfidenceAlert,
        ai_confidence_threshold: confidenceThreshold,
        timezone: timezone,
        default_currency: currency,
        language: language,
      });
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      toast.error('Error al guardar configuración');
    }
  };

  const isConnected = settings?.webhook_connected ?? false;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">
            Configura la integración con WhatsApp Business y ajustes del sistema
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* WhatsApp Webhook Configuration */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                  <Webhook className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>Webhook de WhatsApp</CardTitle>
                  <CardDescription>Configura la URL para recibir mensajes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL del Webhook (Callback URL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    value={projectWebhookUrl}
                    readOnly
                    className="font-mono text-sm bg-muted/50"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(projectWebhookUrl, "URL del Webhook")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Usa esta URL en la configuración de Meta Business Suite
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-token">Token de Verificación</Label>
                <div className="flex gap-2">
                  <Input
                    id="verify-token"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(verifyToken, "Token")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este token se usa para verificar la conexión con Meta
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="phone-id">ID del Número de Teléfono (Opcional)</Label>
                <Input
                  id="phone-id"
                  placeholder="Ej: 123456789012345"
                  className="font-mono text-sm"
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-id">ID de la Cuenta Business (Opcional)</Label>
                <Input
                  id="business-id"
                  placeholder="Ej: 123456789012345"
                  className="font-mono text-sm"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isConnected ? 'bg-success/20' : 'bg-destructive/20'}`}>
                  {isConnected ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div>
                  <CardTitle>Estado de Conexión</CardTitle>
                  <CardDescription>Monitorea el estado del webhook</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge variant={isConnected ? "success" : "destructive"}>
                    {isConnected ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Último mensaje</span>
                  <span className="text-sm font-medium">
                    {settings?.last_webhook_received
                      ? new Date(settings.last_webhook_received).toLocaleString('es-PE')
                      : "Sin actividad"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mensajes hoy</span>
                  <span className="text-sm font-medium">{settings?.messages_today || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pagos detectados</span>
                  <span className="text-sm font-medium text-success">{settings?.payments_today || 0}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleTestConnection}
                  disabled={testConnection.isPending}
                >
                  {testConnection.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Probar Conexión
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Processing Settings */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Procesamiento IA</CardTitle>
                  <CardDescription>Configura el motor de detección de pagos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Procesamiento automático</Label>
                  <p className="text-xs text-muted-foreground">
                    Analizar mensajes entrantes automáticamente
                  </p>
                </div>
                <Switch
                  checked={autoProcess}
                  onCheckedChange={setAutoProcess}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alerta de baja confianza</Label>
                  <p className="text-xs text-muted-foreground">
                    Notificar cuando confianza {"<"} {confidenceThreshold}%
                  </p>
                </div>
                <Switch
                  checked={lowConfidenceAlert}
                  onCheckedChange={setLowConfidenceAlert}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Umbral de confianza mínimo</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pagos con menor confianza requieren revisión manual
                </p>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">Modelo: Gemini 2.5 Flash</p>
                    <p className="text-muted-foreground">
                      Optimizado para detección de pagos en español
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                  <Bell className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle>Notificaciones</CardTitle>
                  <CardDescription>Configura alertas y avisos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones push</Label>
                  <p className="text-xs text-muted-foreground">
                    Recibir alertas en el navegador
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nuevos pagos detectados</Label>
                  <p className="text-xs text-muted-foreground">
                    Notificar cada pago confirmado
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Promesas de pago</Label>
                  <p className="text-xs text-muted-foreground">
                    Alertar sobre promesas próximas a vencer
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Errores del sistema</Label>
                  <p className="text-xs text-muted-foreground">
                    Alertar sobre fallos de conexión
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Advanced */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50">
                <Settings2 className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <CardTitle>Configuración Avanzada</CardTitle>
                <CardDescription>Ajustes de seguridad y sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Zona horaria</Label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda predeterminada</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Encriptación de datos</p>
                  <p className="text-xs text-muted-foreground">
                    Todos los datos están encriptados en reposo y en tránsito
                  </p>
                </div>
              </div>
              <Badge variant="success">Activo</Badge>
            </div>

            <Separator className="my-6" />

            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancelar cambios</Button>
              <Button
                className="gradient-primary text-primary-foreground"
                onClick={handleSaveSettings}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
