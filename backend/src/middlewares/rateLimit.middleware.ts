import rateLimit from 'express-rate-limit'

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Limite de 5 tentativas
    message: { erro: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
    standardHeaders: true, // Retorna os cabeçalhos `RateLimit-*`
    legacyHeaders: false, // Desativa os cabeçalhos `X-RateLimit-*`
})