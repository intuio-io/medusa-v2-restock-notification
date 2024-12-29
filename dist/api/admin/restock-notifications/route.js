"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTHENTICATE = void 0;
exports.GET = GET;
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const mail_1 = __importDefault(require("@sendgrid/mail"));
// Initialize SendGrid
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY || '');
async function GET(req, res) {
    const restockService = req.scope.resolve("restock");
    const { variant_id } = req.query;
    try {
        if (!variant_id) {
            res.status(400).json({ message: "variant_id is required" });
            return;
        }
        const subscribers = await restockService.getSubscribers(variant_id);
        res.json({ subscribers });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}
/*
http://localhost:9000/admin/restock-notifications?variant_id=variant_01JFVPNW5RWNWCZH84CT3ERDHV
response
{
    "subscribers": [
        {
            "id": "res_01JG97HBA07K1R28N0DAG3SHPG",
            "email": "kris@intuio.io",
            "variant_id": "variant_01JFVPNW5RWNWCZH84CT3ERDHV",
            "product_title": "Medusa T-Shirt",
            "variant_title": "M / Black",
            "notified": false,
            "created_at": "2024-12-29T12:51:26.144Z",
            "updated_at": "2024-12-29T12:51:26.144Z"
        }
    ]
}
*/
async function POST(req, res) {
    const restockService = req.scope.resolve("restock");
    const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
    const inventoryService = req.scope.resolve(utils_1.Modules.INVENTORY);
    const logger = req.scope.resolve("logger");
    try {
        const { variant_id } = req.body;
        if (!variant_id) {
            res.status(400).json({
                message: "variant_id is required required"
            });
            return;
        }
        const variantDetails = await productService.listProductVariants({
            id: [variant_id],
        }, {
            relations: ["options", "product"],
        });
        if (!variantDetails?.length) {
            res.status(404).json({ message: "Variant not found" });
            return;
        }
        const variant = variantDetails[0];
        const variantSku = variant.sku;
        if (!variantSku) {
            logger.warn(`Variant ${variant_id} has no SKU`);
            res.status(400).json({ message: "Variant has no SKU" });
            return;
        }
        // Get product details
        const product = await productService.retrieveProduct(variant.product_id);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        // Get inventory items
        const inventoryItems = await inventoryService.listInventoryItems({});
        const inventoryItem = inventoryItems.find(item => item.sku === variantSku);
        if (!inventoryItem) {
            logger.warn(`No inventory item found for SKU ${variantSku}`);
            res.status(404).json({ message: "No inventory item found" });
            return;
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
        if (stockQuantity > 0) {
            res.status(400).json({
                message: "Product is currently in stock",
                stock_quantity: stockQuantity
            });
            return;
        }
        // Get subscribers
        const subscribers = await restockService.getSubscribers(variant_id);
        if (subscribers.length === 0) {
            res.json({ message: "No subscribers found" });
            return;
        }
        // Prepare email data
        const emails = subscribers.map(subscriber => ({
            to: subscriber.email,
            from: {
                email: process.env.SENDGRID_FROM || '',
                name: process.env.STORE_NAME || 'Your Store'
            },
            templateId: process.env.SENDGRID_RESTOCK_TEMPLATE_ID,
            dynamicTemplateData: {
                product_title: product.title,
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
                throw error;
            }
        }
        // Mark notifications as sent
        await restockService.markNotified(subscribers.map(sub => sub.id));
        res.json({
            message: "Notifications sent successfully",
            count: subscribers.length,
            stock_quantity: stockQuantity
        });
    }
    catch (error) {
        logger.error(`Error in restock notification: ${error.message}`);
        res.status(400).json({
            message: "Failed to send notifications",
            error: error.message
        });
    }
}
/*
POST Request
http://localhost:9000/admin/restock-notifications

body
{
    "variant_id": "variant_01JFVPNW5RWNWCZH84CT3ERDHV"
}

response
{
    "message": "Notifications sent successfully",
    "count": 1,
    "stock_quantity": 0
}
*/
exports.AUTHENTICATE = false;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Jlc3RvY2stbm90aWZpY2F0aW9ucy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFVQSxrQkFlQztBQXNCRCxvQkErSEM7QUExS0QscURBQW1EO0FBQ25ELDBEQUFtQztBQUVuQyxzQkFBc0I7QUFDdEIsY0FBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQyxDQUFBO0FBRTdDLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUM3RCxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBaUIsU0FBUyxDQUFDLENBQUE7SUFDbkUsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUE7SUFFaEMsSUFBSSxDQUFDO1FBQ0QsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFBO1lBQzNELE9BQU07UUFDVixDQUFDO1FBRUQsTUFBTSxXQUFXLEdBQUcsTUFBTSxjQUFjLENBQUMsY0FBYyxDQUFDLFVBQW9CLENBQUMsQ0FBQTtRQUM3RSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQTtJQUM3QixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ3BELENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBaUJFO0FBR0ssS0FBSyxV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