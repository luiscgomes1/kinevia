import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (client) return client

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para usar storage.')
  }

  client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  return client
}

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'kinevia'

/**
 * Gera um link temporário (assinado) pra um arquivo no bucket privado.
 * Ver ADR-006 — o bucket deixou de ser público em 07/07/2026; os campos
 * *_path no banco guardam só o caminho dentro do bucket, nunca uma URL
 * final, porque uma URL assinada expira e não pode ser cacheada como se
 * fosse permanente.
 *
 * @param path Caminho do arquivo dentro do bucket (ex: "assinaturas/xxx.png")
 * @param expiresInSeconds Validade do link — padrão 1h, use algo bem curto
 *   (ex: 60s) pra casos de redirect imediato, onde o link não precisa durar
 */
export async function gerarUrlAssinada(path: string, expiresInSeconds = 3600): Promise<string | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data) return null
  return data.signedUrl
}

/**
 * Baixa o conteúdo de um arquivo do bucket privado como Buffer — usado
 * pelo backend pra embutir imagens (logo/assinatura) no PDF gerado com
 * PDFKit. Importante: PDFKit não busca URLs por HTTP, só aceita caminho
 * de arquivo local, Buffer ou data URI — por isso baixamos o conteúdo
 * aqui em vez de passar uma URL pro PDFKit (bug real corrigido em 07/07,
 * a imagem provavelmente nunca aparecia nos laudos antes disso).
 */
export async function baixarArquivo(path: string): Promise<Buffer | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(path)

  if (error || !data) return null
  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Remove um arquivo do bucket — usado pelo botão "Remover" de
 * assinatura/logo em Configurações (antes não tinha suporte real no
 * backend, apesar do frontend já chamar essa ação).
 */
export async function removerArquivo(path: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path])
  return !error
}

export { getSupabase }
