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
  Globe,
  Zap,
  MessageSquare,
  Settings2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWebhookStatus, useTestWebhookConnection } from "@/hooks/useSupabaseData";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Default settings
const DEFAULT_SETTINGS = {
  verifyToken: "paytrack_verify_2024",
  phoneId: "",
  businessId: "",
  autoProcess: true,
  notifications: true,
  lowConfidenceAlert: true,
  confidenceThreshold: 70,
  timezone: "America/Lima",
  defaultCurrency: "PEN",
  language: "Español",
  notifyNewPayments: true,
  notifyPromises: true,
  notifyErrors: true,
};

// Load settings from localStorage
const loadSettings = () => {
  try {
    const saved = localStorage.getItem("paytrack_settings");
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error loading settings:", e);
  }
  return DEFAULT_SETTINGS;
};

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(loadSettings);

  // Real webhook status from database
  const { data: webhookStatus, isLoading: isLoadingStatus, refetch: refetchStatus } = useWebhookStatus();
  const testWebhook = useTestWebhookConnection();

  // Generate the webhook URL for this project
  const projectWebhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  // Update setting helper
  const updateSetting = <K extends keyof typeof DEFAULT_SETTINGS>(
    key: K,
    value: typeof DEFAULT_SETTINGS[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("paytrack_settings", JSON.stringify(settings));
      setOriginalSettings({ ...settings });
      setHasChanges(false);
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      toast.error("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel changes
  const cancelChanges = () => {
    setSettings({ ...originalSettings });
    setHasChanges(false);
    toast.info("Cambios descartados");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const testConnection = async () => {
    try {
      const result = await testWebhook.mutateAsync(projectWebhookUrl);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error al probar la conexión");
    }
  };

  // Format the last message time
  const formatLastMessageTime = () => {
    if (!webhookStatus?.lastMessageAt) return "Sin mensajes";
    try {
      return formatDistanceToNow(new Date(webhookStatus.lastMessageAt), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const isConnected = webhookStatus?.isConnected ?? false;

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
                    value={settings.verifyToken}
                    onChange={(e) => updateSetting("verifyToken", e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(settings.verifyToken, "Token")}
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
                  value={settings.phoneId}
                  onChange={(e) => updateSetting("phoneId", e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-id">ID de la Cuenta Business (Opcional)</Label>
                <Input
                  id="business-id"
                  placeholder="Ej: 123456789012345"
                  value={settings.businessId}
                  onChange={(e) => updateSetting("businessId", e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  isLoadingStatus ? 'bg-muted/50' : isConnected ? 'bg-success/20' : 'bg-destructive/20'
                }`}>
                  {isLoadingStatus ? (
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : isConnected ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div>
                  <CardTitle>Estado de Conexión</CardTitle>
                  <CardDescription>Monitorea el estado del webhook en tiempo real</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  {isLoadingStatus ? (
                    <Badge variant="secondary">Cargando...</Badge>
                  ) : (
                    <Badge variant={isConnected ? "success" : "destructive"}>
                      {isConnected ? "Conectado" : "Sin actividad reciente"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Último mensaje</span>
                  <span className="text-sm font-medium">
                    {isLoadingStatus ? "..." : formatLastMessageTime()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mensajes hoy</span>
                  <span className="text-sm font-medium">
                    {isLoadingStatus ? "..." : webhookStatus?.messagesToday ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pagos detectados hoy</span>
                  <span className="text-sm font-medium text-success">
                    {isLoadingStatus ? "..." : webhookStatus?.paymentsDetectedToday ?? 0}
                  </span>
                </div>
                {webhookStatus?.lastError && (
                  <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                    <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    <div className="text-xs text-warning">
                      <span className="font-medium">Último error: </span>
                      {webhookStatus.lastError}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={testConnection}
                  disabled={testWebhook.isPending}
                >
                  {testWebhook.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Probar Conexión
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => refetchStatus()}
                  disabled={isLoadingStatus}
                >
                  {isLoadingStatus ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Actualizar
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                El estado se actualiza automáticamente cada minuto
              </p>
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
                  checked={settings.autoProcess}
                  onCheckedChange={(checked) => updateSetting("autoProcess", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alerta de baja confianza</Label>
                  <p className="text-xs text-muted-foreground">
                    Notificar cuando confianza {"<"} {settings.confidenceThreshold}%
                  </p>
                </div>
                <Switch
                  checked={settings.lowConfidenceAlert}
                  onCheckedChange={(checked) => updateSetting("lowConfidenceAlert", checked)}
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
                    value={settings.confidenceThreshold}
                    onChange={(e) => updateSetting("confidenceThreshold", parseInt(e.target.value) || 70)}
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
                  checked={settings.notifications}
                  onCheckedChange={(checked) => updateSetting("notifications", checked)}
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
                <Switch
                  checked={settings.notifyNewPayments}
                  onCheckedChange={(checked) => updateSetting("notifyNewPayments", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Promesas de pago</Label>
                  <p className="text-xs text-muted-foreground">
                    Alertar sobre promesas próximas a vencer
                  </p>
                </div>
                <Switch
                  checked={settings.notifyPromises}
                  onCheckedChange={(checked) => updateSetting("notifyPromises", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Errores del sistema</Label>
                  <p className="text-xs text-muted-foreground">
                    Alertar sobre fallos de conexión
                  </p>
                </div>
                <Switch
                  checked={settings.notifyErrors}
                  onCheckedChange={(checked) => updateSetting("notifyErrors", checked)}
                />
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
                  value={settings.timezone}
                  onChange={(e) => updateSetting("timezone", e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda predeterminada</Label>
                <Input
                  value={settings.defaultCurrency}
                  onChange={(e) => updateSetting("defaultCurrency", e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Input
                  value={settings.language}
                  onChange={(e) => updateSetting("language", e.target.value)}
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
              <Button
                variant="outline"
                onClick={cancelChanges}
                disabled={!hasChanges}
              >
                Cancelar cambios
              </Button>
              <Button
                className="gradient-primary text-primary-foreground"
                onClick={saveSettings}
                disabled={!hasChanges || isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
