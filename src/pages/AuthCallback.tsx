import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Starting...');

        // Get hash params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('AuthCallback: Tokens found?', !!accessToken, !!refreshToken, 'Type:', type);

        if (accessToken && refreshToken) {
          console.log('AuthCallback: Setting session...');

          // Set session with timeout
          const sessionPromise = supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 10000)
          );

          try {
            const result = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<typeof sessionPromise>;

            if (result.error) {
              console.error('AuthCallback: Session error:', result.error);
              throw result.error;
            }

            console.log('AuthCallback: Session set successfully!');

            // Clear the hash from URL to prevent issues on refresh
            window.history.replaceState(null, '', window.location.pathname);

            setStatus('success');
            setMessage('¡Bienvenido! Redirigiendo...');

            // Small delay then redirect
            setTimeout(() => {
              if (type === 'signup' || type === 'email_confirmation') {
                navigate('/onboarding', { replace: true });
              } else if (type === 'recovery') {
                navigate('/reset-password', { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            }, 1500);
            return;

          } catch (err) {
            if (err instanceof Error && err.message === 'Timeout') {
              console.log('AuthCallback: setSession timed out, checking if session exists...');

              // Session might have been set by onAuthStateChange, check it
              const { data: { session } } = await supabase.auth.getSession();

              if (session) {
                console.log('AuthCallback: Session exists after timeout!');
                window.history.replaceState(null, '', window.location.pathname);
                setStatus('success');
                setMessage('¡Bienvenido! Redirigiendo...');
                setTimeout(() => navigate('/', { replace: true }), 1500);
                return;
              }
            }
            throw err;
          }
        }

        // Check URL params for code (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
          console.log('AuthCallback: Found code, exchanging...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('AuthCallback: Exchange error:', exchangeError);
            throw exchangeError;
          }

          if (data.session) {
            console.log('AuthCallback: Session established via code');
            setStatus('success');
            setMessage('¡Bienvenido! Redirigiendo...');
            setTimeout(() => navigate('/', { replace: true }), 1500);
            return;
          }
        }

        // Check for existing session
        console.log('AuthCallback: Checking existing session...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('AuthCallback: Found existing session');
          setStatus('success');
          setMessage('Sesión activa. Redirigiendo...');
          setTimeout(() => navigate('/', { replace: true }), 1500);
        } else {
          console.log('AuthCallback: No session found');
          setStatus('error');
          setMessage('No se pudo verificar la sesión');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
      } catch (err) {
        console.error('AuthCallback: Error:', err);
        setStatus('error');
        setMessage('Error en la autenticación');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    // Small delay to let Supabase initialize
    setTimeout(handleAuthCallback, 100);
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
