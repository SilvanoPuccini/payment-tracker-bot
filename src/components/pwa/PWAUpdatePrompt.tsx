import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
      setUpdateError('Error al registrar el Service Worker');
      toast.error('Error al inicializar la aplicacion. Por favor recarga la pagina.');
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
      setUpdateError(null);
    }
  }, [needRefresh]);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Error updating service worker:', error);
      setUpdateError('Error al actualizar. Intenta recargar la pagina.');
      setIsUpdating(false);
      toast.error('Error al actualizar la aplicacion');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setNeedRefresh(false);
    setUpdateError(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center sm:left-auto sm:right-4 sm:w-auto">
      <Card className={`glass-card shadow-lg animate-slide-up w-full sm:w-auto ${updateError ? 'border-red-500/50' : 'border-emerald-500/50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${updateError ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
              {updateError ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : isUpdating ? (
                <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 text-emerald-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">
                {updateError ? 'Error al actualizar' : isUpdating ? 'Actualizando...' : 'Nueva version disponible'}
              </p>
              <p className="text-xs text-muted-foreground">
                {updateError || (isUpdating ? 'Por favor espera' : 'Actualiza para obtener las mejoras')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDismiss}
                disabled={isUpdating}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className={updateError ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
                onClick={updateError ? () => window.location.reload() : handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : updateError ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Recargar
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Actualizar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Offline indicator component
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning/90 text-warning-foreground py-2 px-4 text-center text-sm font-medium">
      Sin conexion - Trabajando en modo offline
    </div>
  );
}

// BeforeInstallPromptEvent interface for PWA install prompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Install prompt component for mobile
export function InstallPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex justify-center sm:left-auto sm:right-4 sm:w-auto sm:bottom-4">
      <Card className="glass-card border-primary/50 shadow-lg animate-slide-up w-full sm:w-auto">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 shrink-0">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">Instalar PayTrack</p>
              <p className="text-xs text-muted-foreground">
                Agrega la app a tu pantalla de inicio
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
              >
                Ahora no
              </Button>
              <Button
                size="sm"
                className="gradient-primary text-primary-foreground"
                onClick={handleInstall}
              >
                Instalar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
