-- Renomear pdf_url -> pdf_path na tabela Laudo (se a coluna antiga existir e a nova não)
DO $body$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Laudo' AND column_name = 'pdf_url')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Laudo' AND column_name = 'pdf_path') THEN
    ALTER TABLE "Laudo" RENAME COLUMN "pdf_url" TO "pdf_path";
  END IF;
END $body$;
