# Database Migrations Guide

## Overview

This project uses TypeORM migrations for database schema management. Migrations provide version control for your database schema and make it easy to deploy changes to production.

## Current Status

✅ **Migration system is set up and working!**
- Initial migration created: `InitialSchema1737756000000`
- All tables created: users, stores, sales, user_saved_sales
- PostGIS extension enabled
- Spatial indexes configured

## Migration Commands

```bash
# Show migration status
npm run migration:show

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration (auto-detect changes)
npm run migration:generate -- src/migrations/YourMigrationName
```

## Creating New Migrations

When you modify an entity (add/remove fields, change types, etc.):

1. **Make changes to entity file** (e.g., `src/modules/users/entities/user.entity.ts`)

2. **Generate migration**
   ```bash
   npm run migration:generate -- src/migrations/AddUserAvatar
   ```

3. **Review the generated migration** in `src/migrations/`
   - Check the `up()` method (applies changes)
   - Check the `down()` method (reverts changes)

4. **Test locally**
   ```bash
   # Run migration
   npm run migration:run

   # Test your changes
   npm run start:dev

   # Revert if needed
   npm run migration:revert
   ```

5. **Commit the migration file**
   ```bash
   git add src/migrations/
   git commit -m "Add user avatar migration"
   ```

## Production Deployment

1. **Backup database first!**
   ```bash
   pg_dump -h hostname -U username -d mysellguid > backup.sql
   ```

2. **Run migrations**
   ```bash
   NODE_ENV=production npm run migration:run
   ```

3. **Verify**
   ```bash
   npm run migration:show
   ```

4. **If something goes wrong**
   ```bash
   npm run migration:revert
   # Restore from backup if needed
   ```

## Initial Setup (Fresh Database)

For new developers or fresh database setup:

1. **Start PostgreSQL**
   ```bash
   cd infrastructure/docker
   docker-compose up -d
   ```

2. **Run migrations**
   ```bash
   cd backend
   npm run migration:run
   ```

3. **Seed database** (optional, for development data)
   ```bash
   npm run seed
   ```

## Troubleshooting

### "relation already exists" error
This happens when transitioning from `synchronize: true` to migrations. The tables exist but migrations aren't recorded. Mark migration as executed:

```bash
docker exec mysellguid-postgres psql -U postgres -d mysellguid -c "INSERT INTO migrations (timestamp, name) VALUES (1737756000000, 'InitialSchema1737756000000');"
```

### Migration fails midway
TypeORM runs migrations in a transaction, so a failed migration is rolled back. Check the error, fix the migration, and run again.

### Need to manually create migration
Create a file in `src/migrations/` with this template:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class YourMigrationName1234567890000 implements MigrationInterface {
  name = 'YourMigrationName1234567890000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Apply changes
    await queryRunner.query(`ALTER TABLE "users" ADD "newColumn" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "newColumn"`);
  }
}
```

## Configuration

- **Config file**: `src/config/typeorm.config.ts`
- **Migrations folder**: `src/migrations/`
- **Synchronize**: Set to `false` in production (use migrations instead)

## Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations locally** before deploying
3. **Never modify** executed migrations - create new ones instead
4. **Use transactions** - TypeORM does this automatically
5. **Review auto-generated migrations** - sometimes manual adjustments needed
6. **Keep migrations small** - easier to debug and revert
7. **Name descriptively** - e.g., `AddUserEmailVerification`, not `UpdateUsers`

## Schema Changes Requiring Migrations

- Adding/removing tables
- Adding/removing columns
- Changing column types
- Adding/removing indexes
- Adding/removing foreign keys
- Adding/removing constraints
- Renaming tables/columns

## What Migrations Don't Handle

- Data migrations (bulk updates, transformations)
- Seeds/fixtures (use separate seed scripts)
- Permissions (PostgreSQL roles, grants)

For data migrations, create a separate migration that manipulates data:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Schema change
  await queryRunner.query(`ALTER TABLE "users" ADD "status" varchar DEFAULT 'active'`);

  // Data migration
  await queryRunner.query(`UPDATE "users" SET "status" = 'active' WHERE "isActive" = true`);
  await queryRunner.query(`UPDATE "users" SET "status" = 'inactive' WHERE "isActive" = false`);
}
```

## Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostGIS Documentation](https://postgis.net/documentation/)
