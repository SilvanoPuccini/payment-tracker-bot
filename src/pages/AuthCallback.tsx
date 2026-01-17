import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');
  const hasRedirected = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const redirectTo = (path: string, successMessage: string) => {
      if (hasRedirected.current || !isMounted) return;
      hasRedirected.current = true;

      window.history.replaceState(null, '', window.location.pathname);
      setStatus('success');
      setMessage(successMessage);
      setTimeout(() => navigate(path, { replace: true }), 1500);
    };

    const redirectToError = (errorMessage: string) => {
      if (hasRedirected.current || !isMounted) return;
      hasRedirected.current = true;

      window.history.replaceState(null, '', window.location.pathname);
      setStatus('error');
      setMessage(errorMessage);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    };

    const handleAuthCallback = async () => {
      // Get hash params
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const hasTokens = hashParams.has('access_token');
      const errorCode = hashParams.get('error_code');

      console.log('AuthCallback: type:', type, 'hasTokens:', hasTokens, 'errorCode:', errorCode);

      // Check for errors in hash
      if (errorCode) {
        console.log('AuthCallback: Error in hash:', errorCode);
        redirectToError('Error en la autenticación');
        return;
      }

      // Check URL params for code (PKCE flow)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        console.log('AuthCallback: Found code, exchanging...');
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('AuthCallback: Exchange error:', exchangeError);
            throw exchangeError;
          }

          if (data.session) {
            console.log('AuthCallback: Session established via code exchange');
            redirectTo('/', '¡Bienvenido! Redirigiendo...');
            return;
          }
        } catch (err) {
          console.error('AuthCallback: Code exchange failed:', err);
          redirectToError('Error al verificar la sesión');
          return;
        }
      }

      // Check if session already exists
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthCallback: Session exists?', !!session);

      if (session) {
        console.log('AuthCallback: Session found, redirecting...');

        if (type === 'signup' || type === 'email_confirmation') {
          redirectTo('/onboarding', '¡Email confirmado! Redirigiendo...');
        } else if (type === 'recovery') {
          redirectTo('/reset-password', 'Redirigiendo a cambiar contraseña...');
        } else {
          redirectTo('/', '¡Bienvenido! Redirigiendo...');
        }
        return;
      }

      // If we have tokens in hash, wait a bit for Supabase to process them
      if (hasTokens) {
        console.log('AuthCallback: Has tokens, waiting for Supabase to process...');
        // Supabase should auto-detect and process - wait and recheck
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            if (type === 'signup' || type === 'email_confirmation') {
              redirectTo('/onboarding', '¡Email confirmado! Redirigiendo...');
            } else if (type === 'recovery') {
              redirectTo('/reset-password', 'Redirigiendo a cambiar contraseña...');
            } else {
              redirectTo('/', '¡Bienvenido! Redirigiendo...');
            }
          } else {
            redirectToError('No se pudo verificar la sesión');
          }
        }, 1000);
        return;
      }

      // No tokens, no code, no session - something went wrong
      console.log('AuthCallback: No auth data found');
      redirectToError('No se encontró información de autenticación');
    };

    // Listen for auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthCallback: Auth state changed:', event, !!session);

      if (event === 'SIGNED_IN' && session) {
        // Get type from hash for proper routing
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');

        if (type === 'signup' || type === 'email_confirmation') {
          redirectTo('/onboarding', '¡Email confirmado! Redirigiendo...');
        } else if (type === 'recovery') {
          redirectTo('/reset-password', 'Redirigiendo a cambiar contraseña...');
        } else {
          redirectTo('/', '¡Bienvenido! Redirigiendo...');
        }
      }
    });

    // Small delay then check manually
    setTimeout(handleAuthCallback, 200);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="text-center space-y-4 p-8 relative z-10">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-lg text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-lg text-foreground font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">Serás redirigido automáticamente...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-lg text-foreground font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">Serás redirigido al inicio de sesión...</p>
          </>
        )}
      </div>
    </div>
  );
}
