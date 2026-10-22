import { useApi } from './useApi';
import { useAuthStore } from '../stores/auth';

export const useAuth = () => {
  const { fetcher } = useApi();
  const authStore = useAuthStore();

  const token = useCookie('auth_token', { maxAge: 60 * 60 * 24 * 7 });
  const refreshToken = useCookie('refresh_token', { maxAge: 60 * 60 * 24 * 30 });
  const user = useState<any>('admin_user', () => null);
  const loading = useState('auth_loading', () => false);

  if (token.value && !authStore.token) {
    authStore.setToken(token.value as string);
  }
  if (user.value && !authStore.user) {
    authStore.setUser(user.value);
  }

  const login = async (credentials: any) => {
    loading.value = true;
    try {
      let response: any;
      try {
        response = await fetcher('/admin/platform/auth/login', {
          method: 'POST',
          body: credentials,
        });
      } catch (err: any) {
        if (err.response?.status === 404) {
          response = await fetcher('/auth/login', {
            method: 'POST',
            body: credentials,
          });
        } else {
          throw err;
        }
      }

      if (response && response.success) {
        // Enforce super_admin role check
        if (response.data.user.role !== 'super_admin') {
          return {
            success: false,
            error: 'Akses ditolak: Akun Anda tidak memiliki hak akses Superadmin Platform.',
          };
        }

        const accessToken = response.data.accessToken || response.data.access_token;
        const refreshTokenVal = response.data.refreshToken || response.data.refresh_token;

        token.value = accessToken;
        refreshToken.value = refreshTokenVal;
        user.value = response.data.user;

        authStore.setToken(accessToken);
        authStore.setUser(response.data.user);

        await new Promise((resolve) => setTimeout(resolve, 50));
        return { success: true };
      }

      return { success: false, error: response.message || 'Login gagal' };
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || error.data?.error?.message || 'Email atau password salah',
      };
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    authStore.clearAuth();
    if (import.meta.client) {
      window.location.href = '/login';
    }
  };

  const fetchUser = async () => {
    if (!token.value) return null;
    try {
      let res: any;
      try {
        res = await fetcher('/auth/me');
      } catch (err: any) {
        if (err.response?.status === 404) {
          res = await fetcher('/admin/platform/auth/me');
        } else {
          throw err;
        }
      }

      if (res && res.success && res.data) {
        if (res.data.role !== 'super_admin') {
          logout();
          return null;
        }
        user.value = res.data;
        authStore.setUser(res.data);
        return res.data;
      }
    } catch {
      logout();
    }
    return null;
  };

  return {
    user,
    token,
    loading,
    login,
    logout,
    fetchUser,
    isAuthenticated: computed(() => !!token.value && user.value?.role === 'super_admin'),
  };
};
