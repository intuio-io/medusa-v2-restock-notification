// src/api/store/restock-notifications/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RestockService } from "../../../services/restock"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const restockService = req.scope.resolve<RestockService>("restock")
    const { email } = req.query

    try {
        if (!email) {
            res.status(400).json({ message: "Email is required" })
            return
        }

        const subscriptions = await restockService.listSubscriptions(email as string)
        res.json({ subscriptions })
    } catch (error) {
        res.status(400).json({ message: error.message })
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


export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const restockService = req.scope.resolve<RestockService>("restock")
    const productService = req.scope.resolve(Modules.PRODUCT)
    const inventoryService = req.scope.resolve(Modules.INVENTORY)
    const logger = req.scope.resolve("logger")

    try {
        const { variant_id, email }: any = req.body

        if (!variant_id || !email) {
            res.status(400).json({ message: "variant_id and email are required" })
            return
        }

        // Get variant details including SKU
        const variantDetails = await productService.listProductVariants({
            id: [variant_id],
        }, {
            relations: ["options", "product"],
        })

        if (!variantDetails?.length) {
            res.status(404).json({ message: "Variant not found" })
            return
        }

        const variant: any = variantDetails[0]
        const variantSku = variant.sku

        if (!variantSku) {
            logger.warn(`Variant ${variant_id} has no SKU`)
            res.status(400).json({ message: "Variant has no SKU" })
            return
        }

        // Get product details
        const product = await productService.retrieveProduct(variant.product_id)

        if (!product) {
            res.status(404).json({ message: "Product not found" })
            return
        }

        // Get inventory items by SKU
        const inventoryItems = await inventoryService.listInventoryItems({})
        const inventoryItem = inventoryItems.find(item => item.sku === variantSku)

        if (!inventoryItem) {
            logger.warn(`No inventory item found for SKU ${variantSku}`)
            res.status(404).json({ message: "No inventory item found" })
            return
        }

        // Get inventory levels for this item
        const levels = await inventoryService.listInventoryLevels({
            inventory_item_id: inventoryItem.id
        })

        // Calculate total stock quantity
        let stockQuantity = 0
        for (const level of levels) {
            stockQuantity += level.stocked_quantity || 0
        }

        if (stockQuantity > 0) {
            res.status(400).json({
                message: "Product is currently in stock",
                stock_quantity: stockQuantity
            })
            return
        }

        // Create subscription if out of stock
        const subscription = await restockService.subscribe(
            variant_id,
            email,
            product.title,
            variant.title
        )

        res.json({
            subscription,
            product_id: variant.product_id,
            variant_title: variant.title
        })
    } catch (error) {
        logger.error("Error in restock notification:", error)
        res.status(400).json({ message: error.message })
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