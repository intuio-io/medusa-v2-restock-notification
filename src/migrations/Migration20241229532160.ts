// src/migrations/Migration20240329000000.ts
import { Migration } from "@mikro-orm/migrations"

export class Migration20241229532160 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
            create table if not exists "restock_subscription" (
                "id" text not null,
                "email" text not null,
                "variant_id" text not null,
                "product_title" text not null,
                "variant_title" text not null,
                "notified" boolean not null default false,
                "created_at" timestamptz not null default now(),
                "updated_at" timestamptz not null default now(),
                "deleted_at" timestamptz null,
                constraint "restock_subscription_pkey" primary key ("id")
            );
        `)

    this.addSql(`
            alter table "restock_subscription"
            add constraint "restock_subscription_variant_id_foreign"
            foreign key ("variant_id")
            references "product_variant" ("id")
            on delete cascade;
        `)

    this.addSql(`
            create index "restock_subscription_variant_id_index"
            on "restock_subscription" ("variant_id")
            where "deleted_at" is null;
        `)

    this.addSql(`
            create index "restock_subscription_email_index"
            on "restock_subscription" ("email")
            where "deleted_at" is null;
        `)
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "restock_subscription" cascade;')
  }
}