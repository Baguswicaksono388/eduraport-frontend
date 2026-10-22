import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as any,
  }),
  actions: {
    setToken(token: string | null) {
      this.token = token;
    },
    setUser(user: any) {
      this.user = user;
    },
    clearAuth() {
      this.token = null;
      this.user = null;
    },
  },
});
