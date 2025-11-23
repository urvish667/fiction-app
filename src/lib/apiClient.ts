import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.fablespace.com/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true, // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for logging in dev mode
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config);
        }
        return config;
      },
      (error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('API Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and 401 handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        if (process.env.NODE_ENV !== 'production') {
          // Don't log expected 401s for authentication checks
          const isAuthMe401 = error.response?.status === 401 && error.config?.url === '/auth/me';
          if (!isAuthMe401) {
            console.error('API Response Error:', error.response?.status, error.response?.data);
          }
        }

        const originalRequest = error.config;
        const isAuthCheck = originalRequest?.url === '/auth/me';
        const isLogin = originalRequest?.url === '/auth/login';

        // For /auth/me and /auth/login endpoints, don't try to refresh tokens - let 401 responses through
        if (error.response?.status === 401 && (isAuthCheck || isLogin)) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.client(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          (originalRequest as any)._retry = true;
          this.isRefreshing = true;

          try {
            // Try to refresh token
            await this.client.post('/auth/refresh');
            this.isRefreshing = false;

            // Process queued requests
            this.failedQueue.forEach(({ resolve }) => {
              resolve('');
            });
            this.failedQueue = [];

            // Retry original request
            return this.client(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;

            // Reject all queued requests
            this.failedQueue.forEach(({ reject }) => {
              reject(refreshError);
            });
            this.failedQueue = [];

            // Redirect to login or handle logout
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Unified error handling
  private handleError(error: AxiosError): never {
    if (error.response) {
      const { status, data } = error.response;
      const message = (data as any)?.message || `Request failed with status ${status}`;
      throw { success: false, message, status, data };
    } else if (error.request) {
      throw { success: false, message: 'Network error - please check your connection' };
    } else {
      throw { success: false, message: error.message || 'An unexpected error occurred' };
    }
  }

  // Public methods - return data directly, throw on error
  async get<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.client.patch(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// For backward compatibility, export individual methods
export const { get, post, put, delete: del, patch } = apiClient;
