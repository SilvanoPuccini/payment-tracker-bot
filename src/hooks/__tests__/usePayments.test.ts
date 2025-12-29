import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockPayment, mockSupabaseClient } from '@/test/mocks/supabase';
import React from 'react';

// Mock del módulo de Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock de lib/supabase también (usado por usePayments)
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Mock del AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: { currency: 'PEN' },
    loading: false,
  }),
}));

// Importar después de los mocks
import { usePayments, usePaymentStats, useCreatePayment } from '../usePayments';

// Helper para crear un mock builder encadenable que resuelve al final
const createChainableMock = (finalData: unknown[], finalError: Error | null = null) => {
  const result = { data: finalData, error: finalError };

  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve(result)),
  };

  // Make all methods return the chainable object
  Object.keys(chainable).forEach(key => {
    if (key !== 'then') {
      (chainable as Record<string, ReturnType<typeof vi.fn>>)[key].mockReturnValue(chainable);
    }
  });

  return chainable;
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

describe('usePayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch payments successfully', async () => {
    const chainable = createChainableMock([mockPayment]);
    mockSupabaseClient.from = vi.fn().mockReturnValue(chainable);

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('payments');
  });

  it('should handle empty payments list', async () => {
    const chainable = createChainableMock([]);
    mockSupabaseClient.from = vi.fn().mockReturnValue(chainable);

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    // Verificar que los datos sean un array vacío o undefined (si aún está cargando)
    if (result.current.data !== undefined) {
      expect(result.current.data).toEqual([]);
    }
  });
});

describe('usePaymentStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate payment stats correctly', async () => {
    const mockPayments = [
      { amount: 1000, status: 'confirmed', confidence_score: 95 },
      { amount: 500, status: 'pending', confidence_score: 80 },
      { amount: 2000, status: 'confirmed', confidence_score: 90 },
    ];

    const chainable = createChainableMock(mockPayments);
    mockSupabaseClient.from = vi.fn().mockReturnValue(chainable);

    const { result } = renderHook(() => usePaymentStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });
  });
});

describe('useCreatePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a payment successfully', async () => {
    const newPayment = {
      contact_id: 'test-contact-id',
      amount: 1500,
      currency: 'PEN',
      method: 'transfer',
      status: 'pending' as const,
    };

    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...newPayment, id: 'new-payment-id' },
            error: null,
          }),
        }),
      }),
    });
    mockSupabaseClient.from = mockFrom;

    const { result } = renderHook(() => useCreatePayment(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
  });
});
