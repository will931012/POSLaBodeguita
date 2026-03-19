ALTER TABLE products
ADD COLUMN IF NOT EXISTS perfume_size VARCHAR(80),
ADD COLUMN IF NOT EXISTS fragrance_type VARCHAR(80),
ADD COLUMN IF NOT EXISTS perfume_condition VARCHAR(80);

CREATE INDEX IF NOT EXISTS idx_products_perfume_size ON products(perfume_size);
CREATE INDEX IF NOT EXISTS idx_products_fragrance_type ON products(fragrance_type);
CREATE INDEX IF NOT EXISTS idx_products_perfume_condition ON products(perfume_condition);
