"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = checkInventoryJob;
const utils_1 = require("@medusajs/framework/utils");
const mail_1 = __importDefault(require("@sendgrid/mail"));
async function checkInventoryJob(container) {
    const logger = container.resolve("logger");
    const restockService = container.resolve("restock");
    const productService = container.resolve(utils_1.Modules.PRODUCT);
    const inventoryService = container.resolve(utils_1.Modules.INVENTORY);
    try {
        logger.info("Starting inventory check job");
        // Get all variants that have subscribers
        const allSubscriptions = await restockService.getAllActiveSubscriptions();
        // Group subscriptions by variant ID
        const variantSubscriptions = allSubscriptions.reduce((acc, sub) => {
            if (!acc[sub.variant_id]) {
                acc[sub.variant_id] = [];
            }
            acc[sub.variant_id].push(sub);
            return acc;
        }, {});
        // Process each variant
        for (const subscription of Object.entries(variantSubscriptions)) {
            const [variantId, subscribers] = subscription;
            try {
                // Get variant details from product service
                const variantDetails = await productService.listProductVariants({
                    id: [variantId],
                }, {
                    relations: ["product"]
                });
                if (!variantDetails?.length) {
                    logger.warn(`Variant ${variantId} not found`);
                    continue;
                }
                const variant = variantDetails[0];
                const variantSku = variant.sku;
                if (!variantSku) {
                    logger.warn(`Variant ${variantId} has no SKU`);
                    continue;
                }
                // Get inventory items by SKU
                const inventoryItems = await inventoryService.listInventoryItems({});
                const inventoryItem = inventoryItems.find(item => item.sku === variantSku);
                if (!inventoryItem) {
                    logger.warn(`No inventory item found for SKU ${variantSku}`);
                    continue;
                }
                // Get inventory levels for this item
                const levels = await inventoryService.listInventoryLevels({
                    inventory_item_id: inventoryItem.id
                });
                // Calculate total stock quantity
                let stockQuantity = 0;
                for (const level of levels) {
                    stockQuantity += level.stocked_quantity || 0;
                }
                // If item is in stock, notify subscribers
                if (stockQuantity > 0) {
                    logger.info(`Processing notifications for variant ${variantId} with stock ${stockQuantity}`);
                    // Prepare email data
                    const emails = subscribers.map(subscriber => ({
                        to: subscriber.email,
                        from: {
                            email: process.env.SENDGRID_FROM || '',
                            name: process.env.STORE_NAME || 'Your Store'
                        },
                        templateId: process.env.SENDGRID_RESTOCK_TEMPLATE_ID,
                        dynamicTemplateData: {
                            product_title: variant.product.title,
                            variant_title: variant.title,
                            current_stock: stockQuantity
                        }
                    }));
                    // Send emails in batches
                    const BATCH_SIZE = 1000;
                    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
                        const batch = emails.slice(i, i + BATCH_SIZE);
                        try {
                            await mail_1.default.send(batch);
                            logger.info(`Sent restock notifications batch ${i / BATCH_SIZE + 1}`);
                        }
                        catch (error) {
                            logger.error(`Failed to send email batch: ${error.message}`);
                            continue;
                        }
                    }
                    // Mark subscribers as notified
                    await restockService.markNotified(subscribers.map(sub => sub.id));
                    logger.info(`Marked ${subscribers.length} subscribers as notified for variant ${variantId}`);
                }
            }
            catch (error) {
                logger.error(`Error processing variant ${variantId}: ${error.message}`);
                continue; // Continue with next variant even if one fails
            }
        }
        logger.info("Completed inventory check job");
    }
    catch (error) {
        logger.error("Failed to process inventory check job:", error);
        throw error;
    }
}
exports.config = {
    name: "check-inventory-restock",
    schedule: "*/5 * * * *", // Run every 5 minutes
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2staW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2pvYnMvY2hlY2staW52ZW50b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQU1BLG9DQWdIQztBQXBIRCxxREFBbUQ7QUFFbkQsMERBQW1DO0FBRXBCLEtBQUssVUFBVSxpQkFBaUIsQ0FBQyxTQUEwQjtJQUN0RSxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQzFDLE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFtQixDQUFBO0lBQ3JFLE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQXdCLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUNoRixNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQW9CLGVBQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUVoRixJQUFJLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUE7UUFFM0MseUNBQXlDO1FBQ3pDLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxjQUFjLENBQUMseUJBQXlCLEVBQUUsQ0FBQTtRQUV6RSxvQ0FBb0M7UUFDcEMsTUFBTSxvQkFBb0IsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDOUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDdkIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUE7WUFDNUIsQ0FBQztZQUNELEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzdCLE9BQU8sR0FBRyxDQUFBO1FBQ2QsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxD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