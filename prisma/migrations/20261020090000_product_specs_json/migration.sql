-- Convert Product.specs from JSON-encoded TEXT to native JSONB, preserving existing data.
-- Runs in one transaction: if any row holds invalid JSON the cast fails and nothing changes.
BEGIN;

ALTER TABLE "Product" ALTER COLUMN "specs" DROP DEFAULT;

ALTER TABLE "Product"
  ALTER COLUMN "specs" TYPE JSONB
  USING (
    CASE
      WHEN "specs" IS NULL OR btrim("specs") = '' THEN '[]'::jsonb
      ELSE "specs"::jsonb
    END
  );

ALTER TABLE "Product" ALTER COLUMN "specs" SET DEFAULT '[]';

COMMIT;
