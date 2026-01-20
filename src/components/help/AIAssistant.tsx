import { useState, useRef, useEffect, useCallback } from 'react';
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
  Clock,
} from 'lucide-react';
import { PaymentContext, AIAnalysis } from './types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Generate unique idempotency key
const generateIdempotencyKey = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Hash function for payload deduplication
const hashPayload = (problem: string, context?: PaymentContext): string => {
  const payload = JSON.stringify({ problem: problem.trim().toLowerCase(), context });
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

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

// Error types for differentiated handling
type AIErrorType = 'rate_limit' | 'network' | 'server' | 'timeout' | 'unknown';

interface AIError extends Error {
  type: AIErrorType;
  retryAfter?: number;
}

// Get Supabase URL and anon key for direct fetch
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Call Edge Function with idempotency and abort support
const analyzeWithAI = async (
  problem: string,
  context?: PaymentContext,
  idempotencyKey?: string,
  signal?: AbortSignal
): Promise<AnalysisResult> => {
  try {
    // Create fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    // Combine abort signals
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    // Get session token if user is logged in (optional but recommended for better rate limits)
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    // Build headers - include Authorization if we have a token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Use direct fetch - auth is optional, function handles both cases
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-support`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        problem,
        context: context ? {
          contactName: context.contactName,
          amount: context.amount,
          date: context.date,
          paymentId: context.paymentId,
        } : undefined,
        idempotencyKey,
        payloadHash: hashPayload(problem, context),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    const data = await response.json();
    const error = !response.ok ? { message: data.error || `HTTP ${response.status}` } : null;

    if (error) {
      console.error('Error calling AI support:', error);
      const aiError = new Error(error.message) as AIError;

      // Detect error type from message
      if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate')) {
        aiError.type = 'rate_limit';
        aiError.retryAfter = 30;
      } else if (error.message?.includes('timeout') || error.message?.includes('aborted')) {
        aiError.type = 'timeout';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        aiError.type = 'network';
      } else if (error.message?.includes('500') || error.message?.includes('server')) {
        aiError.type = 'server';
      } else {
        aiError.type = 'unknown';
      }

      throw aiError;
    }

    if (data?.success && data?.analysis) {
      return data.analysis;
    }

    // Handle rate limit response from backend
    if (data?.error === 'rate_limit') {
      const aiError = new Error(data.message || 'Límite de solicitudes excedido') as AIError;
      aiError.type = 'rate_limit';
      aiError.retryAfter = data.retryAfter || 30;
      throw aiError;
    }

    throw new Error('Respuesta inválida del servidor');
  } catch (error) {
    console.error('Error en análisis IA:', error);

    const aiError = error as AIError;

    // Return specific error messages based on type
    if (aiError.type === 'rate_limit') {
      return {
        diagnosis: 'Límite de solicitudes alcanzado',
        explanation: `Has realizado demasiadas consultas en poco tiempo. Por favor espera ${aiError.retryAfter || 30} segundos antes de intentar nuevamente.`,
        recommendation: 'Utiliza el sistema de tickets si necesitas ayuda urgente mientras esperas.',
        resolved: false,
        confidence: 0,
        category: 'technical',
        isRateLimited: true,
        retryAfter: aiError.retryAfter,
      } as AnalysisResult & { isRateLimited?: boolean; retryAfter?: number };
    }

    if (aiError.name === 'AbortError' || aiError.type === 'timeout') {
      return {
        diagnosis: 'Tiempo de espera agotado',
        explanation: 'La consulta tardó demasiado en procesarse. Esto puede deberse a alta demanda del servicio.',
        recommendation: 'Intenta nuevamente en unos momentos o simplifica tu consulta.',
        resolved: false,
        confidence: 0,
      };
    }

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
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Request lock (mutex) to prevent concurrent requests
  const isRequestPending = useRef(false);
  // AbortController ref for canceling previous requests
  const abortControllerRef = useRef<AbortController | null>(null);
  // Last processed payload hash to prevent duplicate submissions
  const lastPayloadHashRef = useRef<string>('');

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

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;

    const timer = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSend = useCallback(async (query?: string) => {
    const text = query || inputValue;
    if (!text.trim()) return;

    // Check rate limit
    if (rateLimitCountdown > 0) {
      console.log('Rate limited, countdown:', rateLimitCountdown);
      return;
    }

    // Request lock - prevent concurrent requests
    if (isRequestPending.current) {
      console.log('Request already pending, ignoring');
      return;
    }

    // Payload deduplication - prevent identical requests within short time
    const currentHash = hashPayload(text, paymentContext);
    if (currentHash === lastPayloadHashRef.current && messages.length > 0) {
      console.log('Duplicate payload detected, ignoring');
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    // Set lock and update hash
    isRequestPending.current = true;
    lastPayloadHashRef.current = currentHash;

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
      // Generate idempotency key for this request
      const idempotencyKey = generateIdempotencyKey();

      const analysis = await analyzeWithAI(
        text,
        paymentContext,
        idempotencyKey,
        abortControllerRef.current.signal
      );

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('Request was aborted');
        return;
      }

      setLastAnalysis(analysis);

      // Handle rate limit in response
      const analysisWithRateLimit = analysis as AnalysisResult & { isRateLimited?: boolean; retryAfter?: number };
      if (analysisWithRateLimit.isRateLimited && analysisWithRateLimit.retryAfter) {
        setRateLimitCountdown(analysisWithRateLimit.retryAfter);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: analysis.explanation,
        timestamp: new Date(),
        analysis,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Only log if not aborted
      if (!(error instanceof Error && error.name === 'AbortError')) {
        console.error('Error in handleSend:', error);
      }
    } finally {
      isRequestPending.current = false;
      setIsAnalyzing(false);
    }
  }, [inputValue, paymentContext, rateLimitCountdown, messages.length]);

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
                    disabled={isAnalyzing || rateLimitCountdown > 0}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
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
              disabled={!inputValue.trim() || isAnalyzing || rateLimitCountdown > 0}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : rateLimitCountdown > 0 ? (
                <Clock className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">
          {rateLimitCountdown > 0 ? (
            <span className="text-amber-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Espera {rateLimitCountdown}s antes de enviar
            </span>
          ) : (
            'Presiona Enter para enviar'
          )}
        </p>
      </div>
    </div>
  );
}
