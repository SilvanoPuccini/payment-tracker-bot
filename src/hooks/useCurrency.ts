import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  formatCurrency as formatCurrencyLib,
  convertCurrency,
  getExchangeRates,
  CURRENCIES,
  type CurrencyCode,
} from '@/lib/currency';

interface UseCurrencyReturn {
  currency: CurrencyCode;
  currencyInfo: typeof CURRENCIES[CurrencyCode];
  formatAmount: (amount: number, currencyCode?: CurrencyCode) => string;
  convertTo: (amount: number, from: CurrencyCode, to: CurrencyCode) => number | null;
  convertToUserCurrency: (amount: number, from: CurrencyCode) => number | null;
  rates: Record<string, number> | null;
  isLoadingRates: boolean;
  refreshRates: () => Promise<void>;
}

export function useCurrency(): UseCurrencyReturn {
  const { profile } = useAuth();
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const currency = (profile?.currency || 'PEN') as CurrencyCode;
  const currencyInfo = CURRENCIES[currency];

  // Fetch exchange rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      setIsLoadingRates(true);
      try {
        const exchangeRates = await getExchangeRates('USD');
        setRates(exchangeRates);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchRates();
  }, []);

  const formatAmount = useCallback(
    (amount: number, currencyCode?: CurrencyCode) => {
      return formatCurrencyLib(amount, currencyCode || currency);
    },
    [currency]
  );

  const convertTo = useCallback(
    (amount: number, from: CurrencyCode, to: CurrencyCode): number | null => {
      if (!rates) return null;
      return convertCurrency(amount, from, to, rates);
    },
    [rates]
  );

  const convertToUserCurrency = useCallback(
    (amount: number, from: CurrencyCode): number | null => {
      if (from === currency) return amount;
      return convertTo(amount, from, currency);
    },
    [currency, convertTo]
  );

  const refreshRates = useCallback(async () => {
    setIsLoadingRates(true);
    try {
      const exchangeRates = await getExchangeRates('USD');
      setRates(exchangeRates);
    } catch (error) {
      console.error('Error refreshing exchange rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  return {
    currency,
    currencyInfo,
    formatAmount,
    convertTo,
    convertToUserCurrency,
    rates,
    isLoadingRates,
    refreshRates,
  };
}

// Simple hook that just returns format function (for components that don't need conversion)
export function useFormatCurrency() {
  const { profile } = useAuth();
  const currency = (profile?.currency || 'PEN') as CurrencyCode;

  return useCallback(
    (amount: number, currencyCode?: CurrencyCode) => {
      return formatCurrencyLib(amount, currencyCode || currency);
    },
    [currency]
  );
}
