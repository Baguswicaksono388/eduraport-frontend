import { ref } from 'vue';
import { useApi } from './useApi';

export const useWaDevices = () => {
  const { fetcher } = useApi();
  const loading = ref(false);
  const devices = ref<any[]>([]);

  const fetchDevices = async (schoolId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/devices`);
      if (res.success) {
        devices.value = res.data;
      }
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const addDevice = async (schoolId: string, data: any) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/devices`, {
        method: 'POST',
        body: data,
      });
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getDeviceDetail = async (schoolId: string, deviceId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/devices/${deviceId}`);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteDevice = async (schoolId: string, deviceId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/devices/${deviceId}`, {
        method: 'DELETE',
      });
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const pauseDevice = async (schoolId: string, deviceId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/devices/${deviceId}/pause`, {
        method: 'POST',
      });
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const resumeDevice = async (schoolId: string, deviceId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/devices/${deviceId}/resume`, {
        method: 'POST',
      });
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const repairDevice = async (schoolId: string, deviceId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/devices/${deviceId}/repair`, {
        method: 'POST',
      });
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const useQrSse = (
    schoolId: string,
    deviceId: string,
    onQr: (qr: string) => void,
    onStatus: (status: string) => void
  ) => {
    const config = useRuntimeConfig();
    const tokenCookie = useCookie('auth_token');
    let eventSource: EventSource | null = null;

    const connect = () => {
      // Clean up previous if any
      disconnect();

      const url = `${config.public.apiBase}/school/${schoolId}/wa/devices/${deviceId}/qr?token=${tokenCookie.value}`;
      eventSource = new EventSource(url);

      eventSource.addEventListener('qr', (e) => {
        onQr(e.data);
      });

      eventSource.addEventListener('status', (e) => {
        onStatus(e.data);
      });

      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
      };
    };

    const disconnect = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };

    return {
      connect,
      disconnect,
    };
  };

  const fetchRoutingRules = async (schoolId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/routing`);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const saveRoutingRule = async (schoolId: string, data: any) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/routing`, {
        method: 'POST',
        body: data,
      });
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchTemplates = async (schoolId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/templates`);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const saveTemplate = async (schoolId: string, data: any) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/templates`, {
        method: 'POST',
        body: data,
      });
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchGroupMappings = async (schoolId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/group-mappings`);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const saveGroupMapping = async (schoolId: string, data: any) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/group-mappings`, {
        method: 'POST',
        body: data,
      });
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchGroupsFromDevice = async (schoolId: string, deviceId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/devices/${deviceId}/fetch-groups`, {
        method: 'POST',
      });
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchMessages = async (
    schoolId: string,
    params: { page: number; itemPerPage: number; status?: string; search?: string }
  ) => {
    loading.value = true;
    try {
      let url = `/school/${schoolId}/wa/messages?page=${params.page}&item_per_page=${params.itemPerPage}`;
      if (params.status) url += `&status=${params.status}`;
      if (params.search) url += `&search=${encodeURIComponent(params.search)}`;

      const res: any = await fetcher(url);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const resendMessage = async (schoolId: string, messageId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/messages/${messageId}/resend`, {
        method: 'POST',
      });
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const bypassWarmup = async (schoolId: string, deviceId: string) => {
    loading.value = true;
    try {
      const res: any = await fetcher(`/school/${schoolId}/wa/devices/${deviceId}/bypass-warmup`, {
        method: 'POST',
      });
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    devices,
    fetchDevices,
    addDevice,
    getDeviceDetail,
    deleteDevice,
    pauseDevice,
    resumeDevice,
    repairDevice,
    useQrSse,
    fetchRoutingRules,
    saveRoutingRule,
    fetchTemplates,
    saveTemplate,
    fetchGroupMappings,
    saveGroupMapping,
    fetchGroupsFromDevice,
    fetchMessages,
    resendMessage,
    bypassWarmup,
  };
};
