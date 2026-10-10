import axios from 'axios'
import { toast } from 'sonner'

interface ErroApi {
  response?: { data?: { erro?: string } }
}

export function exibirErro(err: unknown, padrao = 'Erro inesperado.'): string {
  const erro = err as ErroApi
  return erro.response?.data?.erro || padrao
}

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
}

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "")

const api = axios.create({
  baseURL: `${API_BASE}/v1`,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function doRefresh(): Promise<string | null> {
  try {
    const res = await axios.create({
      baseURL: api.defaults.baseURL,
      withCredentials: true,
    }).post("/auth/refresh")

    const { accessToken: newToken } = res.data
    setAccessToken(newToken)
    return newToken
  } catch {
    clearAccessToken()
    toast.error('Sua sessão expirou. Faça login novamente.')
    window.location.href = "/login"
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const requestUrl = String(originalRequest?.url || "")
    const isAuthLoginRequest = requestUrl.includes("/auth/login")
    const isAuthRefreshRequest = requestUrl.includes("/auth/refresh")

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthLoginRequest &&
      !isAuthRefreshRequest
    ) {
      originalRequest._retry = true

      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
          refreshPromise = null
        })
      }

      const newToken = await refreshPromise
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      }
    }
    return Promise.reject(error)
  },
)

export async function tentarRestaurarSessao(): Promise<boolean> {
  if (accessToken) return true
  try {
    const res = await axios.create({
      baseURL: api.defaults.baseURL,
      withCredentials: true,
    }).post("/auth/refresh")

    const { accessToken: newToken } = res.data
    setAccessToken(newToken)
    return true
  } catch {
    clearAccessToken()
    return false
  }
}

export default api
