// src/services/restock.ts
import { MedusaService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/utils"
import { EntityManager } from "@mikro-orm/core"
import { RestockSubscription } from "../models/restock-subscription"
import { Logger } from "@medusajs/types"

type InjectedDependencies = {
    manager: EntityManager
    logger: Logger
}

export class RestockService extends MedusaService({
    RestockSubscription,
}) {
    protected readonly logger_: Logger
    protected manager: EntityManager

    constructor(container: InjectedDependencies) {
        super(container)
        this.logger_ = container.logger
        this.manager = container.manager
    }

    async subscribe(
        variantId: string,
        email: string,
        productTitle: string,
        variantTitle: string
    ): Promise<RestockSubscription> {
        try {
            if (!this.isValidEmail(email)) {
                throw new MedusaError(
                    MedusaError.Types.INVALID_DATA,
                    "Invalid email format"
                )
            }

            // Query for the subscription
            const subscriptionRepo = this.manager.getRepository(RestockSubscription)
            const existingSubscription = await subscriptionRepo.findOne({
                email,
                variant_id: variantId,
                notified: false,
            })

            if (existingSubscription) {
                throw new MedusaError(
                    MedusaError.Types.DUPLICATE_ERROR,
                    `Already subscribed to restock notifications for this product`
                )
            }

            // Create new subscription
            const subscription = subscriptionRepo.create({
                email,
                variant_id: variantId,
                product_title: productTitle,
                variant_title: variantTitle,
                notified: false,
            })

            this.manager.persist(subscription)
            await this.manager.flush()

            return subscription
        } catch (error) {
            this.logger_.error("Error in subscribe:", error)
            throw error
        }
    }
    async getSubscribers(variantId: string): Promise<RestockSubscription[]> {
        const subscriptionRepo = this.manager.getRepository(RestockSubscription)
        return await subscriptionRepo.find({
            variant_id: variantId,
            notified: false,
        }, {
            orderBy: [{ created_at: 'ASC' }]
        })
    }

    async markNotified(subscriptionIds: string[]): Promise<void> {
        const subscriptionRepo = this.manager.getRepository(RestockSubscription)
        await subscriptionRepo.nativeUpdate(
            { id: { $in: subscriptionIds } },
            { notified: true }
        )
        await this.manager.flush()
    }

    async listSubscriptions(
        email: string,
    ): Promise<RestockSubscription[]> {
        const subscriptionRepo = this.manager.getRepository(RestockSubscription)
        return await subscriptionRepo.find(
            { email },
            { orderBy: [{ created_at: 'DESC' }] }
        )
    }

    async getAllActiveSubscriptions(): Promise<RestockSubscription[]> {
        const subscriptionRepo = this.manager.getRepository(RestockSubscription)
        return await subscriptionRepo.find({
            notified: false
        }, {
            orderBy: [{ created_at: 'ASC' }]
        })
    }

    async isSubscribed(
        email: string,
        variantId: string
    ): Promise<{
        is_subscribed: boolean,
        subscription?: RestockSubscription
    }> {
        const subscriptionRepo = this.manager.getRepository(RestockSubscription)

        const subscription = await subscriptionRepo.findOne({
            email,
            variant_id: variantId,
            notified: false,
        })

        return {
            is_subscribed: !!subscription,
            subscription: subscription || undefined
        }
    }

    async removeSubscription(
        id: string,
        email: string
    ): Promise<void> {
        const subscriptionRepo = this.manager.getRepository(RestockSubscription)

        const subscription = await subscriptionRepo.findOne({
            id,
            email
        })

        if (!subscription) {
            throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Subscription with id ${id} not found for email ${email}`
            )
        }

        await subscriptionRepo.removeAndFlush(subscription)
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }
}

export default RestockService