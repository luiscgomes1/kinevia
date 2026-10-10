import { useState } from 'react'
import { Loader2, Plus, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LaudoCard from './LaudoCard'
import ClinicoForm from './modal/ClinicoForm'
import CompletoForm from './modal/CompletoForm'
import ReembolsoForm from './modal/ReembolsoForm'
import { useLaudos } from './useLaudos'
import { TIPO_ROTULO, type ConteudoCompleto, type ConteudoReembolso, type ConteudoBase, type Laudo } from './types'

interface Props {
    pacienteId: string
}

export default function LaudosTab({ pacienteId }: Props) {
    const [laudoExcluindo, setLaudoExcluindo] = useState<Laudo | null>(null)
    const {
        laudos, carregando, gerando,
        modalAberto, setModalAberto,
        laudoEditando, laudoTipo, salvando,
        conteudo, setConteudo,
        tipoAssinatura, setTipoAssinatura,
        confirmCancelAberto, setConfirmCancelAberto,
        isDirty,
        handleGerarLaudo,
        handleAbrirEdicao,
        handleSalvarEdicao,
        handleBaixarPDF,
        handleBaixarDeclaracao,
        handleExcluirLaudo,
    } = useLaudos(pacienteId)

    if (carregando) {
        return (
            <div className="space-y-3 py-4">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/70 animate-pulse rounded-lg" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-5">

            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {laudos.length} laudo{laudos.length !== 1 ? 's' : ''} gerado{laudos.length !== 1 ? 's' : ''}
                </p>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" disabled={gerando} className="gap-1.5">
                            {gerando
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Plus className="w-3.5 h-3.5" />
                            }
                            {gerando ? 'Gerando...' : 'Gerar laudo'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleGerarLaudo('CLINICO')}>
                            Clínico
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGerarLaudo('COMPLETO')}>
                            Completo (perícia)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGerarLaudo('REEMBOLSO')}>
                            Reembolso
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Lista vazia */}
            {laudos.length === 0 && (
                <div className="text-center py-10">
                    <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum laudo gerado ainda.</p>
                </div>
            )}

            {/* Lista de laudos */}
            <div className="space-y-2">
                {laudos.map((laudo) => (
                    <LaudoCard
                        key={laudo.id}
                        laudo={laudo}
                        onEditar={handleAbrirEdicao}
                        onBaixarPDF={handleBaixarPDF}
                        onBaixarDeclaracao={handleBaixarDeclaracao}
                        onExcluir={setLaudoExcluindo}
                    />
                ))}
            </div>

            {/* Modal de edição */}
            <Dialog open={modalAberto} onOpenChange={(aberto) => {
                if (!aberto && isDirty()) {
                    setConfirmCancelAberto(true)
                } else {
                    setModalAberto(aberto)
                }
            }}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar laudo — {TIPO_ROTULO[laudoTipo]}</DialogTitle>
                    </DialogHeader>

                    {confirmCancelAberto ? (
                        <div className="space-y-4 py-4">
                            <h3 className="text-base font-semibold">Descartar alterações?</h3>
                            <p className="text-sm text-muted-foreground">
                                As alterações feitas neste laudo serão perdidas.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setConfirmCancelAberto(false)}>
                                    Voltar
                                </Button>
                                <Button variant="destructive" onClick={() => { setConfirmCancelAberto(false); setModalAberto(false) }}>
                                    Descartar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {laudoTipo === 'COMPLETO' ? (
                                <CompletoForm
                                    conteudo={conteudo as ConteudoCompleto}
                                    onChange={(p) => setConteudo((prev) => ({ ...prev, ...p }))}
                                    tipoAssinatura={tipoAssinatura}
                                    onChangeAssinatura={setTipoAssinatura}
                                />
                            ) : laudoTipo === 'REEMBOLSO' ? (
                                <ReembolsoForm
                                    conteudo={conteudo as ConteudoReembolso}
                                    onChange={(p) => setConteudo((prev) => ({ ...prev, ...p }))}
                                    tipoAssinatura={tipoAssinatura}
                                    onChangeAssinatura={setTipoAssinatura}
                                />
                            ) : (
                                <ClinicoForm
                                    conteudo={conteudo as ConteudoBase}
                                    onChange={(p) => setConteudo((prev) => ({ ...prev, ...p }))}
                                    tipoAssinatura={tipoAssinatura}
                                    onChangeAssinatura={setTipoAssinatura}
                                />
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button
                                    className="flex-1 gap-2"
                                    onClick={handleSalvarEdicao}
                                    disabled={salvando}
                                >
                                    {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {salvando ? 'Salvando...' : 'Salvar laudo'}
                                </Button>
                                {laudoTipo === 'REEMBOLSO' && laudoEditando && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleBaixarDeclaracao(laudoEditando)}
                                        className="gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Declaração
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const l = laudos.find((l) => l.id === laudoEditando)
                                        if (l) handleBaixarPDF(l)
                                    }}
                                    className="gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Baixar PDF
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        if (isDirty()) {
                                            setConfirmCancelAberto(true)
                                        } else {
                                            setModalAberto(false)
                                        }
                                    }}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmação de exclusão de laudo */}
            <Dialog open={!!laudoExcluindo} onOpenChange={(aberto) => {
                if (!aberto) setLaudoExcluindo(null)
            }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Excluir laudo?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Este laudo ainda não foi salvo como arquivo na clínica. Ele será removido
                        definitivamente do sistema. Deseja continuar?
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setLaudoExcluindo(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (laudoExcluindo) {
                                    handleExcluirLaudo(laudoExcluindo.id)
                                    setLaudoExcluindo(null)
                                }
                            }}
                        >
                            Excluir
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
