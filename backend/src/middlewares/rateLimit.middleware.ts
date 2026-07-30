import rateLimit from 'express-rate-limit'

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: { erro: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
    standardHeaders: true,
    legacyHeaders: false,
})

export const refreshRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { erro: 'Muitas tentativas de refresh. Aguarde 15 minutos e tente novamente.' },
    standardHeaders: true,
    legacyHeaders: false,
})

export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    message: { erro: 'Muitas tentativas de registro. Aguarde 1 hora e tente novamente.' },
    standardHeaders: true,
    legacyHeaders: false,
})

export const passwordResetRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    message: { erro: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' },
    standardHeaders: true,
    legacyHeaders: false,
})

export const globalApiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    message: { erro: 'Muitas requisições. Aguarde um minuto e tente novamente.' },
    standardHeaders: true,
    legacyHeaders: false,
})
