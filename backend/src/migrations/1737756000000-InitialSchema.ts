import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1737756000000 implements MigrationInterface {
  name = 'InitialSchema1737756000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "firstName" character varying,
        "lastName" character varying,
        "phoneNumber" character varying,
        "role" character varying NOT NULL DEFAULT 'user',
        "avatar" character varying,
        "preferences" jsonb,
        "defaultLatitude" numeric(10,7),
        "defaultLongitude" numeric(10,7),
        "fcmToken" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "refreshToken" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lastLoginAt" TIMESTAMP,
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create stores table
    await queryRunner.query(`
      CREATE TABLE "stores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "category" character varying NOT NULL DEFAULT 'other',
        "logo" character varying,
        "coverImage" character varying,
        "email" character varying,
        "phoneNumber" character varying,
        "website" character varying,
        "instagramHandle" character varying,
        "facebookPage" character varying,
        "address" character varying NOT NULL,
        "city" character varying NOT NULL,
        "postalCode" character varying,
        "country" character varying NOT NULL DEFAULT 'Israel',
        "location" geography(Point,4326) NOT NULL,
        "latitude" numeric(10,7) NOT NULL,
        "longitude" numeric(10,7) NOT NULL,
        "openingHours" jsonb,
        "ownerId" uuid,
        "isVerified" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "totalSales" integer NOT NULL DEFAULT 0,
        "views" integer NOT NULL DEFAULT 0,
        "rating" numeric(3,2) NOT NULL DEFAULT 0,
        "reviewCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stores" PRIMARY KEY ("id")
      )
    `);

    // Create spatial index on stores.location
    await queryRunner.query(`
      CREATE INDEX "IDX_stores_location" ON "stores" USING GIST ("location")
    `);

    // Create sales table
    await queryRunner.query(`
      CREATE TABLE "sales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "category" character varying NOT NULL DEFAULT 'other',
        "discountPercentage" integer,
        "originalPrice" numeric(10,2),
        "salePrice" numeric(10,2),
        "currency" character varying NOT NULL DEFAULT 'ILS',
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        "status" character varying NOT NULL DEFAULT 'active',
        "images" text NOT NULL,
        "storeId" uuid NOT NULL,
        "location" geography(Point,4326) NOT NULL,
        "latitude" numeric(10,7) NOT NULL,
        "longitude" numeric(10,7) NOT NULL,
        "source" character varying NOT NULL DEFAULT 'store_dashboard',
        "sourceUrl" character varying,
        "sourceId" character varying,
        "aiMetadata" jsonb,
        "views" integer NOT NULL DEFAULT 0,
        "clicks" integer NOT NULL DEFAULT 0,
        "shares" integer NOT NULL DEFAULT 0,
        "saves" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales" PRIMARY KEY ("id")
      )
    `);

    // Create indexes on sales table
    await queryRunner.query(`
      CREATE INDEX "IDX_sales_storeId" ON "sales" ("storeId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sales_location" ON "sales" USING GIST ("location")
    `);

    // Create user_saved_sales table
    await queryRunner.query(`
      CREATE TABLE "user_saved_sales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "saleId" uuid NOT NULL,
        "savedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "metadata" jsonb,
        CONSTRAINT "PK_user_saved_sales" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_saved_sales_userId_saleId" UNIQUE ("userId", "saleId")
      )
    `);

    // Create indexes on user_saved_sales table
    await queryRunner.query(`
      CREATE INDEX "IDX_user_saved_sales_userId" ON "user_saved_sales" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_saved_sales_saleId" ON "user_saved_sales" ("saleId")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "stores"
      ADD CONSTRAINT "FK_stores_ownerId"
      FOREIGN KEY ("ownerId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD CONSTRAINT "FK_sales_storeId"
      FOREIGN KEY ("storeId") REFERENCES "stores"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_saved_sales"
      ADD CONSTRAINT "FK_user_saved_sales_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_saved_sales"
      ADD CONSTRAINT "FK_user_saved_sales_saleId"
      FOREIGN KEY ("saleId") REFERENCES "sales"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "user_saved_sales" DROP CONSTRAINT "FK_user_saved_sales_saleId"`);
    await queryRunner.query(`ALTER TABLE "user_saved_sales" DROP CONSTRAINT "FK_user_saved_sales_userId"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_sales_storeId"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP CONSTRAINT "FK_stores_ownerId"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_user_saved_sales_saleId"`);
    await queryRunner.query(`DROP INDEX "IDX_user_saved_sales_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_location"`);
    await queryRunner.query(`DROP INDEX "IDX_sales_storeId"`);
    await queryRunner.query(`DROP INDEX "IDX_stores_location"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "user_saved_sales"`);
    await queryRunner.query(`DROP TABLE "sales"`);
    await queryRunner.query(`DROP TABLE "stores"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Note: We don't drop PostGIS extension as other databases might be using it
  }
}
