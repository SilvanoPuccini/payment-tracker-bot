import { useState } from 'react';
import {
  Search,
  CreditCard,
  MessageCircle,
  AlertTriangle,
  HelpCircle,
  Headphones,
  ChevronRight,
  Sparkles,
  FileText,
  Clock,
  Home,
  Mail,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HelpHubProps {
  onNavigate: (section: string) => void;
  onSearch: (query: string) => void;
}

interface QuickAccessItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  section: string;
}

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: 'payments',
    title: 'Problemas con Pagos',
    description: 'Detección, montos incorrectos',
    icon: <CreditCard className="w-5 h-5" />,
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    section: 'faq:pagos_deteccion',
  },
  {
    id: 'whatsapp',
    title: 'Conexión WhatsApp',
    description: 'QR, desconexión, errores',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    section: 'faq:whatsapp_conexion',
  },
];

const MENU_ITEMS = [
  {
    id: 'faq',
    title: 'Preguntas Frecuentes',
    description: 'Respuestas rápidas sobre pagos y WhatsApp',
    icon: <HelpCircle className="w-5 h-5" />,
    section: 'faq',
  },
  {
    id: 'ai-assistant',
    title: 'Asistente IA',
    description: 'Análisis inteligente de problemas',
    icon: <Sparkles className="w-5 h-5" />,
    section: 'ai-assistant',
  },
  {
    id: 'tickets',
    title: 'Estado de Mis Tickets',
    description: 'Seguimiento de solicitudes',
    icon: <FileText className="w-5 h-5" />,
    section: 'tickets',
  },
  {
    id: 'contact',
    title: 'Contactar Soporte',
    description: 'Crear nuevo ticket de soporte',
    icon: <Headphones className="w-5 h-5" />,
    section: 'create-ticket',
  },
];

const POPULAR_ARTICLES = [
  { id: '1', title: '¿Cómo conectar múltiples números?', section: 'faq' },
  { id: '2', title: 'Configurar disparadores de IA', section: 'faq' },
  { id: '3', title: 'Preguntas sobre facturación mensual', section: 'faq' },
];

export function HelpHub({ onNavigate, onSearch }: HelpHubProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Ayuda y Soporte</h1>
          <p className="text-sm text-slate-400">¿En qué podemos ayudarte?</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <Input
          type="text"
          placeholder="Buscar guías, errores o funciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
        />
      </form>

      {/* Quick Access */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Acceso Rápido</h2>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACCESS_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.section)}
              className={cn(
                'p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]',
                item.color
              )}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/10">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Errores Comunes Alert */}
      <button
        onClick={() => onNavigate('faq:errores_comunes')}
        className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left hover:bg-amber-500/15 transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <div className="flex-1">
            <p className="font-medium text-amber-400 text-sm">Errores Comunes</p>
            <p className="text-xs text-slate-400">Soluciones rápidas del último formato</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400" />
        </div>
      </button>

      {/* Menu Items */}
      <div className="space-y-2">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.section)}
            className="w-full p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-left hover:bg-slate-800/50 hover:border-slate-600 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-700/50 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{item.title}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {/* Popular Articles */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Artículos Populares</h2>
        <div className="space-y-2">
          {POPULAR_ARTICLES.map((article) => (
            <button
              key={article.id}
              onClick={() => onNavigate(article.section)}
              className="w-full flex items-center gap-2 text-left text-sm text-slate-300 hover:text-emerald-400 transition-colors py-1"
            >
              <ChevronRight className="w-3 h-3 text-slate-600" />
              {article.title}
            </button>
          ))}
        </div>
      </div>

      {/* Human Support Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Headphones className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white text-sm">Hablar con un asesor</p>
            <p className="text-xs text-slate-400 mt-1">
              Nuestro equipo está disponible 24/7.
              <br />
              Respondemos en menos de 20 minutos.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
              <button
                onClick={() => onNavigate('create-ticket')}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Iniciar un Chat
              </button>
              <button
                onClick={() => onNavigate('email-support')}
                className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-xs font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" />
                Soporte por Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
