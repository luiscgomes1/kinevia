import pino from 'pino'
import { execSync } from 'child_process'

if (process.platform === 'win32') {
  try {
    execSync('cmd.exe /c chcp 65001 > nul', { encoding: 'utf8' })
  } catch {
    // fallback silencioso
  }
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['email', 'cpf', 'cpf_paciente', 'telefone', 'senha', 'senha_hash', 'senha_temporaria', 'token', 'accessToken', 'refreshToken'],
    censor: '[REDACTED]',
  },
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

export default logger
