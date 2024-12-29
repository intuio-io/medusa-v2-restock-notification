"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
async function GET(req, res) {
    const restockService = req.scope.resolve("restock");
    const { email } = req.query;
    try {
        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const subscriptions = await restockService.listSubscriptions(email);
        res.json({ subscriptions });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}
/*
http://localhost:9000/store/restock-notifications?email=kris@intuio.io
response
{
    "subscriptions": [
        {
            "id": "res_01JG97HBA07K1R28N0DAG3SHPG",
            "email": "kris@intuio.io",
            "variant_id": "variant_01JFVPNW5RWNWCZH84CT3ERDHV",
            "product_title": "Medusa T-Shirt",
            "variant_title": "M / Black",
            "notified": true,
            "created_at": "2024-12-29T12:51:26.144Z",
            "updated_at": "2024-12-29T12:51:26.144Z"
        },
        {
            "id": "res_01JG93K4DZEQA4CY1D024DQ386",
            "email": "kris@intuio.io",
            "variant_id": "variant_01JFVPNW5RWNWCZH84CT3ERDHV",
            "product_title": "Medusa T-Shirt",
            "variant_title": "M / Black",
            "notified": true,
            "created_at": "2024-12-29T11:42:30.335Z",
            "updated_at": "2024-12-29T11:42:30.335Z"
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
        const { variant_id, email } = req.body;
        if (!variant_id || !email) {
            res.status(400).json({ message: "variant_id and email are required" });
            return;
        }
        // Get variant details including SKU
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
        // Get inventory items by SKU
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
        // Create subscription if out of stock
        const subscription = await restockService.subscribe(variant_id, email, product.title, variant.title);
        res.json({
            subscription,
            product_id: variant.product_id,
            variant_title: variant.title
        });
    }
    catch (error) {
        logger.error("Error in restock notification:", error);
        res.status(400).json({ message: error.message });
    }
}
/*
POST Request
http://localhost:9000/store/restock-notifications

body
{
    "email": "kris@intuio.io",
    "variant_id": "variant_01JFVPNW5RWNWCZH84CT3ERDHV"
}
response
{
    "subscription": {
        "id": "res_01JG99JWX6YQEWST8VYBVRACVT",
        "notified": false,
        "created_at": "2024-12-29T13:27:14.085Z",
        "updated_at": "2024-12-29T13:27:14.085Z",
        "email": "kris@intuio.io",
        "variant_id": "variant_01JFVPNW5RWNWCZH84CT3ERDHV",
        "product_title": "Medusa T-Shirt",
        "variant_title": "M / Black"
    },
    "product_id": "prod_01JFVPNW472YJRSKQ59311HTVN",
    "variant_title": "M / Black"
}
*/ 
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3Jlc3RvY2stbm90aWZpY2F0aW9ucy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUtBLGtCQWVDO0FBZ0NELG9CQXlGQztBQTFJRCxxREFBbUQ7QUFFNUMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQzdELE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFpQixTQUFTLENBQUMsQ0FBQTtJQUNuRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQTtJQUUzQixJQUFJLENBQUM7UUFDRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDVCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUE7WUFDdEQsT0FBTTtRQUNWLENBQUM7UUFFRCxNQUFNLGFBQWEsR0FBRyxNQUFNLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFlLENBQUMsQ0FBQTtRQUM3RSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQTtJQUMvQixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ3BELENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQTJCRTtBQUdLLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUM5RCxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBaUIsU0FBUyxDQUFD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