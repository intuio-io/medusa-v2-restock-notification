import { Entity, Property } from "@mikro-orm/core"
import { BaseEntity } from "@medusajs/framework/utils"

@Entity()
export class RestockSubscription extends BaseEntity {
    @Property()
    email!: string

    @Property()
    variant_id!: string

    @Property()
    product_title!: string

    @Property()
    variant_title!: string

    @Property({ default: false })
    notified: boolean = false

    @Property()
    created_at: Date = new Date()

    @Property({ onUpdate: () => new Date() })
    updated_at: Date = new Date()
}