import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';
import { authService, LoginRequest } from '../services/authService';
import { queryKeys } from '@/lib/queryClient';

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login: setAuth } = useAuthStore();
  const { setCurrentTenant, setAvailableTenants } = useTenantStore();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken, tenant, availableTenants } = response.data;
      setAuth(user, accessToken, refreshToken, tenant.id);
      setCurrentTenant(tenant);
      // 멀티 테넌트 지원: 접근 가능한 테넌트 목록 설정
      if (availableTenants && availableTenants.length > 0) {
        setAvailableTenants(availableTenants);
      } else {
        setAvailableTenants([tenant]);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      navigate('/dashboard');
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout: clearAuth } = useAuthStore();
  const { reset: resetTenant } = useTenantStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth();
      resetTenant();
      queryClient.clear();
      navigate('/login');
    },
    onError: () => {
      // Even if logout API fails, clear local state
      clearAuth();
      resetTenant();
      queryClient.clear();
      navigate('/login');
    },
  });
}

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAuth() {
  const authStore = useAuthStore();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const userQuery = useCurrentUser();

  return {
    ...authStore,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
    isLogoutPending: logoutMutation.isPending,
    refreshUser: userQuery.refetch,
  };
}
