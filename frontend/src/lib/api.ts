import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: () => void; reject: (error: unknown) => void }> = [];

function flushRefreshQueue(error?: unknown) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }
    resolve();
  });
  refreshQueue = [];
}

// pega cookie CSRF
function getCookie(name: string) {
  return document.cookie
      .split("; ")
      .find(row => row.startsWith(name + "="))
      ?.split("=")[1];
}

// injeta CSRF automaticamente em TODOS os requests
api.interceptors.request.use((config) => {
  const csrfToken = getCookie("csrftoken");

  if (csrfToken) {
    config.headers["X-CSRFToken"] = csrfToken;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean });
    const status = error?.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (
      requestUrl.includes("/api/auth/login/") ||
      requestUrl.includes("/api/auth/login-email/") ||
      requestUrl.includes("/api/auth/register/") ||
      requestUrl.includes("/api/auth/verify-code/") ||
      requestUrl.includes("/api/auth/refresh/") ||
      requestUrl.includes("/api/auth/logout/") ||
      requestUrl.includes("/dj-rest-auth/google/login/") ||
      requestUrl.includes("/api/auth/google/")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      await new Promise<void>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      });
      return api(originalRequest);
    }

    try {
      isRefreshing = true;
      await api.post("/api/auth/refresh/", {});
      flushRefreshQueue();
      return api(originalRequest);
    } catch (refreshError) {
      flushRefreshQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

