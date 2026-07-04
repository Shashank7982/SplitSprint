import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// ─── Transaction Queries ─────────────────────────────────────────────────────

export const useMyTransactions = () => {
  return useQuery({
    queryKey: ['my-transactions'],
    queryFn: async () => {
      const { data } = await api.get('/api/payments/my-transactions');
      return data;
    },
    staleTime: 0,
  });
};

// ─── Pool Queries ────────────────────────────────────────────────────────────

export const usePools = (filters = {}) => {
  return useQuery({
    queryKey: ['pools', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.service) params.set('service', filters.service);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.sort) params.set('sort', filters.sort);
      const { data } = await api.get(`/api/pools?${params.toString()}`);
      return data;
    },
    staleTime: 30_000,
  });
};

export const useMyPools = () => {
  return useQuery({
    queryKey: ['my-pools'],
    queryFn: async () => {
      const { data } = await api.get('/api/pools/my-pools');
      return data; // { hosted: [...], contributing: [...] }
    },
    staleTime: 0,
  });
};



export const usePool = (id) => {
  return useQuery({
    queryKey: ['pool-detail', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/pools/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 0,       // Always consider data stale — refetch on every mount
    gcTime: 0,          // Don't cache in memory after component unmounts
  });
};

// ─── Pool Mutations ──────────────────────────────────────────────────────────

export const useCreatePool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (poolData) => {
      const { data } = await api.post('/api/pools', poolData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
  });
};

export const useJoinPool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poolId, inviteCode }) => {
      const { data } = await api.post(`/api/pools/${poolId}/join`, { inviteCode });
      return data;
    },
    onSuccess: (_, { poolId }) => {
      queryClient.invalidateQueries({ queryKey: ['pool-detail', poolId] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
  });
};

export const usePayUpi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poolId }) => {
      const { data } = await api.post(`/api/pools/${poolId}/pay-upi`);
      return data;
    },
    onSuccess: (_, { poolId }) => {
      queryClient.invalidateQueries({ queryKey: ['pool-detail', poolId] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
  });
};

export const useVerifyUpiPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poolId, memberId }) => {
      const { data } = await api.post(`/api/pools/${poolId}/verify-payment`, { memberId });
      return data;
    },
    onSuccess: (_, { poolId }) => {
      queryClient.invalidateQueries({ queryKey: ['pool-detail', poolId] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
  });
};

// ─── Payment Mutations ───────────────────────────────────────────────────────

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: async ({ poolId }) => {
      const { data } = await api.post('/api/payments/intent', { poolId });
      return data;
    },
  });
};

export const useDisputePool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poolId, reason }) => {
      const { data } = await api.post(`/api/pools/${poolId}/dispute`, { reason });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pool-detail', variables.poolId] });
    }
  });
};

// ─── Auth Mutations ──────────────────────────────────────────────────────────

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData) => {
      const { data } = await api.post('/api/auth/register', userData);
      return data;
    },
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials) => {
      const { data } = await api.post('/api/auth/login', credentials);
      return data;
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/auth/logout');
      return data;
    },
  });
};
