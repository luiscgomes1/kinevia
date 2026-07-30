-- Migration: add_tipo_laudo
-- Adiciona enum TipoLaudo e coluna tipo à tabela Laudo

CREATE TYPE "TipoLaudo" AS ENUM ('CLINICO', 'COMPLETO', 'REEMBOLSO');

ALTER TABLE "Laudo" ADD COLUMN "tipo" "TipoLaudo" NOT NULL DEFAULT 'CLINICO';
