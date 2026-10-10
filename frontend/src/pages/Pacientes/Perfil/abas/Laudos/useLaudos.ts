import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import api, { exibirErro } from '@/services/api'
import type { Laudo, ConteudoLaudo } from './types'
import {
    buscarItemCIF,
    componenteDoCodigo,
    extrairCodsCIFDeTexto,
    type ComponenteCIF,
    type ItemCIF,
} from './cifs-data'

function converterCifsLegado(c: Record<string, unknown>): ItemCIF[] {
    const grupos: [string, ComponenteCIF][] = [
        ['cif_funcao', 'FUNCOES'],
        ['cif_estrutura', 'ESTRUTURAS'],
        ['cif_atividade', 'ATIVIDADES'],
        ['cif_participacao', 'ATIVIDADES'],
        ['cif_contextual', 'AMBIENTAIS'],
    ]
    const itens: ItemCIF[] = []
    for (const [campo, componente] of grupos) {
        const texto = typeof c[campo] === 'string' ? (c[campo] as string) : ''
        for (const codigo of extrairCodsCIFDeTexto(texto)) {
            if (itens.some((i) => i.codigo === codigo)) continue
            const conhecido = buscarItemCIF(codigo)
            itens.push({
                codigo,
                descricao: conhecido?.descricao ?? '',
                componente: conhecido?.componente ?? componente,
            })
        }
    }
    return itens
}

