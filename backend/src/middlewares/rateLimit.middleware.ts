import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import type { Request } from 'express'

// Em ambiente contínuo (local/Docker), o Express já resolve `req.ip` via `trust proxy 1`.
// Na Vercel o limite em memória é por instância; usar o primeiro IP de `x-forwarded-for`
// garante que todos os clientes não compartilhem a mesma chave (senão o limite global 100/min
// valeria para o grupo inteiro de uma vez). `ipKeyGenerator` normaliza IPv4-mapped-IPv6
// para que endereços equivalentes não contornem os limites.
function obterIp(req: Request): string {
  let ip = req.ip ?? 'ip-desconhecido'
  const xff = req.headers['x-forwarded-for']
  if (process.env.VERCEL === 'true' && typeof xff === 'string' && xff.trim() !== '') {
    ip = xff.split(',')[0].trim()
  }
  return ipKeyGenerator(ip)
}

const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: obterIp,
}

export const loginRateLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { erro: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
})

export const refreshRateLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { erro: 'Muitas tentativas de refresh. Aguarde 15 minutos e tente novamente.' },
})

export const trocarSenhaRateLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { erro: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' },
})

export const passwordResetRateLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 3,
  message: { erro: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' },
})

export const verificarSenhaRateLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { erro: 'Muitas tentativas de verificação. Aguarde 15 minutos e tente novamente.' },
})

export const globalApiRateLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 1000,
  limit: 100,
  message: { erro: 'Muitas requisições. Aguarde um minuto e tente novamente.' },
})