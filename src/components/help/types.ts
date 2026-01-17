// Tipos para el sistema de Ayuda y Soporte

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  helpful?: number;
  notHelpful?: number;
}

export type FAQCategory =
  | 'pagos_deteccion'
  | 'errores_comunes'
  | 'whatsapp_conexion'
  | 'seguridad'
  | 'soporte_tecnico';

export const FAQ_CATEGORIES: Record<FAQCategory, { label: string; icon: string }> = {
  pagos_deteccion: { label: 'Pagos y Detección', icon: 'CreditCard' },
  errores_comunes: { label: 'Errores Comunes', icon: 'AlertTriangle' },
  whatsapp_conexion: { label: 'WhatsApp y Conexión', icon: 'MessageCircle' },
  seguridad: { label: 'Seguridad y Privacidad', icon: 'Shield' },
  soporte_tecnico: { label: 'Soporte Técnico', icon: 'Wrench' },
};

export interface PaymentContext {
  paymentId?: string;
  amount?: number;
  date?: string;
  origin?: string;
  status?: string;
  contactName?: string;
}

export interface AIAnalysis {
  id: string;
  timestamp: Date;
  problem: string;
  diagnosis: string;
  explanation: string;
  recommendation: string;
  resolved: boolean;
  paymentContext?: PaymentContext;
}

export type TicketCategory =
  | 'pago_no_detectado'
  | 'pago_incorrecto'
  | 'conexion_whatsapp'
  | 'error_sistema'
  | 'facturacion'
  | 'otro';

export const TICKET_CATEGORIES: Record<TicketCategory, string> = {
  pago_no_detectado: 'Pago no detectado',
  pago_incorrecto: 'Monto incorrecto',
  conexion_whatsapp: 'Problemas con WhatsApp',
  error_sistema: 'Error del sistema',
  facturacion: 'Facturación y cobros',
  otro: 'Otro problema',
};

export type TicketStatus = 'pending' | 'in_review' | 'resolved';

export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'yellow' },
  in_review: { label: 'En Revisión', color: 'blue' },
  resolved: { label: 'Resuelto', color: 'green' },
};

export interface SupportTicket {
  id: string;
  userId: string;
  category: TicketCategory;
  description: string;
  attachmentUrl?: string;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  paymentContext?: PaymentContext;
  aiAnalysis?: AIAnalysis;
  response?: string;
  estimatedResponseTime?: string;
}

export interface HelpSearchResult {
  type: 'faq' | 'article' | 'action';
  id: string;
  title: string;
  description: string;
  category?: string;
}
