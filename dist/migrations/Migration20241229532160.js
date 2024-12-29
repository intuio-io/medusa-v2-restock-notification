"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20241229532160 = void 0;
// src/migrations/Migration20240329000000.ts
const migrations_1 = require("@mikro-orm/migrations");
class Migration20241229532160 extends migrations_1.Migration {
    async up() {
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
        `);
        this.addSql(`
            alter table "restock_subscription"
            add constraint "restock_subscription_variant_id_foreign"
            foreign key ("variant_id")
            references "product_variant" ("id")
            on delete cascade;
        `);
        this.addSql(`
            create index "restock_subscription_variant_id_index"
            on "restock_subscription" ("variant_id")
            where "deleted_at" is null;
        `);
        this.addSql(`
            create index "restock_subscription_email_index"
            on "restock_subscription" ("email")
            where "deleted_at" is null;
        `);
    }
    async down() {
        this.addSql('drop table if exists "restock_subscription" cascade;');
    }
}
exports.Migration20241229532160 = Migration20241229532160;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWlncmF0aW9uMjAyNDEyMjk1MzIxNjAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWlncmF0aW9ucy9NaWdyYXRpb24yMDI0MTIyOTUzMjE2MC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw0Q0FBNEM7QUFDNUMsc0RBQWlEO0FBRWpELE1BQWEsdUJBQXdCLFNBQVEsc0JBQVM7SUFDcEQsS0FBSyxDQUFDLEVBQUU7UUFDTixJQUFJLENBQUMsTUFBTSxDQUFDOzs7Ozs7Ozs7Ozs7O1NBYVAsQ0FBQyxDQUFBO1FBRU4sSUFBSSxDQUFDLE1BQU0sQ0FBQzs7Ozs7O1NBTVAsQ0FBQyxDQUFBO1FBRU4sSUFBSSxDQUFDLE1BQU0sQ0FBQzs7OztTQUlQLENBQUMsQ0FBQTtRQUVOLElBQUksQ0FBQyxNQUFNLENBQUM7Ozs7U0FJUCxDQUFDLENBQUE7SUFDUixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQUk7UUFDUixJQUFJLENBQUMsTUFBTSxDQUFDLHNEQUFzRCxDQUFDLENBQUE7SUFDckUsQ0FBQztDQUNGO0FBekNELDBEQXlDQyJ9