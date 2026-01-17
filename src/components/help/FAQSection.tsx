import { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ArrowLeft,
  CreditCard,
  AlertTriangle,
  MessageCircle,
  Shield,
  Wrench,
  HelpCircle,
  Headphones,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FAQ_CATEGORIES, FAQCategory } from './types';
import { FAQ_DATA, getFilteredFAQ } from './faqData';
import { cn } from '@/lib/utils';

interface FAQSectionProps {
  initialCategory?: FAQCategory | null;
  onBack: () => void;
  onAskAI: (question: string) => void;
  onCreateTicket: () => void;
}

const CATEGORY_ICONS: Record<FAQCategory, React.ReactNode> = {
  pagos_deteccion: <CreditCard className="w-4 h-4" />,
  errores_comunes: <AlertTriangle className="w-4 h-4" />,
  whatsapp_conexion: <MessageCircle className="w-4 h-4" />,
  seguridad: <Shield className="w-4 h-4" />,
  soporte_tecnico: <Wrench className="w-4 h-4" />,
};

export function FAQSection({ initialCategory, onBack, onAskAI, onCreateTicket }: FAQSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'all'>(
    initialCategory || 'all'
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'helpful' | 'not_helpful' | null>>({});

  const filteredFAQ = getFilteredFAQ(
    selectedCategory === 'all' ? undefined : selectedCategory,
    searchQuery
  );

  const handleFeedback = (faqId: string, isHelpful: boolean) => {
    setFeedback((prev) => ({
      ...prev,
      [faqId]: isHelpful ? 'helpful' : 'not_helpful',
    }));
  };

  const categories = [
    { value: 'all' as const, label: 'Todos' },
    ...Object.entries(FAQ_CATEGORIES).map(([value, { label }]) => ({
      value: value as FAQCategory,
      label,
    })),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Preguntas Frecuentes</h1>
          <p className="text-sm text-slate-400">
            Encuentra respuestas rápidas sobre nuestro sistema de pagos por WhatsApp
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <Input
          type="text"
          placeholder="Buscar pagos, errores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              selectedCategory === cat.value
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFAQ.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No se encontraron resultados</p>
            <button
              onClick={() => onAskAI(searchQuery)}
              className="mt-3 text-emerald-400 text-sm hover:underline flex items-center gap-1 mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              Pregunta a la IA
            </button>
          </div>
        ) : (
          filteredFAQ.map((faq) => (
            <div
              key={faq.id}
              className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden"
            >
              {/* Question Header */}
              <button
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-800/50 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  {CATEGORY_ICONS[faq.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm pr-6">{faq.question}</p>
                </div>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-slate-500 transition-transform flex-shrink-0',
                    expandedId === faq.id && 'rotate-180'
                  )}
                />
              </button>

              {/* Answer Content */}
              {expandedId === faq.id && (
                <div className="px-4 pb-4 pt-0">
                  <div className="pl-10">
                    <p className="text-sm text-slate-300 leading-relaxed">{faq.answer}</p>

                    {/* Feedback Section */}
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      {feedback[faq.id] ? (
                        <p className="text-xs text-slate-500">
                          {feedback[faq.id] === 'helpful'
                            ? '¡Gracias por tu feedback!'
                            : 'Lamentamos que no haya sido útil.'}
                        </p>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500">¿Te resultó útil?</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleFeedback(faq.id, true)}
                              className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleFeedback(faq.id, false)}
                              className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Not helpful actions */}
                      {feedback[faq.id] === 'not_helpful' && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => onAskAI(faq.question)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Preguntar a la IA
                          </button>
                          <button
                            onClick={onCreateTicket}
                            className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors flex items-center gap-1"
                          >
                            <Headphones className="w-3.5 h-3.5" />
                            Crear Ticket
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Didn't find answer? */}
      <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
        <p className="text-sm text-slate-400 mb-3">¿No encontraste lo que buscabas?</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onAskAI(searchQuery || '')}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Preguntar a la IA
          </button>
          <button
            onClick={onCreateTicket}
            className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 transition-colors flex items-center gap-2"
          >
            <Headphones className="w-4 h-4" />
            Contactar Soporte
          </button>
        </div>
      </div>
    </div>
  );
}
