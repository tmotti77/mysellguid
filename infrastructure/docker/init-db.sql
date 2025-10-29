-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pgvector extension for ML embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create indexes for better performance
-- Note: Additional indexes will be created by TypeORM migrations

-- Set default search path
ALTER DATABASE mysellguid SET search_path TO public, postgis;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE mysellguid TO postgres;
