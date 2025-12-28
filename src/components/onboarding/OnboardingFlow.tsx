import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useOnboarding, OnboardingData } from '@/hooks/useOnboarding';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Settings, LayoutDashboard } from 'lucide-react';

const CURRENCIES = [
  { value: 'PEN', label: 'Soles (PEN)', symbol: 'S/' },
  { value: 'USD', label: 'Dolares (USD)', symbol: '$' },
  { value: 'ARS', label: 'Pesos Argentinos (ARS)', symbol: '$' },
  { value: 'CLP', label: 'Pesos Chilenos (CLP)', symbol: '$' },
  { value: 'COP', label: 'Pesos Colombianos (COP)', symbol: '$' },
  { value: 'MXN', label: 'Pesos Mexicanos (MXN)', symbol: '$' },
  { value: 'EUR', label: 'Euros (EUR)', symbol: 'E' },
];

const TIMEZONES = [
  { value: 'America/Lima', label: 'Lima, Peru (GMT-5)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires, Argentina (GMT-3)' },
  { value: 'America/Santiago', label: 'Santiago, Chile (GMT-3)' },
  { value: 'America/Bogota', label: 'Bogota, Colombia (GMT-5)' },
  { value: 'America/Mexico_City', label: 'Ciudad de Mexico (GMT-6)' },
  { value: 'Europe/Madrid', label: 'Madrid, Espana (GMT+1)' },
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    businessName: '',
    currency: 'PEN',
    timezone: 'America/Lima',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeOnboarding, skipOnboarding } = useOnboarding();
  const navigate = useNavigate();

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep === 1 && formData.businessName.length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    skipOnboarding();
    navigate('/');
  };

  const handleComplete = async (goToSettings: boolean) => {
    setIsSubmitting(true);
    const { error } = await completeOnboarding(formData);
    setIsSubmitting(false);

    if (error) {
      toast.error('Error al guardar configuracion');
      return;
    }

    toast.success('Configuracion completada!');
    navigate(goToSettings ? '/settings' : '/');
  };

  const renderProgress = () => (
    <div className="flex gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={"h-2 flex-1 rounded-full transition-all duration-300 " + (i <= currentStep ? 'bg-emerald-500' : 'bg-slate-700')}
        />
      ))}
    </div>
  );

  const renderStep0 = () => (
    <div className="text-center space-y-6">
      <div className="text-7xl">&#128075;</div>
      <h1 className="text-3xl font-bold text-foreground">
        Bienvenido a PayTrack!
      </h1>
      <p className="text-lg text-muted-foreground">
        Configuremos tu cuenta en 2 minutos
      </p>
      <Button
        size="lg"
        className="bg-emerald-500 hover:bg-emerald-600 text-white mt-4"
        onClick={handleNext}
      >
        Comenzar
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">&#127970;</div>
        <h2 className="text-2xl font-bold text-foreground">Tu Negocio</h2>
        <p className="text-muted-foreground">
          Para personalizar tu experiencia
        </p>
      </div>
      <div className="space-y-4">
        <Label htmlFor="businessName">Nombre de tu negocio o empresa</Label>
        <Input
          id="businessName"
          placeholder="Ej: Mi Tienda, Juan Perez Consultoria"
          value={formData.businessName}
          onChange={(e) =>
            setFormData({ ...formData, businessName: e.target.value })
          }
          className="text-lg py-6"
        />
        <p className="text-sm text-muted-foreground">
          Minimo 2 caracteres
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">&#127758;</div>
        <h2 className="text-2xl font-bold text-foreground">
          Configuracion Regional
        </h2>
        <p className="text-muted-foreground">
          Selecciona tu moneda y zona horaria
        </p>
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Moneda principal</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) =>
              setFormData({ ...formData, currency: value })
            }
          >
            <SelectTrigger className="text-lg py-6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.symbol} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label>Zona horaria</Label>
          <Select
            value={formData.timezone}
            onValueChange={(value) =>
              setFormData({ ...formData, timezone: value })
            }
          >
            <SelectTrigger className="text-lg py-6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <p className="text-sm text-muted-foreground">
            Ejemplo de formato:{' '}
            <span className="text-foreground font-medium">
              {CURRENCIES.find((c) => c.value === formData.currency)?.symbol}
              1,500.00
            </span>
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center space-y-6">
      <div className="text-7xl">&#127881;</div>
      <h2 className="text-3xl font-bold text-foreground">Todo listo!</h2>
      <p className="text-lg text-muted-foreground">
        Tu cuenta esta configurada
      </p>
      <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-left">
        <h3 className="font-semibold mb-2">Resumen:</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <span className="text-foreground">Negocio:</span>{' '}
            {formData.businessName}
          </li>
          <li>
            <span className="text-foreground">Moneda:</span>{' '}
            {CURRENCIES.find((c) => c.value === formData.currency)?.label}
          </li>
          <li>
            <span className="text-foreground">Zona horaria:</span>{' '}
            {TIMEZONES.find((tz) => tz.value === formData.timezone)?.label}
          </li>
        </ul>
      </div>
      <div className="flex flex-col gap-3 pt-4">
        <Button
          size="lg"
          variant="outline"
          className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
          onClick={() => handleComplete(true)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Settings className="mr-2 h-5 w-5" />
          )}
          Conectar WhatsApp
        </Button>
        <Button
          size="lg"
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
          onClick={() => handleComplete(false)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <LayoutDashboard className="mr-2 h-5 w-5" />
          )}
          Ir al Dashboard
        </Button>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur">
        <CardContent className="p-8">
          {renderProgress()}
          
          <div className="min-h-[400px] flex flex-col justify-center">
            {renderStep()}
          </div>

          {currentStep > 0 && currentStep < 3 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atras
              </Button>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600"
                onClick={handleNext}
              >
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {currentStep > 0 && currentStep < 3 && (
            <div className="text-center mt-4">
              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleSkip}
              >
                Saltar por ahora
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
