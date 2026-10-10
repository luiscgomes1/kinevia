import { useMemo, useRef, useState } from 'react'
import { Plus, X, CornerDownLeft } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
    CIF_CODIGOS,
    COMPONENTE_CIF_ROTULO,
    buscarItemCIF,
    componenteDoCodigo,
    type ItemCIF,
} from '../cifs-data'

interface Props {
    cifs: ItemCIF[]
    onChange: (cifs: ItemCIF[]) => void
}

function normalizar(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s.]+/g, '')
}

export default function CifPicker({ cifs, onChange }: Props) {
    const [termo, setTermo] = useState('')
    const [focado, setFocado] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const blurTimeoutRef = useRef<number | null>(null)

    function cancelarBlur() {
        if (blurTimeoutRef.current !== null) {
            window.clearTimeout(blurTimeoutRef.current)
            blurTimeoutRef.current = null
        }
    }

    function aoFocar() {
        cancelarBlur()
        setFocado(true)
    }

    function aoBlur() {
        blurTimeoutRef.current = window.setTimeout(() => setFocado(false), 150)
    }

    function manterFoco() {
        cancelarBlur()
        inputRef.current?.focus()
    }

    const sugestoes = useMemo(() => {
        const alvo = normalizar(termo.trim())
        if (!alvo) return []
        return CIF_CODIGOS
            .filter((item) =>
                normalizar(item.codigo).startsWith(alvo)
                || normalizar(item.descricao).includes(alvo)
                || normalizar(item.codigo).includes(alvo)
            )
            .filter((item) => !cifs.some((c) => c.codigo.toLowerCase() === item.codigo.toLowerCase()))
            .slice(0, 8)
    }, [termo, cifs])

    function adicionar(item: ItemCIF) {
        if (cifs.some((c) => c.codigo.toLowerCase() === item.codigo.toLowerCase())) return
        onChange([...cifs, item])
        setTermo('')
        manterFoco()
    }

    function remover(codigo: string) {
        onChange(cifs.filter((c) => c.codigo !== codigo))
    }

    function adicionarCodigoLivre(valor: string) {
        const codigo = valor.trim().toLowerCase()
        if (!/^[bsde]\d{2,3}(\.\d+)?$/.test(codigo)) return
        if (cifs.some((c) => c.codigo.toLowerCase() === codigo)) return
        const conhecido = buscarItemCIF(codigo)
        onChange([...cifs, {
            codigo,
            descricao: conhecido?.descricao ?? '',
            componente: conhecido?.componente ?? componenteDoCodigo(codigo),
        }])
        setTermo('')
        manterFoco()
    }

    function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (sugestoes.length > 0) {
                adicionar(sugestoes[0])
            } else if (termo.trim()) {
                adicionarCodigoLivre(termo)
            }
        }
        if (e.key === 'Escape') {
            setFocado(false)
            inputRef.current?.blur()
        }
    }

    const podeAdicionarLivre = termo.trim().length > 0 && sugestoes.length === 0

    return (
        <div className="space-y-2">
            <Label>Códigos CIF</Label>

            <div className="relative">
                <input
                    ref={inputRef}
                    value={termo}
                    onChange={(e) => setTermo(e.target.value)}
                    onFocus={aoFocar}
                    onBlur={aoBlur}
                    onKeyDown={aoTeclar}
                    placeholder="Digite o código ou descrição (ex.: b280, dor...) e clique para adicionar"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />

                {focado && sugestoes.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md overflow-hidden">
                        {sugestoes.map((item) => (
                            <button
                                key={item.codigo}
                                type="button"
                                onClick={() => adicionar(item)}
                                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                            >
                                <span className="font-mono text-xs font-semibold mt-0.5 shrink-0">{item.codigo}</span>
                                <span className="flex-1 min-w-0">
                                    <span className="block truncate">{item.descricao}</span>
                                    <span className="block text-[11px] text-muted-foreground">
                                        {COMPONENTE_CIF_ROTULO[item.componente]}
                                    </span>
                                </span>
                                <Plus className="w-3.5 h-3.5 mt-1 shrink-0 text-muted-foreground" />
                            </button>
                        ))}
                    </div>
                )}

                {focado && podeAdicionarLivre && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md">
                        <button
                            type="button"
                            onClick={() => adicionarCodigoLivre(termo)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                        >
                            <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>
                                Adicionar código livre{' '}
                                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{termo.trim()}</span>
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {cifs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                    Nenhum código adicionado. Comece digitando, ex.: b280, s750, d450, e120.
                </p>
            ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {cifs.map((c) => (
                        <span
                            key={c.codigo}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 pr-1 pl-2 py-0.5 text-sm"
                            title={COMPONENTE_CIF_ROTULO[c.componente]}
                        >
                            <span className="font-mono text-xs font-semibold">{c.codigo}</span>
                            {c.descricao && (
                                <span className="max-w-[220px] truncate text-xs text-muted-foreground">
                                    {c.descricao}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => remover(c.codigo)}
                                className="p-0.5 rounded text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
                                aria-label={`Remover ${c.codigo}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <p className="text-[11px] text-muted-foreground">
                Componentes: {Object.values(COMPONENTE_CIF_ROTULO).join(' · ')}. Se o código não estiver na lista, pressione Enter para adicioná-lo mesmo assim.
            </p>
        </div>
    )
}