import { vi } from 'vitest';

// Mock de datos de prueba
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

export const mockProfile = {
  id: 'test-profile-id',
  user_id: 'test-user-id',
  full_name: 'Test User',
  currency: 'PEN',
  timezone: 'America/Lima',
};

export const mockPayment = {
  id: 'test-payment-id',
  user_id: 'test-user-id',
  contact_id: 'test-contact-id',
  amount: 1000,
  currency: 'PEN',
  status: 'pending',
  method: 'transfer',
  confidence_score: 95,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockContact = {
  id: 'test-contact-id',
  user_id: 'test-user-id',
  name: 'Test Contact',
  phone: '+51999999999',
  email: 'contact@example.com',
  status: 'active',
  total_paid: 5000,
  total_debt: 1000,
  created_at: new Date().toISOString(),
};

// Mock del cliente Supabase
const createMockQueryBuilder = () => {
  const builder: Record<string, any> = {};
  
  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'in', 'contains',
    'order', 'limit', 'range', 'single', 'maybeSingle',
    'or', 'and', 'not', 'filter',
  ];

  chainMethods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });

  // Métodos que resuelven la query
  builder.then = vi.fn().mockResolvedValue({ data: [], error: null });
  
  return builder;
};

export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: mockUser, session: {} },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: mockUser, session: {} },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn().mockImplementation(() => createMockQueryBuilder()),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } }),
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
};

// Función para mockear el módulo
export const setupSupabaseMock = () => {
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: mockSupabaseClient,
  }));
};