export function useLaudos(pacienteId: string) {
    const [laudos, setLaudos] = useState<Laudo[]>([])
    const [carregando, setCarregando] = useState(true)
    const [gerando, setGerando] = useState(false)

    const [modalAberto, setModalAberto] = useState(false)
    const [laudoEditando, setLaudoEditando] = useState<string | null>(null)
    const [laudoTipo, setLaudoTipo] = useState<'CLINICO' | 'COMPLETO' | 'REEMBOLSO'>('CLINICO')
    const [salvando, setSalvando] = useState(false)
    const [conteudo, setConteudo] = useState<ConteudoLaudo>({
        quadro_clinico: '',
        achados_exame: '',
        diagnostico_funcional: '',
        conclusao: '',
        diagnostico_medico: '',
        medico_solicitante: '',
        cid: '',
        procedimentos: '',
        total_sessoes: '',
        eva_inicial: null,
        eva_atual: null,
        data_inicio: '',
        data_fim: '',
        frequencia_semanal: '',
    })
    const [tipoAssinatura, setTipoAssinatura] = useState<'DIGITAL' | 'MANUSCRITA'>('MANUSCRITA')
    const [confirmCancelAberto, setConfirmCancelAberto] = useState(false)

    const conteudoInicialRef = useRef('')
    const assinaturaInicialRef = useRef<'DIGITAL' | 'MANUSCRITA'>('MANUSCRITA')

    function isDirty(): boolean {
        return JSON.stringify(conteudo) !== conteudoInicialRef.current
            || tipoAssinatura !== assinaturaInicialRef.current
    }

    const carregar = useCallback(async () => {
        try {
            const response = await api.get(`/pacientes/${pacienteId}/laudos`)
            setLaudos(response.data)
        } catch (err) {
            toast.error(exibirErro(err, 'Erro ao carregar laudos.'))
        } finally {
            setCarregando(false)
        }
    }, [pacienteId])

    useEffect(() => {
        async function inicial() {
            await carregar()
        }
        void inicial()
    }, [carregar])

    async function handleGerarLaudo(tipo: 'CLINICO' | 'COMPLETO' | 'REEMBOLSO') {
        setGerando(true)
        try {
            const response = await api.post(`/pacientes/${pacienteId}/laudos?tipo=${tipo}`, {
                tipo_assinatura: 'MANUSCRITA',
                tipo,
            })
            await handleAbrirEdicao(response.data.id)
            carregar()
        } catch (err) {
            toast.error(exibirErro(err, 'Erro ao gerar laudo.'))
        } finally {
            setGerando(false)
        }
    }

    async function handleAbrirEdicao(laudoId: string) {
        try {
            const response = await api.get(`/laudos/${laudoId}`)
            const c = response.data.conteudo
            const tipo = response.data.tipo as 'CLINICO' | 'COMPLETO' | 'REEMBOLSO'
            setLaudoTipo(tipo)
            const novoConteudo: ConteudoLaudo = {
                quadro_clinico: c.quadro_clinico ?? '',
                achados_exame: c.achados_exame ?? '',
                diagnostico_funcional: c.diagnostico_funcional ?? '',
                conclusao: c.conclusao ?? '',
                diagnostico_medico: c.diagnostico_medico ?? '',
                medico_solicitante: c.medico_solicitante ?? '',
                cid: c.cid ?? '',
                procedimentos: c.procedimentos ?? '',
                total_sessoes: c.total_sessoes ?? '',
                eva_inicial: c.eva_inicial ?? null,
                eva_atual: c.eva_atual ?? null,
                data_inicio: c.data_inicio ?? '',
                data_fim: c.data_fim ?? '',
                frequencia_semanal: c.frequencia_semanal ?? '',
                ...(tipo === 'COMPLETO' ? {
                    cifs: Array.isArray(c.cifs) && (c.cifs as ItemCIF[]).length > 0
                        ? (c.cifs as ItemCIF[]).map((i) => ({
                            codigo: i.codigo,
                            descricao: i.descricao ?? '',
                            componente: i.componente ?? componenteDoCodigo(i.codigo),
                        }))
                        : converterCifsLegado(c),
                    metas_tratamento: c.metas_tratamento ?? '',
                    criterios_alta: c.criterios_alta ?? '',
                    prognostico: c.prognostico ?? '',
                    escalas_adicionais: c.escalas_adicionais ?? [],
                } : {}),
                ...(tipo === 'REEMBOLSO' ? {
                    medico_solicitante_crm: c.medico_solicitante_crm ?? '',
                    medico_solicitante_uf: c.medico_solicitante_uf ?? '',
                    codigo_tuss: c.codigo_tuss ?? '',
                    codigos_tuss_adicionais: c.codigos_tuss_adicionais ?? [],
                    sessoes_autorizadas: c.sessoes_autorizadas ?? null,
                    sessoes_realizadas: c.sessoes_realizadas ?? null,
                    periodo_tratamento_inicio: c.periodo_tratamento_inicio ?? '',
                    periodo_tratamento_fim: c.periodo_tratamento_fim ?? '',
                    prognostico: c.prognostico ?? '',
                    justificativa_continuidade: c.justificativa_continuidade ?? '',
                    valor_total: c.valor_total ?? null,
                } : {}),
            }
            setConteudo(novoConteudo)
            setTipoAssinatura(response.data.tipo_assinatura)
            conteudoInicialRef.current = JSON.stringify(novoConteudo)
            assinaturaInicialRef.current = response.data.tipo_assinatura
            setLaudoEditando(laudoId)
            setModalAberto(true)
        } catch (err) {
            toast.error(exibirErro(err, 'Erro ao carregar laudo.'))
        }
    }

    async function handleSalvarEdicao() {
        if (!laudoEditando) return
        setSalvando(true)
        try {
            await api.put(`/laudos/${laudoEditando}`, {
                conteudo,
                tipo_assinatura: tipoAssinatura,
            })
            setModalAberto(false)
            carregar()
        } catch (err) {
            toast.error(exibirErro(err, 'Erro ao salvar laudo.'))
        } finally {
            setSalvando(false)
        }
    }

    function handleBaixarPDF(laudo: Laudo) {
        if (laudo.pdf_url) {
            const a = document.createElement('a')
            a.href = laudo.pdf_url
            a.target = '_blank'
            a.rel = 'noopener noreferrer'
            a.click()
            return
        }

        api.get(`/laudos/${laudo.id}/pdf`, { responseType: 'blob' })
            .then((res) => {
                const objectUrl = URL.createObjectURL(res.data as Blob)
                const a = document.createElement('a')
                a.href = objectUrl
                a.download = `laudo-${laudo.id}.pdf`
                document.body.appendChild(a)
                a.click()
                setTimeout(() => {
                    document.body.removeChild(a)
                    URL.revokeObjectURL(objectUrl)
                }, 1000)
            })
            .catch(() => toast.error('Erro ao baixar laudo.'))
    }

    function handleBaixarDeclaracao(laudoId: string) {
        api.get(`/laudos/${laudoId}/declaracao-sessoes`, { responseType: 'blob' })
            .then((res) => {
                const objectUrl = URL.createObjectURL(res.data as Blob)
                const a = document.createElement('a')
                a.href = objectUrl
                a.download = `declaracao-sessoes.pdf`
                document.body.appendChild(a)
                a.click()
                setTimeout(() => {
                    document.body.removeChild(a)
                    URL.revokeObjectURL(objectUrl)
                }, 1000)
            })
            .catch(() => toast.error('Erro ao baixar declaração.'))
    }

    async function handleExcluirLaudo(laudoId: string) {
        try {
            await api.delete(`/laudos/${laudoId}`)
            toast.success('Laudo excluído.')
            carregar()
        } catch (err) {
            toast.error(exibirErro(err, 'Erro ao excluir laudo.'))
        }
    }

    return {
        laudos,
        carregando,
        gerando,
        modalAberto,
        setModalAberto,
        laudoEditando,
        laudoTipo,
        salvando,
        conteudo,
        setConteudo,
        tipoAssinatura,
        setTipoAssinatura,
        confirmCancelAberto,
        setConfirmCancelAberto,
        isDirty,
        handleGerarLaudo,
        handleAbrirEdicao,
        handleSalvarEdicao,
        handleBaixarPDF,
        handleBaixarDeclaracao,
        handleExcluirLaudo,
    }
}
