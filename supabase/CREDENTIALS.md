# Supabase Credentials & Access

## Project Info
- **Project Name**: Mysell
- **Project Ref**: qfffuuqldmjtxxihynug
- **Dashboard**: https://supabase.com/dashboard/project/qfffuuqldmjtxxihynug

## API URLs
- **Project URL**: https://qfffuuqldmjtxxihynug.supabase.co
- **API URL**: https://qfffuuqldmjtxxihynug.supabase.co/functions/v1
- **REST API**: https://qfffuuqldmjtxxihynug.supabase.co/rest/v1

## API Keys
- **Anon Key** (public): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZmZ1dXFsZG1qdHh4aWh5bnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjAxMjksImV4cCI6MjA3ODIzNjEyOX0.f7ez30Y4W8C9c5Vy8TTBgnzXSUleSNZI7_M-AONXLEQ`
- **Service Role Key** (secret): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZmZ1dXFsZG1qdHh4aWh5bnVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjY2MDEyOSwiZXhwIjoyMDc4MjM2MTI5fQ.1Y9a_KbgS24WSQlhhXG2Mb39Ib6iSCpNQpGOnIJMsrI`

## Database
- **Connection String**: `postgresql://postgres:v8hqfgWG9qYYntqn@db.qfffuuqldmjtxxihynug.supabase.co:5432/postgres`
- **Host**: db.qfffuuqldmjtxxihynug.supabase.co
- **Port**: 5432
- **Database**: postgres
- **User**: postgres
- **Password**: `v8hqfgWG9qYYntqn`

## Deploy Access Token
- **Token**: `sbp_8dd56841c40d9936a6a4be6016a39ad9c5d2a422`

## Quick Commands

### Deploy Function
```bash
export SUPABASE_ACCESS_TOKEN=sbp_8dd56841c40d9936a6a4be6016a39ad9c5d2a422
npx supabase functions deploy FUNCTION_NAME --no-verify-jwt
```

### Link Project
```bash
export SUPABASE_ACCESS_TOKEN=sbp_8dd56841c40d9936a6a4be6016a39ad9c5d2a422
npx supabase link --project-ref qfffuuqldmjtxxihynug --password v8hqfgWG9qYYntqn
```

### Run SQL Migration
Go to: https://supabase.com/dashboard/project/qfffuuqldmjtxxihynug/sql/new

---

**⚠️ IMPORTANT**: Keep this file private! Add to .gitignore if committing.
