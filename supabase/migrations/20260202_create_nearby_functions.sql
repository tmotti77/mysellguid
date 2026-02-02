-- Create function to search nearby sales using PostGIS
CREATE OR REPLACE FUNCTION get_nearby_sales(
  p_longitude DECIMAL,
  p_latitude DECIMAL,
  p_radius INTEGER DEFAULT 5000,
  p_category TEXT DEFAULT NULL,
  p_min_discount INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  "discountPercentage" INTEGER,
  "originalPrice" DECIMAL,
  "salePrice" DECIMAL,
  currency TEXT,
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  status TEXT,
  images TEXT[],
  "storeId" UUID,
  latitude DECIMAL,
  longitude DECIMAL,
  source TEXT,
  "sourceUrl" TEXT,
  "sourceId" TEXT,
  "sourceType" TEXT,
  "autoDiscovered" BOOLEAN,
  "aiMetadata" JSONB,
  views INTEGER,
  clicks INTEGER,
  shares INTEGER,
  saves INTEGER,
  "createdAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ,
  distance DOUBLE PRECISION,
  store JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sale.id,
    sale.title,
    sale.description,
    sale.category::TEXT,
    sale."discountPercentage",
    sale."originalPrice",
    sale."salePrice",
    sale.currency,
    sale."startDate",
    sale."endDate",
    sale.status::TEXT,
    COALESCE(string_to_array(NULLIF(sale.images, ''), ','), ARRAY[]::text[]) as images,
    sale."storeId",
    sale.latitude,
    sale.longitude,
    sale.source::TEXT,
    sale."sourceUrl",
    sale."sourceId",
    sale."sourceType",
    sale."autoDiscovered",
    sale."aiMetadata",
    sale.views,
    sale.clicks,
    sale.shares,
    sale.saves,
    sale."createdAt",
    sale."updatedAt",
    ST_Distance(
      sale.location::geography,
      ST_SetSRID(ST_Point(p_longitude, p_latitude), 4326)::geography
    ) as distance,
    json_build_object(
      'id', store.id,
      'name', store.name,
      'category', store.category,
      'logo', store.logo,
      'address', store.address,
      'city', store.city
    ) as store
  FROM sales sale
  LEFT JOIN stores store ON sale."storeId" = store.id
  WHERE ST_DWithin(
    sale.location::geography,
    ST_SetSRID(ST_Point(p_longitude, p_latitude), 4326)::geography,
    p_radius
  )
  AND sale.status = 'active'
  AND sale."startDate" <= NOW()
  AND sale."endDate" >= NOW()
  AND (p_category IS NULL OR sale.category::TEXT = p_category)
  AND (p_min_discount IS NULL OR sale."discountPercentage" >= p_min_discount)
  ORDER BY distance ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create function for nearby stores
CREATE OR REPLACE FUNCTION get_nearby_stores(
  p_longitude DECIMAL,
  p_latitude DECIMAL,
  p_radius INTEGER DEFAULT 5000,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  logo TEXT,
  "coverImage" TEXT,
  email TEXT,
  "phoneNumber" TEXT,
  website TEXT,
  "instagramHandle" TEXT,
  "facebookPage" TEXT,
  address TEXT,
  city TEXT,
  "postalCode" TEXT,
  country TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  "openingHours" JSONB,
  "ownerId" UUID,
  "isVerified" BOOLEAN,
  "isActive" BOOLEAN,
  "totalSales" INTEGER,
  views INTEGER,
  rating DECIMAL,
  "reviewCount" INTEGER,
  "createdAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ,
  distance DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    store.id,
    store.name,
    store.description,
    store.category::TEXT,
    store.logo,
    store."coverImage",
    store.email,
    store."phoneNumber",
    store.website,
    store."instagramHandle",
    store."facebookPage",
    store.address,
    store.city,
    store."postalCode",
    store.country,
    store.latitude,
    store.longitude,
    store."openingHours",
    store."ownerId",
    store."isVerified",
    store."isActive",
    store."totalSales",
    store.views,
    store.rating,
    store."reviewCount",
    store."createdAt",
    store."updatedAt",
    ST_Distance(
      store.location::geography,
      ST_SetSRID(ST_Point(p_longitude, p_latitude), 4326)::geography
    ) as distance
  FROM stores store
  WHERE ST_DWithin(
    store.location::geography,
    ST_SetSRID(ST_Point(p_longitude, p_latitude), 4326)::geography,
    p_radius
  )
  AND store."isActive" = true
  ORDER BY distance ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
