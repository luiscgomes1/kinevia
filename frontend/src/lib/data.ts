/**
 * Utilitários de data compartilhados.
 *
 * Bug real corrigido em 06/07/2026: `Date.prototype.toISOString()` sempre
 * converte pra UTC. No fuso do Brasil (UTC-3), isso significa que a partir
 * de ~21h locais, `toISOString().split('T')[0]` já retorna o dia SEGUINTE
 * (porque em UTC já virou meia-noite). Isso fazia o marcador "agora" da
 * Agenda aparecer no dia errado à noite, e o mesmo bug afetava qualquer
 * lugar que usava esse padrão pra montar a data enviada à API — ou seja,
 * sessões marcadas à noite podiam ser salvas com a data do dia seguinte.
 *
 * `formatarDataISO` aqui usa os componentes de data LOCAIS (getFullYear/
 * getMonth/getDate), nunca UTC — sempre reflete o dia do calendário local
 * do usuário, que é o que importa pra uma agenda de consultório.
 */
export function formatarDataISO(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function mesmoDia(a: Date, b: Date): boolean {
  return formatarDataISO(a) === formatarDataISO(b)
}
