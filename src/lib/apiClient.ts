import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from '@/hooks/use-toast';

export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.fablespace.com/api/v1';
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(envUrl);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || /^192\.168\.\d+\.\d+$/.test(url.hostname)) {
        url.hostname = window.location.hostname;
        return url.toString().replace(/\/$/, '');
      }
    } catch {
      return envUrl;
    }
  }
  return envUrl;
};

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];
  private csrfPromise: Promise<void> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: getApiBaseUrl(),
      withCredentials: true,
      // Native Axios CSRF handling: automatically extracts cookie and attaches header
      xsrfCookieName: 'fablespace_csrf_token',
      xsrfHeaderName: 'x-csrf-token',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Ensure CSRF cookie exists before state-changing mutations
   */
  async ensureCsrfToken(force = false): Promise<void> {
    if (typeof document === 'undefined') return;

    const hasCookie = document.cookie.includes('fablespace_csrf_token=');
    if (hasCookie && !force) return;

    if (this.csrfPromise) return this.csrfPromise;

    this.csrfPromise = (async () => {
      try {
        const baseURL = getApiBaseUrl();
        await axios.get(`${baseURL}/csrf/token`, { withCredentials: true });
      } catch (error) {
        console.error('Failed to initialize CSRF token', error);
      } finally {
        this.csrfPromise = null;
      }
    })();

    return this.csrfPromise;
  }

  prefetchCsrfToken() {
    this.ensureCsrfToken().catch(() => {});
  }

  clearCsrfToken() {
    this.csrfPromise = null;
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(async (config) => {
      config.baseURL = getApiBaseUrl();

      // FormData multipart boundary fix: let browser set multipart/form-data boundary
      if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }

      // Ensure CSRF cookie is present before state-changing mutations
      const method = config.method?.toLowerCase();
      if (method && ['post', 'put', 'delete', 'patch'].includes(method)) {
        await this.ensureCsrfToken();
      }

      return config;
    });

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        if (!originalRequest) return Promise.reject(error);

        const status = error.response?.status;
        const isAuthCheck = originalRequest.url === '/auth/me';
        const isLogin = originalRequest.url === '/auth/login';
        const isRefreshEndpoint = originalRequest.url === '/auth/refresh';

        // 1. Handle 401 Unauthorized with token refresh queue
        if (status === 401 && !isAuthCheck && !isLogin && !isRefreshEndpoint && !(originalRequest as any)._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => this.client(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          (originalRequest as any)._retry = true;
          this.isRefreshing = true;

          try {
            await this.client.post('/auth/refresh');
            this.isRefreshing = false;
            this.failedQueue.forEach(({ resolve }) => resolve(''));
            this.failedQueue = [];
            return this.client(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        // 2. Handle 403 CSRF token rejection with auto-retry
        const data = error.response?.data as any;
        const isCsrfError =
          status === 403 &&
          (data?.code === 'EBADCSRFTOKEN' ||
            data?.error === 'CSRF_TOKEN_INVALID' ||
            (typeof data?.message === 'string' && data.message.toLowerCase().includes('csrf')));

        if (isCsrfError && !(originalRequest as any)._csrfRetry) {
          (originalRequest as any)._csrfRetry = true;
          await this.ensureCsrfToken(true);
          return this.client(originalRequest);
        }

        // 3. Handle 429 Rate Limiting
        if (status === 429) {
          toast({
            title: 'Too Many Requests',
            description: "You're making requests too quickly. Please wait a moment and try again.",
            variant: 'destructive',
          });
        }

        // Normalize error structure for callers
        if (error.response) {
          const respData = error.response.data as any;
          const message =
            respData?.error?.message ||
            respData?.message ||
            (typeof respData?.error === 'string' ? respData.error : null) ||
            `Request failed with status ${status}`;

          return Promise.reject({ success: false, message, status, data: respData });
        } else if (error.request) {
          return Promise.reject({ success: false, message: 'Network error - please check your connection' });
        }
        return Promise.reject({ success: false, message: error.message || 'An unexpected error occurred' });
      }
    );
  }

  // Clean public API methods
  async get<T>(url: string, config?: AxiosRequestConfig & { noCache?: boolean }): Promise<T> {
    const { noCache, ...rest } = config || {};
    const response = await this.client.get<T>(url, {
      ...rest,
      headers: { ...rest?.headers, ...(noCache && { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }) },
    });
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export const { get, post, put, delete: del, patch } = apiClient;
export const prefetchCsrfToken = () => apiClient.prefetchCsrfToken();
export const clearCsrfToken = () => apiClient.clearCsrfToken();
