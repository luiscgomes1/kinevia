import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/server'

describe('GET /health', () => {
  it('retorna status ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('project', 'Kinevia API')
  })
})
