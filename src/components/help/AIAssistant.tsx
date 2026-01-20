import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Send,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Bot,
  User,
  RefreshCw,
  CreditCard,
  Smartphone,
  Settings,
  MessageCircle,
} from 'lucide-react';
import { PaymentContext, AIAnalysis } from './types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface AIAssistantProps {
  initialQuestion?: string;
  paymentContext?: PaymentContext;
  onBack: () => void;
  onCreateTicket: (analysis?: AIAnalysis) => void;
}

interface AnalysisResult {
  diagnosis: string;
  explanation: string;
  recommendation: string;
  resolved: boolean;
  confidence: number;
  category?: string;
  suggestedActions?: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysis?: AnalysisResult;
}

// Quick action buttons
const quickActions = [
  {
    id: 'payment',
    icon: CreditCard,
    label: 'Pago no detectado',
    query: 'Un pago de mi cliente no fue detectado automáticamente',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  },
  {
    id: 'whatsapp',
    icon: Smartphone,
    label: 'WhatsApp desconectado',
    query: 'Mi WhatsApp se desconectó y no recibo mensajes',
    color: 'text-green-400 bg-green-500/10 border-green-500/20'
  },
  {
    id: 'config',
    icon: Settings,
    label: 'Configuración cuenta',
    query: 'Necesito ayuda con la configuración de mi cuenta',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  },
  {
    id: 'human',
    icon: MessageCircle,
    label: 'Hablar con humano',
    query: 'Quiero hablar con un agente de soporte humano',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
  },
];

// Call Edge Function
const analyzeWithAI = async (problem: string, context?: PaymentContext): Promise<AnalysisResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-support', {
      body: {
        problem,
        context: context ? {
          contactName: context.contactName,
          amount: context.amount,
          date: context.date,
          paymentId: context.paymentId,
        } : undefined,
      },
    });

    if (error) {
      console.error('Error calling AI support:', error);
      throw new Error(error.message);
    }

    if (data?.success && data?.analysis) {
      return data.analysis;
    }

    throw new Error('Respuesta inválida del servidor');
  } catch (error) {
    console.error('Error en análisis IA:', error);
    return {
      diagnosis: 'No se pudo conectar con el asistente IA',
      explanation: 'Hubo un problema al procesar tu consulta. Esto puede deberse a una conexión lenta o un error temporal.',
      recommendation: 'Por favor intenta nuevamente en unos segundos o crea un ticket de soporte para asistencia inmediata.',
      resolved: false,
      confidence: 0,
    };
  }
};

export function AIAssistant({
  initialQuestion = '',
  paymentContext,
  onBack,
  onCreateTicket,
}: AIAssistantProps) {
  const [inputValue, setInputValue] = useState(initialQuestion);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (query?: string) => {
    const text = query || inputValue;
    if (!text.trim() || isAnalyzing) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsAnalyzing(true);
    setFeedback(null);

    try {
      const analysis = await analyzeWithAI(text, paymentContext);
      setLastAnalysis(analysis);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: analysis.explanation,
        timestamp: new Date(),
        analysis,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTicketWithContext = () => {
    if (lastAnalysis) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      onCreateTicket({
        id: `ai-${Date.now()}`,
        timestamp: new Date(),
        problem: lastUserMessage?.content || inputValue,
        diagnosis: lastAnalysis.diagnosis,
        explanation: lastAnalysis.explanation,
        recommendation: lastAnalysis.recommendation,
        resolved: lastAnalysis.resolved,
        paymentContext,
      });
    } else {
      onCreateTicket();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setLastAnalysis(null);
    setFeedback(null);
    setInputValue('');
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      payment: 'bg-blue-500/20 text-blue-400',
      whatsapp: 'bg-green-500/20 text-green-400',
      account: 'bg-purple-500/20 text-purple-400',
      technical: 'bg-orange-500/20 text-orange-400',
      other: 'bg-slate-500/20 text-slate-400',
    };
    return colors[category || 'other'] || colors.other;
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Asistente IA</h1>
              <p className="text-xs text-slate-500">Desarrollado por Gemini</p>
            </div>
          </div>
        </div>
        {hasMessages && (
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Nueva conversación"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto py-4">
        {!hasMessages ? (
          // Welcome Screen
          <div className="h-full flex flex-col">
            {/* Welcome Message */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">¡Hola! Soy tu asistente de soporte</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Puedo ayudarte con problemas de pagos, conexión de WhatsApp y más. ¿En qué puedo ayudarte hoy?
                  </p>
                  <p className="text-xs text-emerald-400/70 mt-2">Disponible 24/7</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">
                Preguntas frecuentes
              </p>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleSend(action.query)}
                    disabled={isAnalyzing}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50',
                      action.color
                    )}
                  >
                    <action.icon className="w-6 h-6 mb-2" />
                    <p className="text-sm font-medium text-white">{action.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Chat Messages
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={cn(
                  'max-w-[85%] rounded-2xl p-4',
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-white rounded-br-md'
                    : 'bg-slate-800/70 border border-slate-700/50 rounded-bl-md'
                )}>
                  {msg.role === 'assistant' && msg.analysis && (
                    <div className="mb-3 pb-3 border-b border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          getCategoryColor(msg.analysis.category)
                        )}>
                          {msg.analysis.category === 'payment' ? 'Pagos' :
                           msg.analysis.category === 'whatsapp' ? 'WhatsApp' :
                           msg.analysis.category === 'account' ? 'Cuenta' :
                           msg.analysis.category === 'technical' ? 'Técnico' : 'General'}
                        </span>
                        <span className={cn(
                          'flex items-center gap-1 text-xs',
                          msg.analysis.resolved ? 'text-emerald-400' : 'text-amber-400'
                        )}>
                          {msg.analysis.resolved ? (
                            <><CheckCircle className="w-3 h-3" /> Resuelto</>
                          ) : (
                            <><AlertCircle className="w-3 h-3" /> Requiere acción</>
                          )}
                        </span>
                      </div>
                      <p className="font-medium text-white text-sm">{msg.analysis.diagnosis}</p>
                    </div>
                  )}

                  <p className={cn(
                    'text-sm leading-relaxed',
                    msg.role === 'user' ? 'text-white' : 'text-slate-300'
                  )}>
                    {msg.content}
                  </p>

                  {msg.role === 'assistant' && msg.analysis?.recommendation && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-xs text-emerald-400 font-medium mb-1">💡 Recomendación:</p>
                      <p className="text-sm text-slate-300">{msg.analysis.recommendation}</p>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading */}
            {isAnalyzing && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl rounded-bl-md p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analizando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Feedback (only show after response) */}
      {hasMessages && lastAnalysis && !isAnalyzing && (
        <div className="py-3 border-t border-slate-800 flex-shrink-0">
          {feedback ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {feedback === 'helpful' ? '✨ ¡Gracias!' : '📝 Lo tendremos en cuenta'}
              </p>
              {feedback === 'not_helpful' && (
                <button
                  onClick={handleCreateTicketWithContext}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 transition-colors"
                >
                  Crear ticket
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">¿Te fue útil?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFeedback('helpful')}
                  className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFeedback('not_helpful')}
                  className="p-2 rounded-xl bg-slate-700/50 text-slate-400 hover:bg-slate-700 transition-colors"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="pt-3 border-t border-slate-800 flex-shrink-0">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              placeholder="Escribe tu pregunta..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none resize-none text-sm"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isAnalyzing}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">
          Presiona Enter para enviar
        </p>
      </div>
    </div>
  );
}
