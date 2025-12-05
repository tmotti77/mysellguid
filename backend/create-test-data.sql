-- MySellGuid Test Data for Production
-- Run this in Render Dashboard → Database → Shell

-- 1. Create test user (password: password123)
INSERT INTO "user" (id, email, "firstName", "lastName", password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'test@mysellguid.com',
  'Test',
  'User',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Zq7H8TJ.FfT5MFUJrq1Oe', -- password123
  'buyer',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 2. Create test store owner
INSERT INTO "user" (id, email, "firstName", "lastName", password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'owner@mysellguid.com',
  'Store',
  'Owner',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Zq7H8TJ.FfT5MFUJrq1Oe', -- password123
  'seller',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 3. Create test stores (using your actual location: 32.1544678, 34.9167442)
INSERT INTO store (id, name, description, address, location, "phoneNumber", "ownerId", "isActive", "createdAt", "updatedAt")
VALUES
  (
    'c1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'SuperSale Ramat Hasharon',
    'Electronics and home appliances store',
    '123 Sokolov St, Ramat Hasharon',
    ST_SetSRID(ST_Point(34.9167442, 32.1544678), 4326),
    '+972-50-1234567',
    'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    true,
    NOW(),
    NOW()
  ),
  (
    'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'Fashion Week Outlet',
    'Clothing and accessories',
    '456 Ahuza St, Ramat Hasharon',
    ST_SetSRID(ST_Point(34.9177442, 32.1554678), 4326),
    '+972-50-2345678',
    'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    true,
    NOW(),
    NOW()
  ),
  (
    'c3ffbc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'Home Decor Plus',
    'Furniture and home decoration',
    '789 Basel St, Ramat Hasharon',
    ST_SetSRID(ST_Point(34.9167442, 32.1534678), 4326),
    '+972-50-3456789',
    'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Create active sales (next 30 days)
INSERT INTO sale (
  id, title, description, "discountPercentage", "startDate", "endDate",
  "storeId", "isActive", "createdAt", "updatedAt"
)
VALUES
  (
    'd1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'Massive Electronics Sale - Up to 50% Off',
    'TVs, laptops, smartphones, and more at incredible prices',
    50,
    NOW(),
    NOW() + INTERVAL '30 days',
    'c1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    true,
    NOW(),
    NOW()
  ),
  (
    'd2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a77',
    'Summer Fashion Clearance',
    'All summer collections 40% off',
    40,
    NOW(),
    NOW() + INTERVAL '30 days',
    'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    true,
    NOW(),
    NOW()
  ),
  (
    'd3ffbc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    'Home Makeover Sale',
    'Furniture, decor, and accessories - special prices',
    35,
    NOW(),
    NOW() + INTERVAL '30 days',
    'c3ffbc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    true,
    NOW(),
    NOW()
  ),
  (
    'd4ffbc99-9c0b-4ef8-bb6d-6bb9bd380a99',
    'Gaming Laptops - Limited Stock',
    'High-performance gaming laptops at unbeatable prices',
    45,
    NOW(),
    NOW() + INTERVAL '30 days',
    'c1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    true,
    NOW(),
    NOW()
  ),
  (
    'd5ffbc99-9c0b-4ef8-bb6d-6bb9bd380aaa',
    'Designer Handbags Sale',
    'Luxury handbags up to 60% off',
    60,
    NOW(),
    NOW() + INTERVAL '30 days',
    'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Verify data
SELECT 'Users created:' as info, COUNT(*) as count FROM "user";
SELECT 'Stores created:' as info, COUNT(*) as count FROM store;
SELECT 'Sales created:' as info, COUNT(*) as count FROM sale;
