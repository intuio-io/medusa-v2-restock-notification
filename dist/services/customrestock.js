"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/restock.ts
const utils_1 = require("@medusajs/framework/utils");
const utils_2 = require("@medusajs/utils");
const restock_subscription_1 = require("../models/restock-subscription");
class CustomrestockService extends (0, utils_1.MedusaService)({
    RestockSubscription: restock_subscription_1.RestockSubscription,
}) {
    // constructor(container: InjectedDependencies) {
    //     super(container)
    //     this.logger_ = container.logger
    //     this.manager = container.manager
    //     this.productModuleService_ = container.productModuleService
    //     this.inventoryModuleService_ = container.inventoryModuleService
    // }
    constructor({ logger, manager, productModuleService, inventoryModuleService }) {
        super(...arguments);
        this.logger_ = logger;
        this.manager = manager;
        this.productModuleService_ = productModuleService;
        this.inventoryModuleService_ = inventoryModuleService;
    }
    async getVariantStock(variantId) {
        try {
            // Get inventory items
            const inventoryItems = await this.inventoryModuleService_.listInventoryItems({});
            let stockQuantity = 0;
            // Calculate total stock from all inventory items
            for (const item of inventoryItems) {
                const levels = await this.inventoryModuleService_.listInventoryLevels({
                    inventory_item_id: item.id
                });
                for (const level of levels) {
                    stockQuantity += level.stocked_quantity || 0;
                }
            }
            return stockQuantity;
        }
        catch (error) {
            this.logger_.warn(`Failed to get inventory for variant ${variantId}`);
            return 0;
        }
    }
    async subscribe(variantId, email) {
        try {
            if (!this.isValidEmail(email)) {
                throw new utils_2.MedusaError(utils_2.MedusaError.Types.INVALID_DATA, "Invalid email format");
            }
            // Get product and variant
            const [productId] = variantId.split('_');
            const product = await this.productModuleService_.retrieveProduct(productId, {
                select: ["id", "title"],
                relations: ["variants"]
            });
            if (!product) {
                throw new utils_2.MedusaError(utils_2.MedusaError.Types.NOT_FOUND, `Product not found for variant ${variantId}`);
            }
            const variant = product.variants.find(v => v.id === variantId);
            if (!variant) {
                throw new utils_2.MedusaError(utils_2.MedusaError.Types.NOT_FOUND, `Variant with id ${variantId} not found`);
            }
            // Check inventory
            const stockQuantity = await this.getVariantStock(variantId);
            if (stockQuantity > 0) {
                throw new utils_2.MedusaError(utils_2.MedusaError.Types.INVALID_DATA, `Product ${product.title} - ${variant.title} is currently in stock`);
            }
            const subscriptionRepo = this.manager.getRepository(restock_subscription_1.RestockSubscription);
            const existingSubscription = await subscriptionRepo.findOne({
                email,
                variant_id: variantId,
                notified: false,
            });
            if (existingSubscription) {
                throw new utils_2.MedusaError(utils_2.MedusaError.Types.DUPLICATE_ERROR, `Already subscribed to restock notifications for this product`);
            }
            const subscription = subscriptionRepo.create({
                email,
                variant_id: variantId,
                product_title: product.title,
                variant_title: variant.title,
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
exports.default = CustomrestockService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tcmVzdG9jay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9jdXN0b21yZXN0b2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMEJBQTBCO0FBQzFCLHFEQUF5RDtBQUN6RCwyQ0FBNkM7QUFFN0MseUVBQW9FO0FBWXBFLE1BQU0sb0JBQXFCLFNBQVEsSUFBQSxxQkFBYSxFQUFDO0lBQzdDLG1CQUFtQixFQUFuQiwwQ0FBbUI7Q0FDdEIsQ0FBQztJQU1FLGlEQUFpRDtJQUNqRCx1QkFBdUI7SUFDdkIsc0NBQXNDO0lBQ3RDLHVDQUF1QztJQUN2QyxrRUFBa0U7SUFDbEUsc0VBQXNFO0lBQ3RFLElBQUk7SUFFSixZQUFZLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxzQkFBc0IsRUFBd0I7UUFDL0YsS0FBSyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUE7UUFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7UUFDckIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFDdEIsSUFBSSxDQUFDLHFCQUFxQixHQUFHLG9CQUFvQixDQUFBO1FBQ2pELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxzQkFBc0IsQ0FBQTtJQUN6RCxDQUFDO0lBR0QsS0FBSyxDQUFDLGVBQWUsQ0FBQyxTQUFpQjtRQUNuQyxJQUFJLENBQUM7WUFDRCxzQkFBc0I7WUFDdEIsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDaEYsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFBO1lBRXJCLGlEQUFpRDtZQUNqRCxLQUFLLE1BQU0sSUFBSSxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQztvQkFDbEUsaUJBQWlCLEVB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