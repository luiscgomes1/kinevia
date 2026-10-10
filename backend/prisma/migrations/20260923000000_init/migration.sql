-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PROFISSIONAL', 'ATENDENTE');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('AGENDADO', 'COMPARECEU', 'FALTOU', 'DESMARCOU');

-- CreateEnum
CREATE TYPE "TipoSessao" AS ENUM ('AVALIACAO', 'SESSAO', 'REPOSICAO');

-- CreateEnum
CREATE TYPE "TipoPacote" AS ENUM ('INDIVIDUAL', 'PACOTE_5', 'PACOTE_10');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('AGUARDANDO', 'PAGO');

-- CreateEnum
CREATE TYPE "TipoLaudo" AS ENUM ('CLINICO', 'COMPLETO', 'REEMBOLSO');

-- CreateEnum
CREATE TYPE "TipoAssinatura" AS ENUM ('DIGITAL', 'MANUSCRITA');

-- CreateTable
CREATE TABLE "Clinica" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Clinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profissional" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PROFISSIONAL',
    "clinica_id" TEXT,
    "senha_temporaria" BOOLEAN NOT NULL DEFAULT false,
    "crefito" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "assinatura_path" TEXT,
    "logo_path" TEXT,
    "horario_inicio" TEXT NOT NULL DEFAULT '07:00',
    "horario_fim" TEXT NOT NULL DEFAULT '18:00',
    "preco_sessao_individual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "preco_pacote_5" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "preco_pacote_10" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Profissional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "clinica_id" TEXT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "endereco" TEXT NOT NULL,
    "estado_civil" TEXT NOT NULL,
    "nacionalidade" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "clinica_id" TEXT,
    "data" DATE NOT NULL,
    "horario" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'AGENDADO',
    "tipo" "TipoSessao" NOT NULL DEFAULT 'SESSAO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "lembrete_email_enviado" TIMESTAMP(3),

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prontuario" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "medico_solicitante" TEXT,
    "diagnostico_medico" TEXT,
    "queixa_principal" TEXT,
    "hda" TEXT,
    "hpp_has" BOOLEAN NOT NULL DEFAULT false,
    "hpp_dm" BOOLEAN NOT NULL DEFAULT false,
    "hpp_ca" BOOLEAN NOT NULL DEFAULT false,
    "hpp_cardiopatia" BOOLEAN NOT NULL DEFAULT false,
    "antecedentes_familiares" TEXT,
    "medicacoes" TEXT,
    "habitos_vida" TEXT,
    "exames_medicos" TEXT,
    "avaliacao_fisica" TEXT,
    "diagnostico_fisio" TEXT,
    "prognostico_fisio" TEXT,
    "plano_terapeutico" TEXT,
    "dor_eva" INTEGER,
    "pa" TEXT,
    "fr" TEXT,
    "fc" TEXT,
    "ap" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prontuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evolucao" (
    "id" TEXT NOT NULL,
    "prontuario_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "dor_eva" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correcao_texto" TEXT,
    "correcao_em" TIMESTAMP(3),

    CONSTRAINT "Evolucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pacote" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "clinica_id" TEXT,
    "tipo" "TipoPacote" NOT NULL,
    "quantidade_sessoes" INTEGER NOT NULL,
    "valor_cobrado" DECIMAL(10,2) NOT NULL,
    "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'AGUARDANDO',
    "pago_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pacote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoPacote" (
    "id" TEXT NOT NULL,
    "pacote_id" TEXT NOT NULL,
    "agendamento_id" TEXT NOT NULL,

    CONSTRAINT "SessaoPacote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laudo" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "clinica_id" TEXT,
    "conteudo" JSONB NOT NULL,
    "tipo" "TipoLaudo" NOT NULL DEFAULT 'CLINICO',
    "tipo_assinatura" "TipoAssinatura" NOT NULL DEFAULT 'MANUSCRITA',
    "pdf_path" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Laudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "paciente_id" TEXT,
    "acao" TEXT NOT NULL,
    "metadata" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profissional_email_key" ON "Profissional"("email");

-- CreateIndex
CREATE INDEX "Profissional_email_idx" ON "Profissional"("email");

-- CreateIndex
CREATE INDEX "Profissional_clinica_id_idx" ON "Profissional"("clinica_id");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_hash_idx" ON "PasswordResetToken"("token_hash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "Paciente_profissional_id_idx" ON "Paciente"("profissional_id");

-- CreateIndex
CREATE INDEX "Paciente_clinica_id_idx" ON "Paciente"("clinica_id");

-- CreateIndex
CREATE UNIQUE INDEX "Paciente_cpf_profissional_id_key" ON "Paciente"("cpf", "profissional_id");

-- CreateIndex
CREATE INDEX "Agendamento_profissional_id_data_status_idx" ON "Agendamento"("profissional_id", "data", "status");

-- CreateIndex
CREATE INDEX "Agendamento_profissional_id_data_idx" ON "Agendamento"("profissional_id", "data");

-- CreateIndex
CREATE INDEX "Agendamento_clinica_id_data_status_idx" ON "Agendamento"("clinica_id", "data", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Agendamento_profissional_id_data_horario_slot_key" ON "Agendamento"("profissional_id", "data", "horario", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "Prontuario_paciente_id_key" ON "Prontuario"("paciente_id");

-- CreateIndex
CREATE INDEX "Prontuario_paciente_id_idx" ON "Prontuario"("paciente_id");

-- CreateIndex
CREATE INDEX "Evolucao_prontuario_id_idx" ON "Evolucao"("prontuario_id");

-- CreateIndex
CREATE INDEX "Evolucao_dor_eva_criado_em_idx" ON "Evolucao"("dor_eva", "criado_em");

-- CreateIndex
CREATE INDEX "Pacote_profissional_id_criado_em_idx" ON "Pacote"("profissional_id", "criado_em");

-- CreateIndex
CREATE INDEX "Pacote_paciente_id_idx" ON "Pacote"("paciente_id");

-- CreateIndex
CREATE INDEX "Pacote_clinica_id_paciente_id_idx" ON "Pacote"("clinica_id", "paciente_id");

-- CreateIndex
CREATE UNIQUE INDEX "SessaoPacote_agendamento_id_key" ON "SessaoPacote"("agendamento_id");

-- CreateIndex
CREATE INDEX "SessaoPacote_pacote_id_idx" ON "SessaoPacote"("pacote_id");

-- CreateIndex
CREATE INDEX "Laudo_profissional_id_paciente_id_idx" ON "Laudo"("profissional_id", "paciente_id");

-- CreateIndex
CREATE INDEX "Laudo_clinica_id_paciente_id_idx" ON "Laudo"("clinica_id", "paciente_id");

-- CreateIndex
CREATE INDEX "Notificacao_profissional_id_lida_criado_em_idx" ON "Notificacao"("profissional_id", "lida", "criado_em");

-- CreateIndex
CREATE INDEX "AuditLog_profissional_id_criado_em_idx" ON "AuditLog"("profissional_id", "criado_em");

-- CreateIndex
CREATE INDEX "AuditLog_paciente_id_criado_em_idx" ON "AuditLog"("paciente_id", "criado_em");

-- AddForeignKey
ALTER TABLE "Profissional" ADD CONSTRAINT "Profissional_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prontuario" ADD CONSTRAINT "Prontuario_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evolucao" ADD CONSTRAINT "Evolucao_prontuario_id_fkey" FOREIGN KEY ("prontuario_id") REFERENCES "Prontuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pacote" ADD CONSTRAINT "Pacote_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pacote" ADD CONSTRAINT "Pacote_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pacote" ADD CONSTRAINT "Pacote_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoPacote" ADD CONSTRAINT "SessaoPacote_pacote_id_fkey" FOREIGN KEY ("pacote_id") REFERENCES "Pacote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoPacote" ADD CONSTRAINT "SessaoPacote_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "Agendamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laudo" ADD CONSTRAINT "Laudo_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laudo" ADD CONSTRAINT "Laudo_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laudo" ADD CONSTRAINT "Laudo_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "Profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
