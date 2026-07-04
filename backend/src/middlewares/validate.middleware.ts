import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'


type Alvo = 'body' | 'query'

export function validar(schema: ZodSchema, alvo: Alvo = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const resultado = schema.safeParse(req[alvo])

    if (!resultado.success) {
      // erros do Zod formatados para o formato { campo: string, mensagem: string }
      const erros = resultado.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensagem: issue.message,
      }))

      return res.status(400).json({ erro: 'Dados inválidos.', detalhes: erros })
    }

    // Se a validação for bem-sucedida, substitui os dados originais pelos validados
    req[alvo] = resultado.data

    next()
  }
}