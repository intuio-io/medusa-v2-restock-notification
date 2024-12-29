"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestockService = void 0;
// src/services/restock.ts
const utils_1 = require("@medusajs/framework/utils");
const utils_2 = require("@medusajs/utils");
const restock_subscription_1 = require("../models/restock-subscription");
class RestockService extends (0, utils_1.MedusaService)({
    RestockSubscription: restock_subscription_1.RestockSubscription,
}) {
    constructor(container) {
        super(container);
        this.logger_ = container.logger;
        this.manager = container.manager;
    }
    async subscribe(variantId, email, productTitle, variantTitle) {
        try {
            if (!this.isValidEmail(email)) {
                throw new utils_2.MedusaError(utils_2.MedusaError.Types.INVALID_DATA, "Invalid email format");
            }
            // Query for the subscription
            const subscriptionRepo = this.manager.getRepository(restock_subscription_1.RestockSubscription);
            const existingSubscription = await subscriptionRepo.findOne({
                email,
                variant_id: variantId,
                notified: false,
            });
            if (existingSubscription) {
                throw new utils_2.MedusaError(utils_2.MedusaError.Types.DUPLICATE_ERROR, `Already subscribed to restock notifications for this product`);
            }
            // Create new subscription
            const subscription = subscriptionRepo.create({
                email,
                variant_id: variantId,
                product_title: productTitle,
                variant_title: variantTitle,
                notified: false,
            });
            this.manager.persist(subscription);
            await this.manager.flush();
            return subscription;
        }
        catch (error) {
            this.logger_.error("Error in subscribe:", error);
            throw error;
        }
    }
    async getSubscribers(variantId) {
        const subscriptionRepo = this.manager.getRepository(restock_subscription_1.RestockSubscription);
        return await subscriptionRepo.find({
            variant_id: variantId,
            notified: false,
        }, {
            orderBy: [{ created_at: 'ASC' }]
        });
    }
    async markNotified(subscriptionIds) {
        const subscriptionRepo = this.manager.getRepository(restock_subscription_1.RestockSubscription);
        await subscriptionRepo.nativeUpdate({ id: { $in: subscriptionIds } }, { notified: true });
        await this.manager.flush();
    }
    async listSubscriptions(email) {
        const subscriptionRepo = this.manager.getRepository(restock_subscription_1.RestockSubscription);
        return await subscriptionRepo.find({ email }, { orderBy: [{ created_at: 'DESC' }] });
    }
    async getAllActiveSubscriptions() {
        const subscriptionRepo = this.manager.getRepository(restock_subscription_1.RestockSubscription);
        return await subscriptionRepo.find({
            notified: false
        }, {
            orderBy: [{ created_at: 'ASC' }]
        });
    }
    async isSubscribed(email, variantId) {
        const subscriptionRepo = this.manager.getRepository(restock_subscription_1.RestockSubscription);
        const subscription = await subscriptionRepo.findOne({
            email,
            variant_id: variantId,
            notified: false,
        });
        return {
            is_subscribed: !!subscription,
            subscription: subscription || undefined
        };
    }
    async removeSubscription(id, email) {
        const subscriptionRepo = this.manager.getRepository(restock_subscription_1.RestockSubscription);
        const subscription = await subscriptionRepo.findOne({
            id,
            email
        });
        if (!subscription) {
            throw new utils_2.MedusaError(utils_2.MedusaError.Types.NOT_FOUND, `Subscription with id ${id} not found for email ${email}`);
        }
        await subscriptionRepo.removeAndFlush(subscription);
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
exports.RestockService = RestockService;
exports.default = RestockService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdG9jay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9yZXN0b2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDBCQUEwQjtBQUMxQixxREFBeUQ7QUFDekQsMkNBQTZDO0FBRTdDLHlFQUFvRTtBQVFwRSxNQUFhLGNBQWUsU0FBUSxJQUFBLHFCQUFhLEVBQUM7SUFDOUMsbUJBQW1CLEVBQW5CLDBDQUFtQjtDQUN0QixDQUFDO0lBSUUsWUFBWSxTQUErQjtRQUN2QyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDaEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFBO1FBQy9CLElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQTtJQUNwQyxDQUFDO0lBRUQsS0FBSyxDQUFDLFNBQVMsQ0FDWCxTQUFpQixFQUNqQixLQUFhLEVBQ2IsWUFBb0IsRUFDcEIsWUFBb0I7UUFFcEIsSUFBSSxDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxJQUFJLG1CQUFXLENBQ2pCLG1CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFDOUIsc0JBQXNCLENBQ3pCLENBQUE7WUFDTCxDQUFDO1lBRUQsNkJBQTZCO1lBQzdCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsMENBQW1CLENBQUMsQ0FBQTtZQUN4RSxNQUFNLG9CQUFvQixHQUFHLE1BQU0sZ0JBQWdCLENBQUMsT0FBTyxDQUFDO2dCQUN4RCxLQUFLO2dCQUNMLFVBQVUsRUFBRSxTQUFTO2dCQUNyQixRQUFRLEVBQUUsS0FBSzthQUNsQixDQUFDLENBQUE7WUFFRixJQUFJLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sSUFBSSxtQkFBVyxDQUNqQixtQkFBVyxDQUFDLEtBQUssQ0FBQyxl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