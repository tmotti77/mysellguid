-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Note: pgvector extension is optional and requires additional setup
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Create indexes for better performance
-- Note: Additional indexes will be created by TypeORM migrations

-- Set default search path
ALTER DATABASE mysellguid SET search_path TO public, postgis;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE mysellguid TO postgres;
