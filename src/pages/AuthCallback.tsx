import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    let isMounted = true;
    let checkCount = 0;
    const maxChecks = 10;

    const handleAuthCallback = async () => {
      console.log('AuthCallback: Check #' + (checkCount + 1));

      // Get hash params
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const hasTokens = hashParams.has('access_token');
      const errorCode = hashParams.get('error_code');

      console.log('AuthCallback: type:', type, 'hasTokens:', hasTokens, 'errorCode:', errorCode);

      // Check for errors in hash
      if (errorCode) {
        console.log('AuthCallback: Error in hash');
        window.history.replaceState(null, '', window.location.pathname);
        if (isMounted) {
          setStatus('error');
          setMessage('Error en la autenticación');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
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
            console.log('AuthCallback: Session established via code');
            if (isMounted) {
              setStatus('success');
              setMessage('¡Bienvenido! Redirigiendo...');
              setTimeout(() => navigate('/', { replace: true }), 1500);
            }
            return;
          }
        } catch (err) {
          console.error('AuthCallback: Code exchange failed:', err);
        }
      }

      // Check if session exists (Supabase should auto-detect hash)
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthCallback: Session exists?', !!session);

      if (session) {
        console.log('AuthCallback: Session found!');
        // Clear hash/params from URL
        window.history.replaceState(null, '', window.location.pathname);

        if (isMounted) {
          setStatus('success');
          setMessage('¡Bienvenido! Redirigiendo...');

          setTimeout(() => {
            if (type === 'signup' || type === 'email_confirmation') {
              navigate('/onboarding', { replace: true });
            } else if (type === 'recovery') {
              navigate('/reset-password', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          }, 1500);
        }
        return;
      }

      // If we have tokens but no session yet, wait for Supabase to process
      if (hasTokens && checkCount < maxChecks) {
        checkCount++;
        console.log('AuthCallback: Waiting for Supabase... (' + checkCount + '/' + maxChecks + ')');
        setTimeout(handleAuthCallback, 500);
        return;
      }

      // No session found after all checks
      console.log('AuthCallback: No session found');
      if (isMounted) {
        setStatus('error');
        setMessage('No se pudo verificar la sesión');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    // Initial delay to let Supabase process the hash
    setTimeout(handleAuthCallback, 300);

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthCallback: Auth state changed:', event, !!session);
      if (session && isMounted && status === 'loading') {
        window.history.replaceState(null, '', window.location.pathname);
        setStatus('success');
        setMessage('¡Bienvenido! Redirigiendo...');
        setTimeout(() => navigate('/', { replace: true }), 1500);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, status]);

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
