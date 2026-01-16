import { useState, useCallback } from 'react';
import { useOnboarding, OnboardingData } from '@/hooks/useOnboarding';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, LayoutDashboard, Check, Building2 } from 'lucide-react';

// Monedas con banderas emoji
const CURRENCIES = [
  { value: 'PEN', label: 'Soles', flag: '🇵🇪' },
  { value: 'USD', label: 'Dólares', flag: '🇺🇸' },
  { value: 'ARS', label: 'Pesos', flag: '🇦🇷' },
  { value: 'CLP', label: 'Pesos', flag: '🇨🇱' },
  { value: 'MXN', label: 'Pesos', flag: '🇲🇽' },
  { value: 'EUR', label: 'Euros', flag: '🇪🇺' },
];

// Mapeo de moneda a timezone
const CURRENCY_TIMEZONE: Record<string, string> = {
  PEN: 'America/Lima',
  USD: 'America/New_York',
  ARS: 'America/Buenos_Aires',
  CLP: 'America/Santiago',
  MXN: 'America/Mexico_City',
  EUR: 'Europe/Madrid',
};

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('PEN');
  const [timezone, setTimezone] = useState('America/Lima');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeOnboarding, skipOnboarding } = useOnboarding();
  const navigate = useNavigate();

  const totalSteps = 4;

  const handleNext = useCallback(() => {
    if (currentStep === 1 && businessName.length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [currentStep, businessName]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    skipOnboarding();
    navigate('/');
  }, [skipOnboarding, navigate]);

  const handleCurrencySelect = useCallback((selectedCurrency: string) => {
    setCurrency(selectedCurrency);
    setTimezone(CURRENCY_TIMEZONE[selectedCurrency] || 'America/Lima');
  }, []);

  const handleBusinessNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBusinessName(e.target.value);
  }, []);

  const handleComplete = useCallback(async (connectWhatsApp: boolean) => {
    setIsSubmitting(true);

    const formData: OnboardingData = {
      businessName,
      currency,
      timezone,
    };

    console.log('Saving onboarding data:', formData);

    const { error } = await completeOnboarding(formData);
    setIsSubmitting(false);

    if (error) {
      console.error('Onboarding save error:', error);
      toast.error('Error al guardar configuración');
      return;
    }

    toast.success('¡Configuración completada!');
    navigate(connectWhatsApp ? '/settings' : '/');
  }, [businessName, currency, timezone, completeOnboarding, navigate]);

  // Barra de progreso
  const ProgressBar = () => (
    <div className="flex gap-2 px-6 pt-6 pb-4">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i <= currentStep ? 'bg-emerald-500' : 'bg-slate-800'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <ProgressBar />

      {/* Step 0: Bienvenida */}
      {currentStep === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative">
          {/* Glow effect */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/30 rounded-full blur-[100px]" />

          {/* Logo */}
          <div className="relative z-10 mb-6">
            <img
              src="/logopresnetacion.png"
              alt="PayTrack"
              className="w-48 h-auto"
            />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2 relative z-10">
            ¡Bienvenido a
          </h1>
          <h1 className="text-3xl font-bold text-emerald-400 mb-4 relative z-10">
            PayTrack!
          </h1>

          <p className="text-slate-400 text-lg mb-12 max-w-xs relative z-10">
            Gestiona tus pagos de forma simple con WhatsApp e Inteligencia Artificial
          </p>

          <div className="flex-1" />

          <div className="w-full max-w-sm relative z-10">
            <button
              onClick={handleNext}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-500 text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/25"
            >
              Comenzar
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleSkip}
              className="mt-4 mb-8 w-full text-slate-500 text-sm hover:text-slate-400 transition-colors"
            >
              Saltar configuración
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Nombre del negocio */}
      {currentStep === 1 && (
        <div className="flex-1 flex flex-col px-6 relative">
          {/* Glow effect */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-[80px]" />

          <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-8 border border-emerald-500/30">
              <Building2 className="w-10 h-10 text-emerald-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              ¿Cómo se llama tu negocio?
            </h2>

            <p className="text-slate-400 text-sm mb-8 max-w-xs">
              Esto aparecerá en tus reportes y recordatorios de cobro para que tus clientes te identifiquen fácilmente.
            </p>

            <div className="w-full max-w-sm">
              <label className="block text-left text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">
                Nombre del negocio
              </label>
              <input
                type="text"
                placeholder="Ej: Mi Tienda Online"
                value={businessName}
                onChange={handleBusinessNameChange}
                autoFocus
                className="w-full py-4 px-5 rounded-xl bg-slate-800/50 border border-slate-700 text-white text-lg placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-6 relative z-10">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Atrás
            </button>

            <button
              onClick={handleNext}
              className="py-3 px-8 rounded-xl bg-emerald-500 text-white font-semibold flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-[0.98]"
            >
              Continuar
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Selección de moneda */}
      {currentStep === 2 && (
        <div className="flex-1 flex flex-col px-6 relative">
          {/* Glow effect */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-[80px]" />

          <div className="flex-1 flex flex-col items-center pt-8 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30">
              <span className="text-4xl">💰</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              ¿En qué moneda cobras?
            </h2>

            <p className="text-slate-400 text-center mb-8 text-sm">
              Puedes agregar más monedas después en la configuración.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.value}
                  onClick={() => handleCurrencySelect(curr.value)}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                    currency === curr.value
                      ? 'bg-emerald-500/15 border-2 border-emerald-500'
                      : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span className="text-3xl">{curr.flag}</span>
                  <div className="text-left">
                    <div className={`font-semibold ${
                      currency === curr.value ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {curr.value}
                    </div>
                    <div className={`text-sm ${
                      currency === curr.value ? 'text-emerald-400/70' : 'text-slate-500'
                    }`}>
                      {curr.label}
                    </div>
                  </div>
                  {currency === curr.value && (
                    <div className="ml-auto w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-6 relative z-10">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Atrás
            </button>

            <button
              onClick={handleNext}
              className="py-3 px-8 rounded-xl bg-emerald-500 text-white font-semibold flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-[0.98]"
            >
              Continuar
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Todo listo */}
      {currentStep === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative">
          {/* Glow effect */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/30 rounded-full blur-[100px]" />

          {/* Success checkmark */}
          <div className="relative z-10 mb-6">
            <div className="w-32 h-32 rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500">
              <Check className="w-16 h-16 text-emerald-400" strokeWidth={3} />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 relative z-10">
            ¡Todo listo!
          </h2>

          <p className="text-slate-400 text-lg mb-12 relative z-10">
            Tu cuenta está configurada y lista para empezar a recibir pagos.
          </p>

          <div className="flex-1" />

          <div className="w-full max-w-sm space-y-3 mb-8 relative z-10">
            <button
              onClick={() => handleComplete(true)}
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl bg-emerald-500 text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-500/25"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Conectar WhatsApp
                </>
              )}
            </button>

            <p className="text-emerald-400/70 text-sm flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Detecta pagos automáticamente
            </p>

            <button
              onClick={() => handleComplete(false)}
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl bg-slate-800/50 border border-slate-700 text-white font-semibold text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <LayoutDashboard className="w-5 h-5" />
                  Ir al Dashboard
                </>
              )}
            </button>

            <p className="text-slate-600 text-sm">
              Configura WhatsApp después
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
