// =============================================
// SISTEMA MULTI-MONEDA
// =============================================

export const CURRENCIES = {
  PEN: { symbol: 'S/', name: 'Sol Peruano', locale: 'es-PE', flag: '🇵🇪' },
  USD: { symbol: '$', name: 'Dolar Estadounidense', locale: 'en-US', flag: '🇺🇸' },
  ARS: { symbol: '$', name: 'Peso Argentino', locale: 'es-AR', flag: '🇦🇷' },
  CLP: { symbol: '$', name: 'Peso Chileno', locale: 'es-CL', flag: '🇨🇱' },
  COP: { symbol: '$', name: 'Peso Colombiano', locale: 'es-CO', flag: '🇨🇴' },
  MXN: { symbol: '$', name: 'Peso Mexicano', locale: 'es-MX', flag: '🇲🇽' },
  EUR: { symbol: '€', name: 'Euro', locale: 'es-ES', flag: '🇪🇺' },
  BRL: { symbol: 'R$', name: 'Real Brasileno', locale: 'pt-BR', flag: '🇧🇷' },
  BOB: { symbol: 'Bs', name: 'Boliviano', locale: 'es-BO', flag: '🇧🇴' },
  UYU: { symbol: '$U', name: 'Peso Uruguayo', locale: 'es-UY', flag: '🇺🇾' },
  PYG: { symbol: '₲', name: 'Guarani', locale: 'es-PY', flag: '🇵🇾' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'PEN',
  options?: { showSymbol?: boolean; showCode?: boolean }
): string {
  const { showSymbol = true, showCode = false } = options || {};

  const formatted = new Intl.NumberFormat(CURRENCIES[currency].locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (showCode && !showSymbol) {
    return `${currency} ${formatted}`;
  }

  return formatted;
}

export function formatCompactCurrency(amount: number, currency: CurrencyCode = 'PEN'): string {
  if (amount >= 1000000) {
    return `${CURRENCIES[currency].symbol}${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${CURRENCIES[currency].symbol}${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currency);
}

// Cache de tasas de cambio
let exchangeRatesCache: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

// Tasas de cambio aproximadas (fallback si la API falla)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  PEN: 3.72,
  ARS: 850,
  CLP: 880,
  COP: 3950,
  MXN: 17.2,
  EUR: 0.92,
  BRL: 4.95,
  BOB: 6.91,
  UYU: 39.5,
  PYG: 7300,
};

export async function getExchangeRates(baseCurrency: CurrencyCode = 'USD'): Promise<Record<string, number>> {
  // Check cache
  if (exchangeRatesCache && Date.now() - exchangeRatesCache.timestamp < CACHE_DURATION) {
    return exchangeRatesCache.rates;
  }

  try {
    // Using exchangerate-api.com free tier
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    exchangeRatesCache = {
      rates: data.rates,
      timestamp: Date.now(),
    };

    return data.rates;
  } catch (error) {
    console.warn('Using fallback exchange rates:', error);
    return FALLBACK_RATES;
  }
}

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<string, number>
): number {
  if (from === to) return amount;

  // Convert to USD first, then to target currency
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;

  const inUSD = amount / fromRate;
  return inUSD * toRate;
}

export function getCurrencyOptions() {
  return Object.entries(CURRENCIES).map(([code, data]) => ({
    value: code,
    label: `${data.flag} ${code} - ${data.name}`,
    symbol: data.symbol,
  }));
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency]?.symbol || currency;
}
