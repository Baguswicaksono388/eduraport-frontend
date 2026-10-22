export const useApi = () => {
  const config = useRuntimeConfig();
  const token = useCookie('auth_token', { maxAge: 60 * 60 * 24 * 7 });
  const refreshToken = useCookie('refresh_token', { maxAge: 60 * 60 * 24 * 30 });

  const fetcher = async (url: string, options: any = {}) => {
    const headers = {
      ...options.headers,
    };

    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`;
    }

    const resolvedApiBase = config.public.apiBase;

    try {
      const response = await $fetch(url, {
        baseURL: resolvedApiBase,
        ...options,
        headers,
      });
      return response;
    } catch (error: any) {
      if (error.response?.status === 401 && refreshToken.value && !options._retry) {
        try {
          const refreshResponse: any = await $fetch('/auth/refresh', {
            baseURL: resolvedApiBase,
            method: 'POST',
            body: { refresh_token: refreshToken.value },
          });

          if (refreshResponse.success) {
            token.value = refreshResponse.data.access_token;
            refreshToken.value = refreshResponse.data.refresh_token;
            return await fetcher(url, { ...options, _retry: true });
          }
        } catch {
          console.error('Session expired. Please login again.');
        }
      }

      if (error.response?.status === 401) {
        token.value = null;
        refreshToken.value = null;
        if (import.meta.client) {
          window.location.href = '/login';
        }
      }

      throw error;
    }
  };

  return {
    fetcher,
    token,
  };
};
