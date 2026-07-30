import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EscalaDor } from '@/components/ui/escala-dor'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Save, Loader2, Info } from 'lucide-react'
import type { FormEvent } from 'react'

interface FormData {
  medico_solicitante: string
  diagnostico_medico: string
  queixa_principal: string
  hda: string
  hpp_has: boolean
  hpp_dm: boolean
  hpp_ca: boolean
  hpp_cardiopatia: boolean
  antecedentes_familiares: string
  medicacoes: string
  habitos_vida: string
  exames_medicos: string
  avaliacao_fisica: string
  diagnostico_fisio: string
  prognostico_fisio: string
  plano_terapeutico: string
  dor_eva: number | null
  pa: string
  fr: string
  fc: string
  ap: string
}

interface Props {
  form: FormData
  onChange: (campo: string, valor: string | boolean | number | null) => void
  onSalvar: (e: FormEvent<HTMLFormElement>) => void
  salvando: boolean
  sucesso: boolean
  prontuarioPreenchido: boolean
}

export default function FormAvaliacaoInicial({
  form, onChange, onSalvar, salvando, sucesso, prontuarioPreenchido
}: Props) {
  return (
    <>
      {/* Avaliação inicial */}
      <form onSubmit={onSalvar} className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Avaliação inicial</h3>
          {prontuarioPreenchido && (
            <span className="text-xs text-green-700 bg-verde-claro/15 px-2 py-0.5 rounded-full border border-verde-claro/40">
              ✓ Preenchida
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Médico solicitante</Label>
            <Input
              value={form.medico_solicitante}
              onChange={(e) => onChange('medico_solicitante', e.target.value)}
              placeholder="Nome do médico"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Diagnóstico médico</Label>
            <Input
              value={form.diagnostico_medico}
              onChange={(e) => onChange('diagnostico_medico', e.target.value)}
              placeholder="CID ou descrição"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Queixa principal</Label>
          <Textarea
            value={form.queixa_principal}
            onChange={(e) => onChange('queixa_principal', e.target.value)}
            rows={2}
            placeholder="Motivo da consulta / queixa principal do paciente..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        <EscalaDor
          value={form.dor_eva}
          onChange={(v) => onChange('dor_eva', v)}
          label="Dor à avaliação (EVA 0-10)"
        />

        <div className="space-y-1.5">
          <Label>Histórico da doença atual (HDA)</Label>
          <Textarea
            value={form.hda}
            onChange={(e) => onChange('hda', e.target.value)}
            rows={3}
            placeholder="Descreva o histórico da doença atual..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Histórico de patologia pregressa (HPP)</Label>
          <TooltipProvider>
            <div className="flex flex-wrap gap-3">
              {[
                { campo: 'hpp_has', label: 'HAS', desc: 'Hipertensão Arterial Sistêmica (pressão alta)' },
                { campo: 'hpp_dm', label: 'DM', desc: 'Diabetes Mellitus (açúcar elevado no sangue)' },
                { campo: 'hpp_ca', label: 'CA', desc: 'Câncer / Neoplasia maligna' },
                { campo: 'hpp_cardiopatia', label: 'Cardiopatia', desc: 'Doença cardíaca (problemas no coração)' },
              ].map(({ campo, label, desc }) => (
                <Tooltip key={campo}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onChange(campo, !form[campo as keyof typeof form])}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        form[campo as keyof typeof form]
                          ? 'bg-primary text-white border-primary'
                          : 'bg-card text-muted-foreground border-border hover:bg-accent'
                      }`}
                    >
                      {label}
                      <Info className="w-3 h-3 opacity-60" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{desc}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        <div className="space-y-1.5">
          <Label>Antecedentes familiares</Label>
          <Textarea
            value={form.antecedentes_familiares}
            onChange={(e) => onChange('antecedentes_familiares', e.target.value)}
            rows={2}
            placeholder="Histórico de doenças na família..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Medicações</Label>
            <Textarea
              value={form.medicacoes}
              onChange={(e) => onChange('medicacoes', e.target.value)}
              rows={2}
              placeholder="Medicamentos em uso..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hábitos de vida</Label>
            <Textarea
              value={form.habitos_vida}
              onChange={(e) => onChange('habitos_vida', e.target.value)}
              rows={2}
              placeholder="Atividade física, alimentação..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Exames médicos</Label>
          <Textarea
            value={form.exames_medicos}
            onChange={(e) => onChange('exames_medicos', e.target.value)}
            rows={2}
            placeholder="Exames realizados e resultados relevantes..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Avaliação física</Label>
            <Textarea
              value={form.avaliacao_fisica}
              onChange={(e) => onChange('avaliacao_fisica', e.target.value)}
              rows={2}
              placeholder="Achados do exame físico..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Diagnóstico fisioterapêutico</Label>
            <Textarea
              value={form.diagnostico_fisio}
              onChange={(e) => onChange('diagnostico_fisio', e.target.value)}
              rows={2}
              placeholder="Diagnóstico funcional..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Prognóstico fisioterapêutico</Label>
          <Textarea
            value={form.prognostico_fisio}
            onChange={(e) => onChange('prognostico_fisio', e.target.value)}
            rows={2}
            placeholder="Expectativa de evolução e tempo estimado de recuperação..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Plano terapêutico</Label>
          <Textarea
            value={form.plano_terapeutico}
            onChange={(e) => onChange('plano_terapeutico', e.target.value)}
            rows={3}
            placeholder="Recursos, métodos, técnicas, objetivos e quantitativo de atendimentos..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>Sinais vitais</Label>
          <TooltipProvider>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { campo: 'pa', label: 'PA', desc: 'Pressão Arterial (mmHg) — ex: 120/80' },
                { campo: 'fr', label: 'FR', desc: 'Frequência Respiratória (respirações/min) — ex: 16' },
                { campo: 'fc', label: 'FC', desc: 'Frequência Cardíaca (batimentos/min) — ex: 72' },
                { campo: 'ap', label: 'AP', desc: 'Ausência Pulmonar — achados da ausculta' },
              ].map(({ campo, label, desc }) => (
                <div key={campo} className="space-y-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top">{desc}</TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    value={form[campo as keyof typeof form] as string}
                    onChange={(e) => onChange(campo, e.target.value)}
                    placeholder={label}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {sucesso && (
          <p className="text-sm text-green-700 bg-verde-claro/15 border border-verde-claro/40 rounded-lg px-3 py-2">
            ✓ Prontuário salvo com sucesso!
          </p>
        )}

        <Button type="submit" disabled={salvando} className="gap-2">
          {salvando
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
          {salvando ? 'Salvando...' : 'Salvar avaliação'}
        </Button>
      </form>
    </>
  )
}
