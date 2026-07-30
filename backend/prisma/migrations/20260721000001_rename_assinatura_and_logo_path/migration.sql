-- Renomear assinatura_url -> assinatura_path (se a coluna antiga existir e a nova não)
DO $body$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Profissional' AND column_name = 'assinatura_url')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Profissional' AND column_name = 'assinatura_path') THEN
    ALTER TABLE "Profissional" RENAME COLUMN "assinatura_url" TO "assinatura_path";
  END IF;
END $body$;

-- Renomear logo_url -> logo_path (se a coluna antiga existir e a nova não)
DO $body$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Profissional' AND column_name = 'logo_url')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Profissional' AND column_name = 'logo_path') THEN
    ALTER TABLE "Profissional" RENAME COLUMN "logo_url" TO "logo_path";
  END IF;
END $body$;
