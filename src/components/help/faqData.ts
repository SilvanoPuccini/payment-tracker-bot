import { FAQItem } from './types';

export const FAQ_DATA: FAQItem[] = [
  // PAGOS Y DETECCIÓN
  {
    id: 'faq-1',
    question: '¿Qué métodos de pago son compatibles?',
    answer: 'PayTrack detecta automáticamente pagos realizados a través de transferencias bancarias, pagos con tarjeta, y cualquier comprobante compartido vía WhatsApp. La IA analiza imágenes de comprobantes, capturas de pantalla de transferencias, y mensajes de texto con información de pago.',
    category: 'pagos_deteccion',
  },
  {
    id: 'faq-2',
    question: '¿Qué tan rápida es la verificación?',
    answer: 'La verificación es instantánea. Una vez que el cliente envía un comprobante por WhatsApp, nuestra IA lo procesa en segundos y actualiza el estado del pago automáticamente. Recibirás una notificación cuando se detecte un nuevo pago.',
    category: 'pagos_deteccion',
  },
  {
    id: 'faq-3',
    question: '¿Pago no detectado?',
    answer: 'Si un pago no fue detectado automáticamente, puede deberse a: 1) La imagen del comprobante está borrosa o cortada, 2) El formato no es reconocible, 3) Falta información clave como monto o fecha. Puedes usar el Asistente IA para analizar el problema específico o crear un ticket de soporte.',
    category: 'pagos_deteccion',
  },
  {
    id: 'faq-4',
    question: '¿Cómo funciona la detección automática de pagos?',
    answer: 'Nuestra IA analiza los mensajes de WhatsApp en busca de: comprobantes de transferencia, capturas de apps bancarias, y mensajes con información de pago. Utiliza visión por computadora para extraer montos, fechas y referencias, y los asocia automáticamente con tus clientes.',
    category: 'pagos_deteccion',
  },

  // ERRORES COMUNES
  {
    id: 'faq-5',
    question: '¿Por qué el monto detectado es diferente?',
    answer: 'Esto puede ocurrir cuando: 1) El comprobante incluye comisiones o impuestos, 2) La imagen tiene baja calidad, 3) Hay múltiples montos visibles en la imagen. Puedes corregir el monto manualmente desde el detalle del pago o reportarlo para mejorar la IA.',
    category: 'errores_comunes',
  },
  {
    id: 'faq-6',
    question: '¿Qué hago si un pago se asignó al cliente incorrecto?',
    answer: 'Puedes reasignar el pago fácilmente: 1) Ve al detalle del pago, 2) Selecciona "Cambiar cliente", 3) Busca el cliente correcto. El sistema aprenderá de esta corrección para futuras detecciones.',
    category: 'errores_comunes',
  },
  {
    id: 'faq-7',
    question: '¿Por qué aparece "Error al procesar"?',
    answer: 'Este error generalmente indica que: 1) La imagen está corrupta o en formato no soportado, 2) El servidor de procesamiento está temporalmente ocupado, 3) El mensaje de WhatsApp no se sincronizó correctamente. Intenta reenviar el comprobante o contacta soporte si persiste.',
    category: 'errores_comunes',
  },

  // WHATSAPP Y CONEXIÓN
  {
    id: 'faq-8',
    question: '¿Cómo conecto mi WhatsApp Business?',
    answer: 'Para conectar WhatsApp: 1) Ve a Configuración > WhatsApp, 2) Haz clic en "Conectar WhatsApp Business", 3) Escanea el código QR con tu teléfono, 4) Autoriza la conexión. Necesitas una cuenta de WhatsApp Business activa.',
    category: 'whatsapp_conexion',
  },
  {
    id: 'faq-9',
    question: '¿Por qué se desconectó mi WhatsApp?',
    answer: 'WhatsApp puede desconectarse por: 1) Sesión cerrada en el teléfono, 2) Actualización de WhatsApp, 3) Cambio de número, 4) Inactividad prolongada. Reconecta desde Configuración > WhatsApp escaneando el código QR nuevamente.',
    category: 'whatsapp_conexion',
  },
  {
    id: 'faq-10',
    question: '¿Puedo usar WhatsApp personal?',
    answer: 'Recomendamos usar WhatsApp Business para una mejor experiencia. Sin embargo, WhatsApp personal también es compatible. Ten en cuenta que algunos features como respuestas automáticas requieren WhatsApp Business.',
    category: 'whatsapp_conexion',
  },

  // SEGURIDAD Y PRIVACIDAD
  {
    id: 'faq-11',
    question: '¿Mis datos están seguros?',
    answer: 'Sí, implementamos múltiples capas de seguridad: 1) Encriptación end-to-end para mensajes, 2) Almacenamiento seguro con encriptación AES-256, 3) Autenticación de dos factores disponible, 4) Cumplimiento con GDPR y regulaciones locales. No compartimos tus datos con terceros.',
    category: 'seguridad',
  },
  {
    id: 'faq-12',
    question: '¿Quién puede ver mis pagos?',
    answer: 'Solo tú tienes acceso a tu información de pagos. Ni siquiera nuestro equipo de soporte puede ver tus datos financieros sin tu autorización explícita. Puedes gestionar permisos desde Configuración > Privacidad.',
    category: 'seguridad',
  },
  {
    id: 'faq-13',
    question: '¿Cómo protegen mis comprobantes?',
    answer: 'Los comprobantes se almacenan encriptados en servidores seguros. Las imágenes se procesan en memoria y se eliminan después del análisis. Solo se guardan los datos extraídos (monto, fecha, referencia) de forma segura.',
    category: 'seguridad',
  },

  // SOPORTE TÉCNICO
  {
    id: 'faq-14',
    question: '¿Cómo contacto soporte?',
    answer: 'Tienes varias opciones: 1) Usar el Asistente IA para resolución inmediata, 2) Crear un ticket de soporte desde esta sección, 3) Escribir a soporte@paytrack.app, 4) Chat en vivo disponible en horario laboral (Lun-Vie 9-18hs).',
    category: 'soporte_tecnico',
  },
  {
    id: 'faq-15',
    question: '¿Cuánto tarda la respuesta de soporte?',
    answer: 'Nuestros tiempos de respuesta promedio son: Asistente IA: inmediato, Tickets: 2-4 horas en horario laboral, Email: 24-48 horas. Los usuarios Premium tienen prioridad y respuesta garantizada en menos de 2 horas.',
    category: 'soporte_tecnico',
  },
  {
    id: 'faq-16',
    question: '¿Puedo solicitar una función nueva?',
    answer: 'Nos encanta recibir sugerencias. Puedes enviar tus ideas de nuevas funciones creando un ticket con categoría "Sugerencia" o escribiendo a feedback@paytrack.app. Evaluamos todas las propuestas para futuras actualizaciones.',
    category: 'soporte_tecnico',
  },
];

export const getFilteredFAQ = (category?: string, searchQuery?: string): FAQItem[] => {
  let filtered = FAQ_DATA;

  if (category && category !== 'all') {
    filtered = filtered.filter((item) => item.category === category);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }

  return filtered;
};
