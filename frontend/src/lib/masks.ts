/**
 * Máscaras de formatação para campos de input.
 *
 * Cada função recebe o valor atual do campo (string) e devolve o valor
 * já formatado, pronto para ser usado direto no onChange do input.
 *
 * Importante: aqui só formatamos CPF e telefone, que têm quantidade
 * FIXA de dígitos no Brasil. O CREFITO não tem tamanho fixo entre as
 * 21 regionais, então não recebe máscara — ver Identidade-Visual.md
 * para o motivo dessa decisão.
 */

/**
 * Remove tudo que não for dígito.
 */
function apenasNumeros(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * Formata CPF no padrão 000.000.000-00 enquanto o usuário digita.
 * Limita a 11 dígitos (CPF sempre tem 11 números no Brasil).
 */
export function formatarCPF(valor: string): string {
  const numeros = apenasNumeros(valor).slice(0, 11)

  return numeros
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/**
 * Formata telefone brasileiro enquanto o usuário digita.
 * Detecta automaticamente celular (11 dígitos, com o 9) ou fixo (10 dígitos):
 *   Celular: (00) 00000-0000
 *   Fixo:    (00) 0000-0000
 */
export function formatarTelefone(valor: string): string {
  const numeros = apenasNumeros(valor).slice(0, 11)

  if (numeros.length <= 10) {
    // Formato fixo: (00) 0000-0000
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }

  // Formato celular: (00) 00000-0000
  return numeros
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}
