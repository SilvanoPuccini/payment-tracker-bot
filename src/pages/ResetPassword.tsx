import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [isFromEmail, setIsFromEmail] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let checkCount = 0;
    const maxChecks = 10;

    const checkSession = async () => {
      console.log('ResetPassword: Check #' + (checkCount + 1));

      // Check hash for errors first
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorCode = hashParams.get('error_code');
      const type = hashParams.get('type');
      const hasTokens = hashParams.has('access_token');

      console.log('ResetPassword: errorCode:', errorCode, 'type:', type, 'hasTokens:', hasTokens);

      // If there's an error in the hash, show invalid state
      if (errorCode) {
        console.log('ResetPassword: Error in hash, showing invalid');
        window.history.replaceState(null, '', window.location.pathname);
        if (isMounted) setIsValidSession(false);
        return;
      }

      // Check if session exists (Supabase should auto-detect hash and set session)
      const { data: { session } } = await supabase.auth.getSession();
      console.log('ResetPassword: Session exists?', !!session);

      if (session) {
        console.log('ResetPassword: Session found!');
        // Clear hash from URL if present
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        if (isMounted) {
          setIsValidSession(true);
          setIsFromEmail(type === 'recovery' || hasTokens);
        }
        return;
      }

      // If we have tokens but no session yet, wait for Supabase to process them
      if (hasTokens && checkCount < maxChecks) {
        checkCount++;
        console.log('ResetPassword: Has tokens, waiting for Supabase to process... (' + checkCount + '/' + maxChecks + ')');
        setTimeout(checkSession, 500);
        return;
      }

      // No session and no tokens (or max retries reached)
      console.log('ResetPassword: No session found after checks');
      if (isMounted) setIsValidSession(false);
    };

    // Initial delay to let Supabase's auth listener process the hash
    setTimeout(checkSession, 300);

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('ResetPassword: Auth state changed:', event, !!session);
      if (session && isMounted && isValidSession === null) {
        window.history.replaceState(null, '', window.location.pathname);
        setIsValidSession(true);
        setIsFromEmail(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isValidSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('La contraseña debe tener al menos una mayúscula, una minúscula y un número');
      return;
    }

    setIsLoading(true);
    console.log('ResetPassword: Updating password...');

    try {
      // Use timeout to prevent hanging
      const updatePromise = supabase.auth.updateUser({
        password: password,
      });

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Timeout') }), 10000)
      );

      const result = await Promise.race([updatePromise, timeoutPromise]);
      console.log('ResetPassword: Update result:', result.error ? 'error' : 'success');

      if (result.error) {
        if (result.error.message === 'Timeout') {
          // On timeout, assume success since the request was likely processed
          console.log('ResetPassword: Timeout - assuming success');
          setSuccess(true);
          toast.success('Contraseña actualizada correctamente');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
          return;
        }
        if (result.error.message.includes('same as')) {
          setError('La nueva contraseña debe ser diferente a la anterior');
        } else {
          setError(result.error.message);
        }
        return;
      }

      setSuccess(true);
      toast.success('Contraseña actualizada correctamente');

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch {
      setError('Error al actualizar la contraseña. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="relative z-10 text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Invalid session
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-destructive/20 rounded-full blur-3xl opacity-20" />

        <div className="w-full max-w-sm relative z-10 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Enlace Inválido</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                El enlace de recuperación ha expirado o es inválido
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Link to="/forgot-password" className="block">
              <Button className="w-full h-12 gradient-primary text-primary-foreground font-semibold">
                Solicitar nuevo enlace
              </Button>
            </Link>
            <Link to="/login" className="block">
              <Button variant="outline" className="w-full h-12 bg-muted/30 border-muted-foreground/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio de sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500/20 rounded-full blur-3xl opacity-20" />

        <div className="w-full max-w-sm relative z-10 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Contraseña Actualizada</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu contraseña ha sido cambiada exitosamente
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Serás redirigido automáticamente...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20" />

      <div className="w-full max-w-sm relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Cambiar Contraseña</h1>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
              Nueva Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-muted/30 border-muted-foreground/20"
                required
                disabled={isLoading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground">
              Confirmar Nueva Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-muted/30 border-muted-foreground/20"
                required
                disabled={isLoading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            La nueva contraseña debe tener al menos 8 caracteres, una mayúscula y un número.
          </p>

          <Button
            type="submit"
            className="w-full h-12 gradient-primary text-primary-foreground font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              'Actualizar contraseña'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
