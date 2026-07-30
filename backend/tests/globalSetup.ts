import { execSync } from 'child_process'

const FALLBACK_DB_URL = 'postgresql://test:test@localhost:5432/test'

export async function setup() {
  const dbUrl = process.env.DATABASE_URL || FALLBACK_DB_URL
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'pipe',
      timeout: 60000,
    })
  } catch (err: any) {
    console.warn('[globalSetup] Falha ao executar migração:', err.stderr?.toString() || err.message)
    console.warn('[globalSetup] Testes que dependem de banco podem falhar.')
  }
}
