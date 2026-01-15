import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment parameters (Supabase uses hash for auth tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check URL search params
        const errorDescription = searchParams.get('error_description');
        const error = searchParams.get('error');

        if (error || errorDescription) {
          setStatus('error');
          setMessage(errorDescription || 'Error en la verificación');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setStatus('error');
            setMessage('Error al establecer la sesión');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          // Success - determine where to redirect
          if (type === 'signup' || type === 'email_confirmation') {
            setStatus('success');
            setMessage('¡Email verificado correctamente!');
            setTimeout(() => navigate('/onboarding'), 2000);
          } else if (type === 'recovery') {
            setStatus('success');
            setMessage('Sesión restaurada. Redirigiendo...');
            setTimeout(() => navigate('/settings'), 2000);
          } else {
            setStatus('success');
            setMessage('¡Bienvenido! Redirigiendo...');
            setTimeout(() => navigate('/'), 2000);
          }
        } else {
          // No tokens in URL, try to get existing session
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            setStatus('success');
            setMessage('Sesión activa. Redirigiendo...');
            setTimeout(() => navigate('/'), 2000);
          } else {
            // No session and no tokens - might be invalid or expired link
            setStatus('error');
            setMessage('El enlace ha expirado o es inválido');
            setTimeout(() => navigate('/login'), 3000);
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('Error inesperado. Por favor, intenta de nuevo.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
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
