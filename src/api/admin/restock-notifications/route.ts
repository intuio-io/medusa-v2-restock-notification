// src/api/admin/restock-notifications/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RestockService } from "../../../services/restock"
import { IProductModuleService, IInventoryService } from "@medusajs/types"
import { Modules } from "@medusajs/framework/utils"
import sgMail from "@sendgrid/mail"

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const restockService = req.scope.resolve<RestockService>("restock")
    const { variant_id } = req.query

    try {
        if (!variant_id) {
            res.status(400).json({ message: "variant_id is required" })
            return
        }

        const subscribers = await restockService.getSubscribers(variant_id as string)
        res.json({ subscribers })
    } catch (error) {
        res.status(400).json({ message: error.message })
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


export async function POST(req: MedusaRequest, res: MedusaResponse) {
    const restockService = req.scope.resolve<RestockService>("restock")
    const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)
    const inventoryService = req.scope.resolve<IInventoryService>(Modules.INVENTORY)
    const logger = req.scope.resolve("logger")

    try {
        const { variant_id }: any = req.body

        if (!variant_id) {
            res.status(400).json({
                message: "variant_id is required required"
            })
            return
        }

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

        // Get inventory items
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

        // Get subscribers
        const subscribers = await restockService.getSubscribers(variant_id)

        if (subscribers.length === 0) {
            res.json({ message: "No subscribers found" })
            return
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
        }))

        // Send emails in batches
        const BATCH_SIZE = 1000
        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            const batch: any = emails.slice(i, i + BATCH_SIZE)
            try {
                await sgMail.send(batch)
                logger.info(`Sent restock notifications batch ${i / BATCH_SIZE + 1}`)
            } catch (error) {
                logger.error(`Failed to send email batch: ${error.message}`)
                throw error
            }
        }

        // Mark notifications as sent
        await restockService.markNotified(subscribers.map(sub => sub.id))

        res.json({
            message: "Notifications sent successfully",
            count: subscribers.length,
            stock_quantity: stockQuantity
        })
    } catch (error) {
        logger.error(`Error in restock notification: ${error.message}`)
        res.status(400).json({
            message: "Failed to send notifications",
            error: error.message
        })
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

export const AUTHENTICATE = false;