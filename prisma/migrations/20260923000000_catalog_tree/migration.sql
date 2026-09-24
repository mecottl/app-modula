-- Árbol de catálogo (categorías > subcategorías > opciones, hasta 5
-- niveles) que reemplaza a finish_categories / finish_levels / extras /
-- extra_model. Se conservan los ids originales como ids de nodo: las
-- cotizaciones ya guardadas (quotes.finishOptionIds / extraIds, arreglos
-- de ids sin FK) y los webhooks ya enviados siguen resolviendo.
CREATE TABLE "catalog_nodes" (
    "id" TEXT NOT NULL,
    "developmentId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceDelta" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "selectionMode" "FinishSelectionMode" NOT NULL DEFAULT 'UNICA',
    "order" INTEGER NOT NULL DEFAULT 0,
    "restrictToModels" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_nodes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "catalog_nodes_developmentId_idx" ON "catalog_nodes"("developmentId");
CREATE INDEX "catalog_nodes_parentId_idx" ON "catalog_nodes"("parentId");

ALTER TABLE "catalog_nodes" ADD CONSTRAINT "catalog_nodes_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "developments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_nodes" ADD CONSTRAINT "catalog_nodes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "catalog_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "catalog_node_model" (
    "nodeId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,

    CONSTRAINT "catalog_node_model_pkey" PRIMARY KEY ("nodeId","modelId")
);

ALTER TABLE "catalog_node_model" ADD CONSTRAINT "catalog_node_model_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "catalog_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_node_model" ADD CONSTRAINT "catalog_node_model_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 1) Categorías de acabado -> nodos raíz.
INSERT INTO "catalog_nodes" ("id","developmentId","parentId","name","selectionMode","order","restrictToModels","createdAt","updatedAt")
SELECT "id","developmentId",NULL,"name","selectionMode","order",false,"createdAt","updatedAt"
FROM "finish_categories";

-- 2) Opciones de acabado -> hojas. El orden visible hoy es por precio
--    ascendente; se vuelve explícito para no cambiar cómo se ve.
INSERT INTO "catalog_nodes" ("id","developmentId","parentId","name","description","priceDelta","imageUrls","order","restrictToModels","createdAt","updatedAt")
SELECT "id","developmentId","finishCategoryId","name","description","priceDelta","imageUrls",
       (ROW_NUMBER() OVER (PARTITION BY "finishCategoryId" ORDER BY "priceDelta" ASC, "createdAt" ASC) - 1)::INTEGER,
       false,"createdAt","updatedAt"
FROM "finish_levels";

-- 3) Extras -> hojas bajo una categoría raíz "Extras" por desarrollo
--    (solo donde hay extras). Cada extra conserva su restricción por
--    modelo: hoy "sin modelos ligados" significa "no aplica a ningún
--    modelo", así que restrictToModels = true reproduce lo mismo.
INSERT INTO "catalog_nodes" ("id","developmentId","parentId","name","selectionMode","order","restrictToModels","createdAt","updatedAt")
SELECT 'extras_root_' || d."id", d."id", NULL, 'Extras', 'MULTIPLE',
       COALESCE((SELECT MAX(fc."order") + 1 FROM "finish_categories" fc WHERE fc."developmentId" = d."id"), 0),
       false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "developments" d
WHERE EXISTS (SELECT 1 FROM "extras" e WHERE e."developmentId" = d."id");

INSERT INTO "catalog_nodes" ("id","developmentId","parentId","name","description","priceDelta","imageUrls","order","restrictToModels","createdAt","updatedAt")
SELECT "id","developmentId",'extras_root_' || "developmentId","name","description","priceDelta","imageUrls",
       (ROW_NUMBER() OVER (PARTITION BY "developmentId" ORDER BY "name" ASC) - 1)::INTEGER,
       true,"createdAt","updatedAt"
FROM "extras";

INSERT INTO "catalog_node_model" ("nodeId","modelId")
SELECT "extraId","modelId" FROM "extra_model";

-- Las tablas antiguas (finish_categories, finish_levels, extras,
-- extra_model) NO se borran aquí: la base es compartida con producción y
-- el código desplegado todavía las usa. Se eliminan en una migración
-- posterior, una vez desplegado el código nuevo.

ALTER TABLE "catalog_nodes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_node_model" ENABLE ROW LEVEL SECURITY;
