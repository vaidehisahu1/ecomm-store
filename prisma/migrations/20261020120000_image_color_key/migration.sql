-- Add an explicit colour key to product images (replaces matching colours against alt text).
BEGIN;

ALTER TABLE "Image" ADD COLUMN "colorKey" TEXT;

-- Backfill existing rows created by the seed, whose alt text is exactly
-- "<product name> in <colour>" or "<product name> in <colour>, detail".
-- Exact comparisons only (no LIKE wildcards), so admin-written alt text is never mis-tagged;
-- anything that doesn't match stays NULL, meaning "shown for every colour".
UPDATE "Image" AS i
SET "colorKey" = m.color
FROM (
  SELECT DISTINCT ON (img.id) img.id, v.color
  FROM "Image" img
  JOIN "Product" p ON p.id = img."productId"
  JOIN "Variant" v ON v."productId" = img."productId" AND v.color IS NOT NULL
  WHERE lower(img.alt) IN (lower(p.name || ' in ' || v.color), lower(p.name || ' in ' || v.color || ', detail'))
  ORDER BY img.id, length(v.color) DESC
) AS m
WHERE i.id = m.id;

COMMIT;
