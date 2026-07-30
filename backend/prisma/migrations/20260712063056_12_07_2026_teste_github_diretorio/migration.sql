/*
  Warnings:

  - You are about to drop the column `preco_pacote_10` on the `Paciente` table. All the data in the column will be lost.
  - You are about to drop the column `preco_pacote_5` on the `Paciente` table. All the data in the column will be lost.
  - You are about to drop the column `preco_sessao_individual` on the `Paciente` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SessaoPacote" DROP CONSTRAINT "SessaoPacote_agendamento_id_fkey";

-- DropForeignKey
ALTER TABLE "SessaoPacote" DROP CONSTRAINT "SessaoPacote_pacote_id_fkey";

-- AlterTable
ALTER TABLE "Paciente" DROP COLUMN "preco_pacote_10",
DROP COLUMN "preco_pacote_5",
DROP COLUMN "preco_sessao_individual",
ALTER COLUMN "data_nascimento" SET DATA TYPE DATE;

-- CreateIndex
CREATE INDEX "Agendamento_profissional_id_data_status_idx" ON "Agendamento"("profissional_id", "data", "status");

-- CreateIndex
CREATE INDEX "Agendamento_profissional_id_data_idx" ON "Agendamento"("profissional_id", "data");

-- CreateIndex
CREATE INDEX "Evolucao_prontuario_id_idx" ON "Evolucao"("prontuario_id");

-- CreateIndex
CREATE INDEX "Evolucao_dor_eva_criado_em_idx" ON "Evolucao"("dor_eva", "criado_em");

-- CreateIndex
CREATE INDEX "Laudo_profissional_id_paciente_id_idx" ON "Laudo"("profissional_id", "paciente_id");

-- CreateIndex
CREATE INDEX "Paciente_profissional_id_idx" ON "Paciente"("profissional_id");

-- CreateIndex
CREATE INDEX "Pacote_profissional_id_criado_em_idx" ON "Pacote"("profissional_id", "criado_em");

-- CreateIndex
CREATE INDEX "Pacote_paciente_id_idx" ON "Pacote"("paciente_id");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "Profissional_email_idx" ON "Profissional"("email");

-- CreateIndex
CREATE INDEX "Prontuario_paciente_id_idx" ON "Prontuario"("paciente_id");

-- CreateIndex
CREATE INDEX "SessaoPacote_pacote_id_idx" ON "SessaoPacote"("pacote_id");

-- AddForeignKey
ALTER TABLE "SessaoPacote" ADD CONSTRAINT "SessaoPacote_pacote_id_fkey" FOREIGN KEY ("pacote_id") REFERENCES "Pacote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoPacote" ADD CONSTRAINT "SessaoPacote_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "Agendamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
