import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url || "");
    const isAuthLoginRequest = requestUrl.includes("/auth/login");
    const isAuthRefreshRequest = requestUrl.includes("/auth/refresh");

    // 401 no login significa credencial inválida; nesses endpoints não tentamos refresh
    // para evitar redirecionamento prematuro e preservar o feedback (toast) da própria tela.
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthLoginRequest &&
      !isAuthRefreshRequest
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:3333"}/auth/refresh`,
          { refreshToken },
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
