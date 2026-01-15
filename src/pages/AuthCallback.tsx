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
        console.log('AuthCallback: URL:', window.location.href);
        console.log('AuthCallback: Hash:', window.location.hash);

        // Check for error in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        if (error) {
          console.error('AuthCallback: Error from URL:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Error en la autenticación');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Try to exchange the code for a session (PKCE flow)
        const code = urlParams.get('code');
        if (code) {
          console.log('AuthCallback: Found code, exchanging...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('AuthCallback: Exchange error:', exchangeError);
            setStatus('error');
            setMessage('Error al verificar la sesión');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          if (data.session) {
            console.log('AuthCallback: Session established via code exchange');
            setStatus('success');
            setMessage('¡Bienvenido! Redirigiendo...');
            setTimeout(() => navigate('/'), 2000);
            return;
          }
        }

        // Check for tokens in hash (implicit flow)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('AuthCallback: Tokens in hash?', !!accessToken, !!refreshToken, 'Type:', type);

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('AuthCallback: Session error:', sessionError);
            setStatus('error');
            setMessage('Error al establecer la sesión');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          console.log('AuthCallback: Session set successfully');

          if (type === 'signup' || type === 'email_confirmation') {
            setStatus('success');
            setMessage('¡Email verificado correctamente!');
            setTimeout(() => navigate('/onboarding'), 2000);
          } else if (type === 'recovery') {
            setStatus('success');
            setMessage('Sesión restaurada. Redirigiendo...');
            setTimeout(() => navigate('/reset-password'), 2000);
          } else {
            setStatus('success');
            setMessage('¡Bienvenido! Redirigiendo...');
            setTimeout(() => navigate('/'), 2000);
          }
          return;
        }

        // No code or tokens, check if we already have a session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthCallback: Existing session?', !!session);

        if (session) {
          setStatus('success');
          setMessage('Sesión activa. Redirigiendo...');
          setTimeout(() => navigate('/'), 2000);
        } else {
          // Wait a moment and check again (session might be loading)
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession } } = await supabase.auth.getSession();

          if (retrySession) {
            setStatus('success');
            setMessage('¡Bienvenido! Redirigiendo...');
            setTimeout(() => navigate('/'), 2000);
          } else {
            setStatus('error');
            setMessage('No se pudo verificar la sesión');
            setTimeout(() => navigate('/login'), 3000);
          }
        }
      } catch (err) {
        console.error('AuthCallback: Unexpected error:', err);
        setStatus('error');
        setMessage('Error inesperado. Por favor, intenta de nuevo.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
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
